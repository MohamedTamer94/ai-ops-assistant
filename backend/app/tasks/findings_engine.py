from app.utils.findings_rules import apply_generic_error_rules, apply_rules_to_message
from app.crud.ingestions import get_top_fingerprints_for_ingestion, get_evidence_ids_for_fingerprint
from app.db import SessionLocal
from app.models.log_event import LogEvent
from app.celery_worker import celery
from app.models.finding import Finding
from app.models.ingestion import Ingestion


MAX_EVIDENCE_PER_RULE = 12
MAX_FPS_PER_RULE_IN_SUMMARY = 10

@celery.task
def analyze_logs_for_findings(ingestion_id: str):
    db = SessionLocal()
    try:
        ingestion = db.query(Ingestion).filter(Ingestion.id == ingestion_id).first()
        if not ingestion:
            return
        ingestion.finding_status = "processing"
        db.commit()
        # Pass 1 - get top fingerprints for ingestion and apply rules to their latest message
        fingerprints_finding = run_rules_test_on_groups(db, ingestion_id)
        # Pass 2 - run rules against error events directly to catch any matches that might not be top volume but still important
        errors_finding = run_rules_test_on_errors(db, ingestion_id, findings_by_rule=fingerprints_finding)
        # finalize formatting (sort fingerprints, drop internal helper)
        findings = list(errors_finding.values())
        for f in findings:
            f["matched_fingerprints"].sort(key=lambda x: x["count"], reverse=True)
            f["matched_fingerprints"] = f["matched_fingerprints"][:MAX_FPS_PER_RULE_IN_SUMMARY]
            f.pop("_evidence_set", None)
            f.pop("_fps_set", None)

        # sort findings by severity then volume
        sev_rank = {"CRIT": 4, "HIGH": 3, "MED": 2, "LOW": 1}
        findings.sort(key=lambda x: (sev_rank.get(x["severity"], 0), x["total_occurrences"]), reverse=True)
        # Delete old findings for this ingestion
        db.query(Finding).filter(Finding.ingestion_id == ingestion_id).delete()
        # Insert new findings into the database
        findings_db = []
        for f in findings:
            finding = Finding(
                ingestion_id=ingestion_id,
                rule_id=f["rule_id"],
                title=f["title"],
                severity=f["severity"],
                confidence=f["confidence"],
                total_occurrences=f["total_occurrences"],
                matched_fingerprints=f["matched_fingerprints"],
                evidence_event_ids=f["evidence_event_ids"],
            )
            findings_db.append(finding)
        db.add_all(findings_db)
        ingestion.finding_status = "done"
        db.commit()
    except Exception as e:
        if ingestion:
            ingestion.finding_status = "failed"
            db.commit()
        raise e
    finally:
        db.close()

def run_rules_test_on_errors(db, ingestion_id: str, findings_by_rule=None):
    if findings_by_rule is None:
        findings_by_rule = {}
    errors = db.query(LogEvent).filter(LogEvent.ingestion_id == ingestion_id, LogEvent.level.in_(["ERROR", "CRITICAL", "FATAL"])).order_by(LogEvent.seq.desc()).limit(5000).all()
    for error in errors:
        matches = apply_rules_to_message(error.message)
        if not matches:
            # heuristic: if no rules match, check more generic errors
            if apply_generic_error_rules(error.message):
                matches.append({
                    "rule_id": "generic_error",
                    "title": "Generic error pattern match",
                    "severity": "CRIT" if error.level in ["CRITICAL", "FATAL"] else "HIGH",
                    "confidence": 0.5,
                })
            else:
                continue
        for m in matches:
            rid = m["rule_id"]
            if rid not in findings_by_rule:
                findings_by_rule[rid] = {
                    "rule_id": rid,
                    "title": m["title"],
                    "severity": m["severity"],
                    "confidence": m["confidence"],
                    "total_occurrences": 1,
                    "matched_fingerprints": [{"fingerprint": error.fingerprint, "count": 1}],
                    "evidence_event_ids": [str(error.id)],
                    "_evidence_set": {error.id},  # internal helper for dedup
                    "_fps_set": {error.fingerprint},  # internal helper to track which fps we've added for this rule
                }
            else:
                f = findings_by_rule[rid]
                if len(f["matched_fingerprints"]) < MAX_FPS_PER_RULE_IN_SUMMARY and error.fingerprint not in f["_fps_set"]:
                    f["matched_fingerprints"].append({"fingerprint": error.fingerprint, "count": 1})
                    f["_fps_set"].add(error.fingerprint)
                if len(f["evidence_event_ids"]) < MAX_EVIDENCE_PER_RULE and error.id not in f["_evidence_set"]:
                    f["evidence_event_ids"].append(str(error.id))
                    f["_evidence_set"].add(error.id)
                f["total_occurrences"] += 1
                
    return findings_by_rule

def run_rules_test_on_groups(db, ingestion_id: str, limit_fps: int = 100):
    # Find top fingerprints for the ingestion
    groups = get_top_fingerprints_for_ingestion(db, ingestion_id=ingestion_id, limit=200)  # limit to top 200 groups to keep processing time reasonable
    findings_by_rule = {}

    for g in groups:
        fp = g["fingerprint"]
        count = int(g["count"])
        latest = g["latest"]  # likely dict from serialize_log
        msg = latest.get("message", "")

        matches = apply_rules_to_message(msg)
        if not matches:
            continue

        # fetch evidence once per fingerprint (even if multiple rules match)
        evidence_ids = get_evidence_ids_for_fingerprint(db, ingestion_id, fp, head=5, tail=5)

        for m in matches:
            rid = m["rule_id"]

            if rid not in findings_by_rule:
                findings_by_rule[rid] = {
                    "rule_id": rid,
                    "title": m["title"],
                    "severity": m["severity"],
                    "confidence": m["confidence"],
                    "total_occurrences": 0,
                    "matched_fingerprints": [],  # list of {fingerprint, count}
                    "evidence_event_ids": [],
                    "_evidence_set": set(),      # internal helper for dedup
                    "_fps_set": set(),          # internal helper to track which fps we've added for this rule
                }

            f = findings_by_rule[rid]

            # aggregate counts + fingerprints
            f["total_occurrences"] += count
            f["matched_fingerprints"].append({"fingerprint": fp, "count": count})
            f["_fps_set"].add(fp)

            # merge evidence with cap
            for eid in evidence_ids:
                if len(f["evidence_event_ids"]) >= MAX_EVIDENCE_PER_RULE:
                    break
                if eid not in f["_evidence_set"]:
                    f["_evidence_set"].add(eid)
                    f["evidence_event_ids"].append(str(eid))

    return findings_by_rule

