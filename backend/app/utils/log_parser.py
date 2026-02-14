from typing import Any, Optional, List, Tuple
import re
import json
from dateutil import parser as date_parser
from dateutil.parser import ParserError

# ----------------------------
# Regex building blocks - ENHANCED
# ----------------------------

# Timestamp patterns for your exact formats
# ISO 8601 with Z: 2024-11-29T14:59:45.123Z
# ISO with offset: 2024-11-29 14:59:45.234 UTC
# Standard: 2026-02-13 09:52:15.234 UTC
RE_TIMESTAMP = re.compile(
    r"""
    ^\s*
    (?P<ts>
        # ISO 8601 with T and Z/offset
        \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})
        |
        # Space separated with UTC
        \d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?\s+UTC
        |
        # Space separated no timezone
        \d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?
    )
    (?:\s+|$)
    """,
    re.VERBOSE,
)

# Bracket timestamp: [2024-11-29T14:59:45.123Z]
RE_TIMESTAMP_BRACKET = re.compile(
    r"""^\s*\[\s*(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?)\s*\]\s*""",
    re.VERBOSE
)

# Service in brackets: [auth-service[28]] or [web-gateway[34]] or db[postgres-15]
RE_SERVICE_BRACKET = re.compile(
    r"""
    ^\s*
    (?:\[[^\]]*\])?\s*                  # Optional timestamp bracket
    (?:
        # Format: [auth-service[28]]
        \[
            (?P<service_bracket>
                [a-zA-Z][a-zA-Z0-9_-]+       # service name
                (?:\[\d+\])?                  # optional [pid]
            )
        \]
        |
        # Format: db[postgres-15] (no outer brackets)
        (?P<service_db>
            db
        )
        \[
            (?P<db_instance>
                [a-zA-Z][a-zA-Z0-9_-]+        # db instance name (postgres-15, mysql-8, etc)
            )
        \]
    )
    """,
    re.VERBOSE
)

# Service prefix with colon: auth-service[28]: message
RE_SERVICE_COLON = re.compile(
    r"""
    ^\s*
    (?P<service>[a-zA-Z][a-zA-Z0-9_.-]+)
    (?:\[\d+\])?
    \s*:\s*
    """,
    re.VERBOSE
)

# Level detection - enhanced for your formats
RE_LEVEL = re.compile(
    r"""
    (?:
        \[
        \s*
        (?P<level_bracket>INFO|WARN|WARNING|ERROR|DEBUG|TRACE|CRITICAL|FATAL)
        \s*
        \]
        |
        \s
        (?P<level_prefix>INFO|WARN|WARNING|ERROR|DEBUG|TRACE|CRITICAL|FATAL)
        \s
        |
        \b(?:level|severity|lvl)\s*=\s*(?P<level_kv>info|warn|warning|error|debug|trace|critical|fatal)
        |
        \s
        (?P<level_standalone>INFO|WARN|WARNING|ERROR|DEBUG|TRACE|CRITICAL|FATAL)
        (?=\s|$)
    )
    """,
    re.IGNORECASE | re.VERBOSE
)

# req-id pattern for correlation
RE_REQUEST_ID = re.compile(r'\[?(?:req-id|request-id|trace-id|span-id):?\s*([a-f0-9-]+)\]?', re.IGNORECASE)

# User ID pattern
RE_USER_ID = re.compile(r'user[:_]?(\w+)', re.IGNORECASE)

# Exception patterns
RE_EXCEPTION = re.compile(
    r"""
    ^\s*
    (?:
        (?:javax?\.)?[\w.]+(?:Exception|Error)  # Java exceptions
        |
        Traceback\s*\(most\s*recent\s*call\s*last\):  # Python traceback
        |
        Caused\s+by:                               # Caused by chains
        |
        \s+at\s+[\w$.]+\(                         # Stack trace lines
    )
    """,
    re.VERBOSE
)

# HTTP status codes
RE_HTTP_STATUS = re.compile(r'\b(HTTP[/\d]*\s+)?(?P<status>[45]\d{2})\b')

# ----------------------------
# Helper functions
# ----------------------------

def normalize_level(level: str) -> str:
    """Normalize level to standard format"""
    if not level:
        return None
    lvl = level.upper().strip('[] ')
    mapping = {
        'WARNING': 'WARN',
        'FATAL': 'CRITICAL',
        'TRACE': 'DEBUG'
    }
    return mapping.get(lvl, lvl)

def looks_like_json_line(line: str) -> bool:
    """Check if line looks like JSON"""
    t = line.strip()
    return (t.startswith('{') and t.endswith('}')) or \
           (t.startswith('[') and t.endswith(']'))

