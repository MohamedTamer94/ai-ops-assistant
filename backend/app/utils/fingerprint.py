import hashlib
import re

UUID_PATTERN = r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
IP_PATTERN = r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
HEX_PATTERN = r"\b0x[0-9a-fA-F]+\b"
TIMESTAMP_PATTERN = r"\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b"
EMAIL_PATTERN = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
URL_PATTERN = r"\bhttps?://[^\s]+\b"
TOKEN_PATTERN = r"\b[a-zA-Z0-9]{20,}\b"

def make_fingerprint(log_text):
    normalized = normalize_for_fingerprint(log_text)
    normalized_bytes = normalized.encode("utf-8")
    fingerprint = hashlib.sha1(normalized_bytes).hexdigest()
    return fingerprint

def normalize_for_fingerprint(text):
    # Remove leading/trailing whitespace and convert to lowercase
    text = text.strip().lower()
    # Replace UUID patterns with a placeholder
    text = re.sub(UUID_PATTERN, "<uuid>", text)
    # Replace IP address patterns with a placeholder
    text = re.sub(IP_PATTERN, "<ip>", text)
    # Replace hexadecimal patterns with a placeholder
    text = re.sub(HEX_PATTERN, "<hex>", text)
    # Replace email address patterns with a placeholder
    text = re.sub(EMAIL_PATTERN, "<email>", text)
    # Replace URL patterns with a placeholder
    text = re.sub(URL_PATTERN, "<url>", text)
    # Replace token-like patterns with a placeholder
    text = re.sub(TOKEN_PATTERN, "<token>", text)
    # Replace timestamp patterns with a placeholder
    text = re.sub(TIMESTAMP_PATTERN, "<timestamp>", text)
    # Replace long numeric sequences (ports, ids, etc..) with a placeholder
    text = re.sub(r"\b\d{4,}\b", "<number>", text)
    # Collapse multiple spaces into one
    text = re.sub(r"\s+", " ", text)
    return text

