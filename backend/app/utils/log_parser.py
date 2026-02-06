from typing import Any, Optional
import re
import json
from dateutil import parser as date_parser
from dateutil.parser import ParserError

# ----------------------------
# Regex building blocks
# ----------------------------

# Timestamp-ish patterns near the start of a line
# Covers:
# 2026-02-05T12:34:56.123Z
# 2026-02-05T12:34:56+03:00
# 2026-02-05 12:34:56,123
# 2026-02-05 12:34:56
RE_TS_PREFIX = re.compile(
    r"""
    ^\s*
    (?P<ts>
        \d{4}-\d{2}-\d{2}
        (?:[ T]\d{2}:\d{2}(?::\d{2})?)?
        (?:[.,]\d{1,6})?
        (?:Z|[+-]\d{2}:\d{2})?
    )
    (?:\s+|$)
    """,
    re.VERBOSE,
)

# [2026-02-05 ...] style
RE_TS_BRACKET = re.compile(
    r"""^\s*\[\s*(?P<ts>\d{4}-\d{2}-\d{2}[^]]*)\]\s*""", re.VERBOSE
)

# Levels at the start: INFO ... or [ERROR] ...
RE_LEVEL_PREFIX = re.compile(
    r"""^\s*\[?(?P<level>INFO|WARN|WARNING|ERROR|DEBUG|TRACE|CRITICAL|FATAL)\]?\b[:\-]?\s*""",
    re.IGNORECASE,
)

# level=warn / severity=error / lvl=info ...
RE_LEVEL_KV = re.compile(
    r"""(?i)\b(?:level|severity|lvl)\s*=\s*(?P<level>info|warn|warning|error|debug|trace|critical|fatal)\b"""
)

# service=foo / svc=foo / app=foo / component=foo
RE_SERVICE_KV = re.compile(
    r"""(?i)\b(?:service|svc|app|component|source|logger)\s*=\s*(?P<svc>[A-Za-z0-9_.\-]+)\b"""
)

# service tag early: [payments] ...  (but must not be [ERROR] or [2026-...])
RE_BRACKET_TAG = re.compile(r"^\s*\[(?P<tag>[A-Za-z0-9_.\-]{2,})\]\s*")

# prefix "auth-service: message"
RE_PREFIX_COLON = re.compile(r"^\s*(?P<svc>[A-Za-z0-9_.\-]{2,})\s*:\s+(?P<rest>.+)$")

RE_SERVICE_TOKEN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.\-]{1,63}$")

RE_EXCEPTIONISH = re.compile(
    r"""(
        \b\w+(?:Error|Exception)\b.*:   # FooError: message
        |
        \b\w+(?:Error|Exception)\b$     # FooError
    )""",
    re.VERBOSE,
)

# Rough JSON line check
def looks_like_json_line(line: str) -> bool:
    t = line.strip()
    return t.startswith("{") and (t.endswith("}") or t.endswith("},") or t.endswith("}]") or t.endswith("}]},") )


def is_continuation(line: str) -> bool:
    """
    Continuation lines should NOT start a new record.
    Strong “glue” signals: indentation, stack trace patterns, blank lines.
    """
    s = line.rstrip("\n")
    if s and s[0].isspace():
        return True
    if s.startswith("at "):  # Java stack
        return True
    if "Caused by:" in s:
        return True
    if s.startswith("Traceback"):  # Python
        return True
    if s.startswith('File "'):  # Python traceback lines
        return True
    if s.startswith("..."):
        return True
    return False

def is_new_record(line: str) -> bool:
    """
    New-record signals (only if NOT a continuation).
    We keep these broad; false positives are mitigated by continuation override.
    """
    if is_continuation(line):
        return False
    

    s = line.lstrip()

    # Bracketed timestamp
    if RE_TS_BRACKET.match(s):
        return True

    # Timestamp at start
    if RE_TS_PREFIX.match(s):
        return True

    # Level prefix
    if RE_LEVEL_PREFIX.match(s):
        return True

    # JSON one-liner
    if looks_like_json_line(s):
        return True

    return False

def group_lines_into_record(lines: list[str]) -> list[list[str]]:
    records: list[list[str]] = []
    current_record: list[str] = []
    for line in lines:
        if is_new_record(line):
            if current_record:
                records.append(current_record)
                current_record = []
            current_record = [line]
        else:
            current_record.append(line)
    if current_record:
        records.append(current_record)
    return records

def first_nonempty_line(lines: list[str]) -> str:
    for line in lines:
        if line.strip():
            return line
    return ""