def is_stack_trace_line(line: str) -> bool:
    """Detect stack trace lines"""
    s = line.strip()
    return (s.startswith('at ') or 
            s.startswith('...') or 
            s.startswith('Caused by:') or
            s.startswith('Traceback') or
            s.startswith('File "') or
            re.match(r'\s+at\s+[\w$.]+\(', s))

def extract_from_json(raw: str) -> Optional[dict]:
    """Extract fields from JSON log lines"""
    lines = raw.splitlines()
    json_obj = None
    
    # Try to find JSON in first line or as complete multiline JSON
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('{'):
            # Accumulate until we have complete JSON
            json_str = stripped
            for next_line in lines[i+1:]:
                if next_line.strip().startswith('}'):
                    json_str += '\n' + next_line
                    break
                json_str += '\n' + next_line
            try:
                json_obj = json.loads(json_str)
                break
            except json.JSONDecodeError:
                continue
    
    if json_obj:
        return json_obj
    return None

def extract_timestamp(text: str) -> Tuple[Optional[str], str, float]:
    """Extract timestamp from start of line"""
    # Try bracket format first
    m = RE_TIMESTAMP_BRACKET.match(text)
    if m:
        ts = m.group('ts')
        rest = text[m.end():].lstrip()
        return ts, rest, 0.95
    
    # Try plain timestamp
    m = RE_TIMESTAMP.match(text)
    if m:
        ts = m.group('ts')
        rest = text[m.end():].lstrip()
        # Higher confidence if we have timezone or milliseconds
        conf = 0.95 if 'Z' in ts or 'UTC' in ts or '.' in ts else 0.85
        return ts, rest, conf
    
    return None, text, 0.0

def extract_level(text: str) -> Tuple[Optional[str], str, float]:
    """Extract log level from text"""
    m = RE_LEVEL.search(text)
    if m:
        level = m.group('level_bracket') or m.group('level_prefix') or \
                m.group('level_kv') or m.group('level_standalone')
        if level:
            # Remove the level from text for remaining message
            if m.group('level_bracket'):
                # Remove [LEVEL]
                rest = text.replace(m.group(0), '', 1).lstrip()
            else:
                # Remove level and surrounding space
                rest = re.sub(r'\s*' + re.escape(level) + r'\s*', ' ', text, 1).strip()
            return normalize_level(level), rest, 0.9
    
    return None, text, 0.0

def extract_service(text: str) -> Tuple[Optional[str], str, float]:
    """Extract service name from text"""
    # Try [service[pid]] or db[postgres-15] format
    m = RE_SERVICE_BRACKET.search(text)
    if m:
        if m.group('service_bracket'):
            service = m.group('service_bracket')
            # Remove the [service[pid]] part
            rest = re.sub(r'\[[^\]]*' + re.escape(service) + r'[^\]]*\]', '', text, 1).lstrip(' :')
            rest = re.sub(r'^\s*:\s*', '', rest)
            return service, rest, 0.9
        
        elif m.group('service_db'):
            # Handle db[postgres-15] format - combine to "db:postgres-15" or just "db"
            db_service = m.group('service_db')  # "db"
            db_instance = m.group('db_instance')  # "postgres-15"
            # Return as "db[postgres-15]" to preserve the format, or combine as "db:postgres-15"
            service = f"{db_service}[{db_instance}]"  # or f"{db_service}:{db_instance}"
            
            # Remove the db[postgres-15] part from text
            pattern = re.escape(db_service) + r'\[' + re.escape(db_instance) + r'\]'
            rest = re.sub(pattern, '', text, 1).lstrip(' :')
            rest = re.sub(r'^\s*:\s*', '', rest)
            return service, rest, 0.95  # Higher confidence for this specific format
    
    # Try service: format
    m = RE_SERVICE_COLON.match(text)
    if m:
        service = m.group('service')
        rest = text[m.end():].lstrip()
        return service, rest, 0.85
    
    return None, text, 0.0

def extract_metadata(text: str) -> dict:
    """Extract additional metadata like req-id, user-id, etc."""
    metadata = {}
    
    # Extract request ID
    req_match = RE_REQUEST_ID.search(text)
    if req_match:
        metadata['request_id'] = req_match.group(1)
    
    # Extract user ID
    user_match = RE_USER_ID.search(text)
    if user_match:
        metadata['user_id'] = user_match.group(1)
    
    # Extract HTTP status
    status_match = RE_HTTP_STATUS.search(text)
    if status_match:
        metadata['http_status'] = int(status_match.group('status'))
    
    return metadata

