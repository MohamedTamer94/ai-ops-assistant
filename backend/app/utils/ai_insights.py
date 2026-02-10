import json

from app.utils.groq_client import chat_completion

SYSTEM_PROMPT = """You are a production incident analysis assistant.

Hard rules:
- Use ONLY the provided context. Do not assume details not in the context.
- If something is uncertain or missing, say "Unknown" or "Not enough data".
- Never invent stack traces, metrics, code, or service behavior.
- Do not reveal secrets. If the context contains tokens/credentials, treat them as redacted placeholders.
- Keep output concise and actionable.

Output format:
- Return Markdown only.
- Use the exact headings requested.
- When referencing evidence, cite event sequence numbers like: (evidence: seq 12, seq 18).
"""

def generate_prompt(insight_data: dict) -> list[dict]:
    # Make sure events exist and are compact
    ctx = {
        "type": insight_data.get("type"),
        # include everything else as-is
        **{k: v for k, v in insight_data.items() if k != "events"},
        "events": insight_data.get("events", []),
    }

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if insight_data["type"] == "group":
        user_prompt = f"""
You will explain a log GROUP (same fingerprint). Produce an incident-style explanation.

Context (JSON, redacted):
{json.dumps(ctx, ensure_ascii=False)}

Tasks:
1) Summarize what this group represents in 2-4 sentences using ONLY the context.
2) Identify the strongest signals (level/service/time-range/message pattern).
3) Provide up to 3 likely root causes with confidence scores (0-100) and justification tied to evidence.
4) Provide a "Next checks" list of 5-8 concrete debugging steps.
5) Provide "Immediate mitigations" (safe actions) and "Longer-term fixes" (engineering actions).

Constraints:
- If timestamps are missing, do not infer timing. Use seq ordering only.
- If service is missing/unknown, do not guess; propose how to find it.
- If the message is generic, say so and focus on what can be confirmed.
- Do not mention other groups unless explicitly present in context.

Return Markdown with exactly these headings:

## Summary
## What we know from evidence
## Likely causes
## Next checks
## Mitigations
## Longer-term fixes
## Evidence cited

Evidence citing rules:
- In each section, cite evidence as: (evidence: seq X, seq Y)
- In "Evidence cited", list the seq numbers you referenced grouped by why they matter.
""".strip()

        messages.append({"role": "user", "content": user_prompt})
        return messages

    if insight_data["type"] == "finding":
        user_prompt = f"""
You will explain a RULE-BASED FINDING detected from logs.

Context (JSON, redacted):
{json.dumps(ctx, ensure_ascii=False)}

Tasks:
1) Explain what this finding means in plain language (1 paragraph).
2) Explain why the system flagged it: what patterns matched, and what evidence supports it.
3) Assess severity and impact using ONLY the context (if impact is unknown, say unknown).
4) Provide 5-8 targeted debugging steps.
5) Provide "Fix suggestions" split into quick fixes vs durable fixes.
6) If multiple fingerprints are involved, compare them briefly (what's common vs different).

Constraints:
- Do not claim the exact root cause unless it is explicitly shown in evidence.
- If rule_id is "generic_error", explain that it is broad and requires triage.
- Keep advice technology-agnostic unless evidence clearly indicates a stack (e.g., Java traceback).
- Cite evidence by seq numbers only.

Return Markdown with exactly these headings:

## What this finding means
## Why it was flagged
## Severity and impact
## Debugging steps
## Fix suggestions
## Evidence cited

Evidence citing rules:
- Every claim must be backed by evidence citations where possible: (evidence: seq X, seq Y)
- "Evidence cited" should list the key seq numbers and what each shows.
""".strip()

        messages.append({"role": "user", "content": user_prompt})
        return messages

    raise ValueError(f"Unknown insight_data['type']: {insight_data.get('type')}")

def generate_insights(insight_data: dict):
    messages = generate_prompt(insight_data)
    result = chat_completion(messages)
    return result