def parse_json_record(raw: str) -> Optional[dict[str, Any]]:
    header = first_nonempty_line(raw.splitlines())
    candidate = header.strip()
    if looks_like_json_line(candidate):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            return None
    return None

def normalize_level(level: str) -> str:
    lvl = level.upper()
    return "WARN" if lvl == "WARNING" else lvl

def extract_signature(raw: str, message: str) -> str:
    lines = [ln.rstrip() for ln in raw.splitlines()]
    non_empty = [ln.strip() for ln in lines if ln.strip()]
    if not non_empty:
        return message.strip()

    if len(non_empty) == 1:
        return message.strip() or non_empty[0]

    # Exception/stacktrace path (keep as before)
    picked: list[str] = []
    caused = next((ln.strip() for ln in non_empty if "Caused by:" in ln), None)
    if caused:
        picked.append(caused)

    exceptionish = next((ln for ln in reversed(lines)
                        if RE_EXCEPTIONISH.search(ln.strip())), None)
    
    if exceptionish:
        picked.append(exceptionish)

    traceback = next((ln.strip() for ln in non_empty if ln.strip().startswith("Traceback")), None)
    if traceback:
        if non_empty[-1] not in picked: # might be the same as exceptionish, avoid duplication
            picked.append(non_empty[-1])  # often the last line has the most relevant info in Python tracebacks

    if picked:
        # Include the top message too (optional but often helps)
        top = message.strip()
        if top and top not in picked:
            picked.insert(0, top)
        return " | ".join(picked)

    # Non-exception multiline: if the message is “generic”, add first continuation hint
    msg = (message or "").strip()
    generic = (msg.endswith(":") or len(msg) < 18)
    if generic:
        # take up to 2 continuation lines that are indented (likely details)
        cont = []
        for ln in lines[1:]:
            if ln.strip() and (ln[:1].isspace() or ln.startswith("\t")):
                cont.append(ln.strip())
            if len(cont) >= 2:
                break
        if cont:
            return msg + " | " + " | ".join(cont)

    return msg or non_empty[0]

def extract_ts_from_header(header: str) -> tuple[Optional[str], str, float, list[str]]:
    """
    Returns (ts_str, remaining_text, confidence, matched_tags).
    We keep ts as a string to be format-agnostic.
    """
    matched: list[str] = []

    # [ts] prefix
    m = RE_TS_BRACKET.match(header)
    if m:
        ts = m.group("ts").strip()
        rest = header[m.end():].lstrip()
        matched.append("ts:bracket")
        return ts, rest, 0.95, matched

    # direct ts prefix
    m = RE_TS_PREFIX.match(header)
    if m:
        ts = m.group("ts").strip()
        rest = header[m.end():].lstrip()
        # Heuristic confidence: date-only is weaker than date+time
        conf = 0.90 if re.search(r"\d{2}:\d{2}", ts) else 0.60
        matched.append("ts:prefix")
        return ts, rest, conf, matched

    return None, header.strip(), 0.0, matched

def extract_level_from_header(text: str) -> tuple[Optional[str], str, float, list[str]]:
    matched: list[str] = []

    m = RE_LEVEL_PREFIX.match(text)
    if m:
        lvl = normalize_level(m.group("level"))
        rest = text[m.end():].lstrip()
        matched.append("level:prefix")
        return lvl, rest, 0.90, matched

    m = RE_LEVEL_KV.search(text)
    if m:
        lvl = normalize_level(m.group("level"))
        # we do NOT remove it from text (it might be mid-line)
        matched.append("level:kv")
        return lvl, text.strip(), 0.70, matched

    return None, text.strip(), 0.0, matched

def extract_service_from_header(text: str) -> tuple[Optional[str], str, float, list[str]]:
    """
    “Service” is ambiguous, so we only promote when we see strong cues.
    """
    matched: list[str] = []

    m = RE_SERVICE_KV.search(text)
    if m:
        svc = m.group("svc")
        matched.append("service:kv")
        return svc, text.strip(), 0.85, matched

    # bracket tag: [payments] ...
    # but avoid [ERROR] and [2026-...]
    m = RE_BRACKET_TAG.match(text)
    if m:
        tag = m.group("tag")
        if not RE_LEVEL_PREFIX.match(f"[{tag}]") and not re.match(r"^\d{4}-\d{2}-\d{2}", tag):
            rest = text[m.end():].lstrip()
            matched.append("service:bracket_tag")
            return tag, rest, 0.60, matched

    # prefix colon: auth-service: message
    m = RE_PREFIX_COLON.match(text)
    if m:
        svc = m.group("svc")
        rest = m.group("rest").strip()
        matched.append("service:prefix_colon")
        return svc, rest, 0.65, matched

    return None, text.strip(), 0.0, matched


