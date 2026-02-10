import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { listIngestionEvents } from '../lib/api'

function EventsList({
  orgId,
  projectId,
  ingestionId,
  fingerprint,
  showFilters = true,
  showTitle = true,
}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Filter state
  const [levels, setLevels] = useState([])
  const [service, setService] = useState('')
  const [filterFingerprint, setFilterFingerprint] = useState(fingerprint || '')
  const [tsFrom, setTsFrom] = useState('')
  const [tsTo, setTsTo] = useState('')
  const [q, setQ] = useState('')

  const abortControllerRef = useRef(null)

  // Sync fingerprint prop to filter state
  useEffect(() => {
    setFilterFingerprint(fingerprint || '')
    setCursor(0)
    setEvents([])
  }, [fingerprint])

  // Load initial events
  useEffect(() => {
    loadInitialEvents()
  }, [orgId, projectId, ingestionId, filterFingerprint])

  const loadInitialEvents = async () => {
    setLoading(true)
    setError(null)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const params = {
        cursor: 0,
        limit: 100,
      }

      // Use filterFingerprint state (no prop fallback)
      if (filterFingerprint) {
        params.fingerprint = filterFingerprint
      }

      const data = await listIngestionEvents(orgId, projectId, ingestionId, params)
      setEvents(data.items)
      setCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.response?.data?.detail || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = async () => {
    setLoading(true)
    setError(null)
    setEvents([])
    setCursor(0)

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const params = {
        cursor: 0,
        limit: 100,
      }
      if (levels.length > 0) {
        params.levels = levels.join(',')
      }
      if (service) {
        params.service = service
      }

      // Use filterFingerprint state only (synced from prop via useEffect)
      if (filterFingerprint) {
        params.fingerprint = filterFingerprint
      }

      if (tsFrom) {
        params.ts_from = tsFrom
      }
      if (tsTo) {
        params.ts_to = tsTo
      }
      if (q) {
        params.q = q
      }

      const data = await listIngestionEvents(orgId, projectId, ingestionId, params)
      setEvents(data.items)
      setCursor(data.next_cursor)
      setHasMore(data.has_more)
      setShowFilterPanel(false)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.response?.data?.detail || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    setLoading(true)
    setError(null)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const params = {
        cursor,
        limit: 100,
      }
      if (levels.length > 0) {
        params.levels = levels.join(',')
      }
      if (service) {
        params.service = service
      }

      // Use filterFingerprint state only (synced from prop via useEffect)
      if (filterFingerprint) {
        params.fingerprint = filterFingerprint
      }

      if (tsFrom) {
        params.ts_from = tsFrom
      }
      if (tsTo) {
        params.ts_to = tsTo
      }
      if (q) {
        params.q = q
      }

      const data = await listIngestionEvents(orgId, projectId, ingestionId, params)
      setEvents((prev) => [...prev, ...data.items])
      setCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.response?.data?.detail || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setLevels([])
    setService('')
    setFilterFingerprint('')
    setTsFrom('')
    setTsTo('')
    setQ('')
    loadInitialEvents()
  }

  const toggleLevel = (level) => {
    setLevels((prev) => {
      if (prev.includes(level)) {
        return prev.filter((l) => l !== level)
      } else {
        return [...prev, level]
      }
    })
  }

  const hasActiveFilters =
    levels.length > 0 || service || filterFingerprint || tsFrom || tsTo || q

  return (
    <div className="space-y-3 sm:space-y-4">
      {showTitle && <h3 className="text-base xs:text-lg font-semibold text-gray-900">Events</h3>}

      {/* Filter Toggle Button - only show if filters are enabled */}
      {showFilters && (
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`inline-flex items-center justify-center gap-2 px-3 xs:px-4 py-2 rounded-lg font-medium text-xs xs:text-sm transition-all ${
              showFilterPanel
                ? 'bg-blue-600 text-white shadow-md'
                : hasActiveFilters
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            <svg
              className={`w-3 xs:w-4 h-3 xs:h-4 transition-transform flex-shrink-0 ${showFilterPanel ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-bold bg-blue-500 text-white rounded-full flex-shrink-0">
                {[levels.length, service ? 1 : 0, filterFingerprint ? 1 : 0, tsFrom ? 1 : 0, tsTo ? 1 : 0, q ? 1 : 0].reduce(
                  (a, b) => a + b,
                  0
                )}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              disabled={loading}
              className="text-xs xs:text-sm text-blue-600 hover:text-blue-700 transition disabled:text-gray-400 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Collapsible Filter Bar */}
      {showFilters && showFilterPanel && (
        <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-md border border-blue-100 p-3 xs:p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Levels */}
            <div>
              <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">Levels</label>
              <div className="flex flex-wrap gap-1 xs:gap-2">
                {['INFO', 'WARN', 'ERROR', 'DEBUG', 'CRITICAL', 'FATAL'].map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`px-2 xs:px-3 py-1 rounded text-xs font-medium transition ${
                      levels.includes(level) ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Service */}
            <div>
              <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">Service</label>
              <input
                type="text"
                placeholder="Service name"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-2 xs:px-3 py-2 border border-gray-300 rounded-lg text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Fingerprint */}
            <div>
              <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">Fingerprint</label>
              <input
                type="text"
                placeholder="Fingerprint"
                value={filterFingerprint}
                onChange={(e) => setFilterFingerprint(e.target.value)}
                className="w-full px-2 xs:px-3 py-2 border border-gray-300 rounded-lg text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Timestamp From */}
            <div>
              <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">From</label>
              <input
                type="datetime-local"
                value={tsFrom}
                onChange={(e) => setTsFrom(e.target.value)}
                className="w-full px-2 xs:px-3 py-2 border border-gray-300 rounded-lg text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Timestamp To */}
            <div>
              <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">To</label>
              <input
                type="datetime-local"
                value={tsTo}
                onChange={(e) => setTsTo(e.target.value)}
                className="w-full px-2 xs:px-3 py-2 border border-gray-300 rounded-lg text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">Search Message</label>
              <input
                type="text"
                placeholder="Search message"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full px-2 xs:px-3 py-2 border border-gray-300 rounded-lg text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col xs:flex-row gap-2 pt-3 xs:pt-4 border-t border-blue-200">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-3 xs:px-4 rounded-lg text-xs xs:text-sm transition shadow hover:shadow-md disabled:shadow-none"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
            <button
              onClick={resetFilters}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-3 xs:px-4 rounded-lg text-xs xs:text-sm transition"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">{error}</div>
      )}

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <p className="text-gray-600 text-sm">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
          <p className="text-gray-600 text-xs sm:text-sm">No events found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Seq</th>
                  <th className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Timestamp</th>
                  <th className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Level</th>
                  <th className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-left font-semibold text-gray-900 whitespace-nowrap hidden sm:table-cell">Service</th>
                  <th className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-left font-semibold text-gray-900">Message</th>
                  <th className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-left font-semibold text-gray-900 whitespace-nowrap hidden lg:table-cell">
                    Fingerprint
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 font-mono text-xs text-gray-700">{event.seq}</td>
                    <td className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{event.ts || '—'}</td>
                    <td className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3">
                      {event.level && (
                        <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getLevelBadgeColor(event.level)}`}>
                          {event.level}
                        </span>
                      )}
                    </td>
                    <td className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-xs text-gray-700 font-medium hidden sm:table-cell">
                      {event.service || '—'}
                    </td>
                    <td className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-gray-700 break-words line-clamp-2 max-w-xs sm:max-w-md text-xs sm:text-sm">
                      {event.message}
                    </td>
                    <td className="px-2 xs:px-3 sm:px-6 py-2 xs:py-3 text-xs font-mono text-gray-500 whitespace-nowrap hidden lg:table-cell">
                      {event.fingerprint ? (
                        <Link
                          to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/groups/${event.fingerprint}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.fingerprint.substring(0, 10)}...
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-3 xs:px-4 rounded-lg text-xs xs:text-sm transition shadow hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 xs:w-4 xs:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Loading...
                </span>
              ) : (
                'Load More Events'
              )}
            </button>
          )}

          {!hasMore && events.length > 0 && <p className="text-center text-xs text-gray-500 py-3 xs:py-4">End of results</p>}
        </>
      )}

      {/* Event Details Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setSelectedEvent(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 xs:mb-6">
                <h2 className="text-base xs:text-lg font-bold text-gray-900">Event Details</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl xs:text-3xl leading-none font-light transition flex-shrink-0"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 xs:space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">ID</p>
                  <p className="text-xs xs:text-sm font-mono text-gray-700 break-all mt-2 bg-gray-50 p-2 xs:p-3 rounded">{selectedEvent.id}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sequence</p>
                  <p className="text-xs xs:text-sm font-mono text-gray-700 mt-2">{selectedEvent.seq}</p>
                </div>

                {selectedEvent.ts && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Timestamp</p>
                    <p className="text-xs xs:text-sm font-mono text-gray-700 mt-2 break-all">{selectedEvent.ts}</p>
                  </div>
                )}

                {selectedEvent.level && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Level</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 xs:px-3 py-1 rounded-full text-xs font-semibold ${getLevelBadgeColor(selectedEvent.level)}`}>
                        {selectedEvent.level}
                      </span>
                    </div>
                  </div>
                )}

                {selectedEvent.service && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Service</p>
                    <p className="text-xs xs:text-sm text-gray-700 mt-2 bg-gray-50 p-2 xs:p-3 rounded break-all">{selectedEvent.service}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Message</p>
                  <p className="text-xs xs:text-sm text-gray-700 break-words mt-2 leading-relaxed bg-gray-50 p-2 xs:p-3 rounded">
                    {selectedEvent.message}
                  </p>
                </div>

                {selectedEvent.fingerprint && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fingerprint</p>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 mt-2">
                      <p className="text-xs font-mono text-gray-700 break-all flex-1 bg-gray-900 text-gray-100 p-2 xs:p-3 rounded">
                        {selectedEvent.fingerprint}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedEvent.fingerprint)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 xs:px-3 py-2 rounded-lg transition whitespace-nowrap font-medium flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getLevelBadgeColor(level) {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
    case 'CRIT':
      return 'bg-red-100 text-red-800'
    case 'FATAL':
      return 'bg-red-100 text-red-800'
    case 'ERROR':
      return 'bg-red-50 text-red-700'
    case 'WARN':
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-800'
    case 'INFO':
      return 'bg-blue-50 text-blue-700'
    case 'DEBUG':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default EventsList
