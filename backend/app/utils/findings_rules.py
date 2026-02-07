# rules.py
import re

SEVERITY = ("LOW", "MED", "HIGH", "CRIT")

RULES = [
    {
        "id": "db_connection_failure",
        "title": "Database connection failures",
        "severity": "HIGH",
        "confidence": 0.85,
        "regex": [
            r"\bconnection refused\b",
            r"\beconnrefused\b",
            r"\bno route to host\b",
            r"\btimeout acquiring connection\b",
            r"\bconnection timed out\b",
            r"\btoo many connections\b",
        ],
    },
    {
        "id": "db_auth_failure",
        "title": "Database authentication/permission errors",
        "severity": "HIGH",
        "confidence": 0.80,
        "regex": [
            r"\bpassword authentication failed\b",
            r"\bauthentication failed\b",
            r"\baccess denied for user\b",
            r"\bpermission denied\b",
            r"\brole .* does not exist\b",
        ],
    },
    {
        "id": "http_rate_limited",
        "title": "Rate limiting (HTTP 429 / too many requests)",
        "severity": "MED",
        "confidence": 0.80,
        "regex": [
            r"\b429\b",
            r"\btoo many requests\b",
            r"\brate limit(ed|ing)?\b",
            r"\bthrottl(ed|ing)\b",
        ],
    },
    {
        "id": "auth_token_expired",
        "title": "Auth token/session expired",
        "severity": "MED",
        "confidence": 0.75,
        "regex": [
            r"\bjwt expired\b",
            r"\btoken expired\b",
            r"\bsession expired\b",
            r"\bexpired signature\b",
        ],
    },
    {
        "id": "invalid_credentials",
        "title": "Invalid credentials / login failures",
        "severity": "MED",
        "confidence": 0.70,
        "regex": [
            r"\binvalid credentials\b",
            r"\blogin failed\b",
            r"\bwrong password\b",
            r"\bunauthorized\b",
            r"\b401\b",
        ],
    },
    {
        "id": "oom_memory",
        "title": "Out of memory / heap exhaustion",
        "severity": "CRIT",
        "confidence": 0.90,
        "regex": [
            r"\bout of memory\b",
            r"\boomed\b",
            r"\bjava\.lang\.outofmemoryerror\b",
            r"\bcannot allocate memory\b",
            r"\bmalloc\(\) failed\b",
            r"\bheap space\b",
            r"\bkilled process .* out of memory\b",
        ],
    },
    {
        "id": "disk_full",
        "title": "Disk full / no space left",
        "severity": "HIGH",
        "confidence": 0.85,
        "regex": [
            r"\bno space left on device\b",
            r"\bdisk quota exceeded\b",
            r"\bfilesystem is full\b",
            r"\benospc\b",
        ],
    },
    {
        "id": "tls_cert_failure",
        "title": "TLS/SSL handshake or certificate failures",
        "severity": "HIGH",
        "confidence": 0.80,
        "regex": [
            r"\bcertificate verify failed\b",
            r"\bself[- ]signed certificate\b",
            r"\bssl handshake failed\b",
            r"\btls handshake failed\b",
            r"\bunknown ca\b",
            r"\bcertificate has expired\b",
        ],
    },
    {
        "id": "upstream_timeout",
        "title": "Upstream timeouts / gateway errors",
        "severity": "HIGH",
        "confidence": 0.78,
        "regex": [
            r"\b504\b",
            r"\bgateway timeout\b",
            r"\bupstream timed out\b",
            r"\brequest timeout\b",
            r"\betimedout\b",
        ],
    },
    {
        "id": "payment_failure",
        "title": "Payment/charge failures",
        "severity": "HIGH",
        "confidence": 0.70,
        "regex": [
            r"\bpayment failed\b",
            r"\bcharge (declined|failed)\b",
            r"\binsufficient funds\b",
            r"\bcard declined\b",
            r"\bdo not honor\b",
        ],
    }
]

GENERIC_ERROR_RULES = [
    r"\bpanic\b",
    r"\bfail(ed|ure)?\b",
    r"\bexception\b",
    r"\bcritical\b",
    r"\bsegmentation fault\b",
    r"\bcore dumped\b",
    r"\bstack trace\b",
    r"\btraceback\b",
    r"\bunhandled\b",
    r"\bunexpected\b",
    r"\bfatal\b",
    r"\bsegfault\b",
    r"\bshutdown\b",
    r"'\bcrash(es|ed)?\b",
    r"\bdeadlock\b",
    r"\btimeout\b",
    r"\bcorrupted\b",
    r"\bdata loss\b",
]

COMPILED_GENERIC_ERROR_RULES = [re.compile(p, re.IGNORECASE) for p in GENERIC_ERROR_RULES]

# Optional: compile once (handy for the task)
COMPILED_RULES = [
    {**r, "patterns": [re.compile(p, re.IGNORECASE) for p in r["regex"]]}
    for r in RULES
]

def apply_rules_to_message(message: str):
    message = message or ""
    matches = []
    for rule in COMPILED_RULES:
        if any(p.search(message) for p in rule["patterns"]):
            matches.append({
                "rule_id": rule["id"],
                "title": rule["title"],
                "severity": rule["severity"],
                "confidence": rule["confidence"],
            })
    return matches

def apply_generic_error_rules(message: str):
    message = message or ""
    return any(p.search(message) for p in COMPILED_GENERIC_ERROR_RULES)