def peel_next_token_as_service(text: str) -> tuple[Optional[str], str, float, list[str]]:
    """
    If text begins with a service-like token, consume it and return it.
    """
    s = text.lstrip()
    if not s:
        return None, text.strip(), 0.0, []

    # token is up to first whitespace
    parts = s.split(None, 1)
    token = parts[0]
    rest = parts[1] if len(parts) == 2 else ""

    if RE_SERVICE_TOKEN.match(token):
        # avoid promoting obvious non-service tokens
        if token.upper() in {"INFO", "WARN", "WARNING", "ERROR", "DEBUG", "TRACE", "CRITICAL", "FATAL", "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "CONNECT", "TRACE"}:
            return None, text.strip(), 0.0, []
        # avoid date-like token
        if re.match(r"^\d{4}-\d{2}-\d{2}", token):
            return None, text.strip(), 0.0, []
        return token, rest.strip(), 0.70, ["service:next_token"]

    return None, text.strip(), 0.0, []

def build_message(header_rest: str, fallback_header: str) -> str:
    msg = header_rest.strip() or fallback_header.strip()
    if len(msg) > 300:
        msg = msg[:300] + "…"
    return msg

def parse_record(record_lines: list[str]) -> dict[str, Any]:
    raw = "\n".join(record_lines)
    header = first_nonempty_line(record_lines)
    record = {
        "raw": raw,
        "message": header,
        "ts": None,
        "ts_raw": None,
        "service": None,
        "level": None,
        "attrs": {},
        "parse": {"kind": "text", "confidence": 0.0, "matched": []},
    }

    # First try JSON parsing
    obj = parse_json_record(raw)
    if obj is not None:
        ts = obj.get("ts") or obj.get("time") or obj.get("timestamp") or obj.get("@timestamp") or obj.get("datetime")
        level = obj.get("level") or obj.get("severity") or obj.get("log.level")
        service = obj.get("service") or obj.get("service_name") or obj.get("app") or obj.get("component") or obj.get("logger") or obj.get("source")
        msg = obj.get("message") or obj.get("msg") or obj.get("event") or header
    
        record["ts_raw"] = str(ts) if ts is not None else None
        try:
            record["ts"] = date_parser.parse(ts) if ts else None
        except (ParserError, OverflowError):
            record["ts"] = None
        record["level"] = normalize_level(str(level)) if level is not None else None
        record["service"] = str(service) if service is not None else None
        record["message"] = str(msg).strip()[:300] + ("…" if len(str(msg).strip()) > 300 else "")
        record["attrs"] = obj  # keep entire JSON as attrs
        record["parse"] = {"kind": "json", "confidence": 0.95, "matched": ["json:loads"]}

        record["signature"] = extract_signature(record["raw"], record["message"])
        return record
    
    # ---- TEXT peeling strategy: ts -> level -> service -> message
    ts, rest, ts_conf, ts_tags = extract_ts_from_header(header)
    lvl, rest2, lvl_conf, lvl_tags = extract_level_from_header(rest)
    svc = None
    svc_conf = 0.0
    svc_tags: list[str] = []
    rest3 = rest2
    
    # docker-like heuristic: ts + level => next token is service
    if ts_conf >= 0.85 and lvl_conf >= 0.85:
        svc, rest3, svc_conf, svc_tags = peel_next_token_as_service(rest2)

    # fallback to other service extractors if not found
    if svc is None:
        svc, rest3, svc_conf, svc_tags = extract_service_from_header(rest2)

    record["ts_raw"] = ts
    try:
        record["ts"] = date_parser.parse(ts) if ts else None
    except (ParserError, OverflowError):
        record["ts"] = None
    record["level"] = lvl
    record["service"] = svc
    record["message"] = build_message(rest3, header)

    matched = ts_tags + lvl_tags + svc_tags
    # overall confidence is a simple aggregate of the best signals we found
    conf = max(ts_conf, 0.0) * 0.45 + max(lvl_conf, 0.0) * 0.35 + max(svc_conf, 0.0) * 0.20
    record["parse"] = {"kind": "text", "confidence": round(conf, 3), "matched": matched}

    record["signature"] = extract_signature(record["raw"], record["message"])
    return record

def parse_logs(logs: str) -> list[dict[str, Any]]:
    lines = logs.splitlines()
    grouped = group_lines_into_record(lines)
    return [parse_record(record) for record in grouped]