export function shortId(value, head = 8, tail = 4) {
  if (!value) return '-'
  const text = String(value)
  if (text.length <= head + tail + 3) return text
  return `${text.slice(0, head)}...${text.slice(-tail)}`
}

export function normalizeStatus(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'completed') return 'done'
  return value || 'unknown'
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function levelBadgeClass(level) {
  const value = String(level || '').toUpperCase()
  if (value === 'CRITICAL' || value === 'CRIT' || value === 'FATAL') {
    return 'bg-red-100 text-red-800 hover:bg-red-100'
  }
  if (value === 'ERROR') return 'bg-red-50 text-red-700 hover:bg-red-50'
  if (value === 'WARN' || value === 'WARNING') {
    return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
  }
  if (value === 'INFO') return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
  if (value === 'DEBUG') return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
  return 'bg-muted text-foreground'
}

export function severityBadgeClass(severity) {
  const value = String(severity || '').toUpperCase()
  if (value === 'CRITICAL' || value === 'CRIT') {
    return 'bg-red-100 text-red-800 hover:bg-red-100'
  }
  if (value === 'HIGH') return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
  if (value === 'MEDIUM' || value === 'MED') {
    return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
  }
  if (value === 'LOW') return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
  return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
}

export function statusBadgeClass(status) {
  const value = normalizeStatus(status)
  if (value === 'pending') return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
  if (value === 'processing') return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
  if (value === 'done') return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
  if (value === 'failed') return 'bg-red-100 text-red-800 hover:bg-red-100'
  return 'bg-muted text-foreground'
}

export function sortFindings(items = []) {
  const severityOrder = {
    CRITICAL: 0,
    CRIT: 0,
    HIGH: 1,
    MEDIUM: 2,
    MED: 2,
    LOW: 3,
    INFO: 4,
  }

  return [...items].sort((a, b) => {
    const aRank = severityOrder[String(a?.severity || '').toUpperCase()] ?? 999
    const bRank = severityOrder[String(b?.severity || '').toUpperCase()] ?? 999
    if (aRank !== bRank) return aRank - bRank
    return (b?.total_occurrences || 0) - (a?.total_occurrences || 0)
  })
}