def build_signature(record: dict, message: str) -> str:
    """Build a signature for grouping similar logs"""
    lines = record['raw'].splitlines()
    
    # For exceptions, use exception type + first line
    if any(is_stack_trace_line(line) for line in lines):
        # Find the exception line
        for line in lines:
            if 'Exception' in line or 'Error' in line and ':' in line:
                return line.strip()
        # Fall back to first line if we can't find exception
        return lines[0].strip()
    
    # For normal logs, use message without dynamic parts
    # Remove timestamps, IDs, etc.
    signature = message
    # Remove request IDs
    signature = re.sub(r'[\[\(]?req-id:?\s*[a-f0-9-]+[\]\)]?', '', signature)
    # Remove user IDs
    signature = re.sub(r'user[:_]?\w+', 'user', signature)
    # Remove order IDs
    signature = re.sub(r'order[:_]?\w+', 'order', signature)
    # Remove transaction IDs
    signature = re.sub(r'txn[:_]?\w+', 'txn', signature)
    # Clean up extra spaces
    signature = re.sub(r'\s+', ' ', signature).strip()
    
    return signature[:300]

# ----------------------------
# Main parsing functions
# ----------------------------

def is_new_record(line: str) -> bool:
    """Determine if line starts a new log record"""
    if is_stack_trace_line(line):
        return False
    
    stripped = line.lstrip()
    
    # JSON start
    if looks_like_json_line(stripped):
        return True
    
    # Has timestamp at start
    if RE_TIMESTAMP.match(line) or RE_TIMESTAMP_BRACKET.match(line):
        return True
    
    # Has level at start (not in middle)
    level_match = RE_LEVEL.match(stripped)
    if level_match and level_match.start() == 0:
        return True
    
    # Has service prefix
    if RE_SERVICE_BRACKET.search(line) and RE_TIMESTAMP.search(line):
        return True
    
    return False

def group_lines_into_record(lines: list[str]) -> list[list[str]]:
    """Group log lines into multi-line records"""
    records = []
    current = []
    
    for line in lines:
        if not line.strip():
            if current:
                current.append(line)
            continue
            
        if is_new_record(line) and current:
            records.append(current)
            current = [line]
        else:
            current.append(line)
    
    if current:
        records.append(current)
    
    return records

def parse_record(record_lines: list[str]) -> dict[str, Any]:
    """Parse a single log record"""
    raw = '\n'.join(record_lines)
    header = record_lines[0] if record_lines else ''
    
    result = {
        'raw': raw,
        'ts': None,
        'ts_raw': None,
        'service': None,
        'level': None,
        'message': '',
        'attrs': {},
        'metadata': {},
        'parse': {'kind': 'text', 'confidence': 0.0}
    }
    
    # Try JSON parsing first
    json_obj = extract_from_json(raw)
    if json_obj:
        # Extract common fields
        ts = (json_obj.get('ts') or json_obj.get('time') or 
              json_obj.get('timestamp') or json_obj.get('@timestamp'))
        level = (json_obj.get('level') or json_obj.get('severity') or 
                json_obj.get('log.level'))
        service = (json_obj.get('service') or json_obj.get('svc') or 
                  json_obj.get('app') or json_obj.get('component'))
        msg = (json_obj.get('message') or json_obj.get('msg') or 
               json_obj.get('event') or header)
        
        result['ts_raw'] = str(ts) if ts else None
        try:
            result['ts'] = date_parser.parse(ts) if ts else None
        except:
            result['ts'] = None
        
        result['level'] = normalize_level(str(level)) if level else None
        result['service'] = str(service) if service else None
        result['message'] = str(msg).strip()[:500]
        result['attrs'] = json_obj
        result['parse'] = {'kind': 'json', 'confidence': 0.98}
        result['signature'] = build_signature(result, result['message'])
        
        return result
    
    # Text parsing
    text = header
    matched = []
    
    # Extract timestamp
    ts, text, ts_conf = extract_timestamp(text)
    if ts:
        result['ts_raw'] = ts
        try:
            result['ts'] = date_parser.parse(ts)
        except:
            result['ts'] = None
        matched.append('timestamp')
    
    # Extract service
    service, text, svc_conf = extract_service(text)
    if service:
        result['service'] = service
        matched.append('service')
    
    # Extract level
    level, text, lvl_conf = extract_level(text)
    if level:
        result['level'] = level
        matched.append('level')
    
    # Extract metadata
    result['metadata'] = extract_metadata(header)
    
    # Message is whatever's left
    result['message'] = text.strip() or header
    if len(result['message']) > 500:
        result['message'] = result['message'][:500] + '…'
    
    # Calculate confidence
    conf_weights = {'timestamp': 0.4, 'service': 0.3, 'level': 0.3}
    confidence = sum(conf_weights.get(m, 0) for m in matched)
    result['parse'] = {
        'kind': 'text',
        'confidence': round(confidence, 2),
        'matched': matched
    }
    
    result['signature'] = build_signature(result, result['message'])
    
    return result

def parse_logs(logs: str) -> list[dict[str, Any]]:
    """Parse a string of logs into structured records"""
    lines = logs.splitlines()
    records = group_lines_into_record(lines)
    return [parse_record(record) for record in records]