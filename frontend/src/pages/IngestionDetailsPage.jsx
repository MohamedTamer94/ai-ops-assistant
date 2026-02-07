import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getIngestionOverview, listIngestionEvents, getIngestionFindings } from '../lib/api'

function IngestionDetailsPage() {
  const { orgId, projectId, ingestionId } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollingEnabled, setPollingEnabled] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [orgId, projectId, ingestionId])

  useEffect(() => {
    if (!pollingEnabled || !overview) return

    // Polling interval: every 2 seconds if status is pending/processing
    const statusesToPoll = ['pending', 'processing']
    if (!statusesToPoll.includes(overview?.ingestion?.status)) {
      setPollingEnabled(false)
      return
    }

    const interval = setInterval(() => {
      fetchOverview()
    }, 2000)

    return () => clearInterval(interval)
  }, [overview, pollingEnabled])

  const fetchOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIngestionOverview(orgId, projectId, ingestionId)
      setOverview(data)

      // Stop polling if status is done or failed
      const nonPollingStatuses = ['done', 'completed', 'failed']
      if (nonPollingStatuses.includes(data?.ingestion?.status)) {
        setPollingEnabled(false)
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'findings', label: 'Findings' },
    { id: 'events', label: 'Events' },
  ]

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          ← Back to Ingestions
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && !overview ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewTab overview={overview} />}
          {activeTab === 'findings' && (
            <FindingsTab orgId={orgId} projectId={projectId} ingestionId={ingestionId} />
          )}
          {activeTab === 'events' && (
            <EventsTab orgId={orgId} projectId={projectId} ingestionId={ingestionId} />
          )}
        </>
      )}
    </div>
  )
}

function OverviewTab({ overview }) {
  if (!overview) return null

  const ingestion = overview.ingestion
  const stats = overview.stats
  const groups = overview.groups || { top: [] }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'done':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelBadgeColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRIT':
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

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusBadgeColor(ingestion.status)}`}>
          {ingestion.status}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-600 uppercase">Total Events</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_events || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-600 uppercase">Events with TS</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_events_with_ts || 0}</p>
        </div>
        {stats?.time_range && (
          <>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs font-medium text-gray-600 uppercase">Min Timestamp</p>
              <p className="text-sm font-mono text-gray-900 mt-2">{stats.time_range.min_ts}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs font-medium text-gray-600 uppercase">Max Timestamp</p>
              <p className="text-sm font-mono text-gray-900 mt-2">{stats.time_range.max_ts}</p>
            </div>
          </>
        )}
      </div>

      {/* Top Groups */}
      {groups.top && groups.top.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Groups</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {groups.top.map((group) => (
              <div key={group.fingerprint} className="px-6 py-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-mono text-gray-500 mb-2">{group.fingerprint.substring(0, 16)}...</p>
                    <p className="text-sm text-gray-700 mb-2">{group.latest?.message}</p>
                    {group.latest && (
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        {group.latest.service && <span>Service: {group.latest.service}</span>}
                        {group.latest.level && (
                          <span className={`px-2 py-1 rounded ${getLevelBadgeColor(group.latest.level)}`}>
                            {group.latest.level}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{group.count}</p>
                    <p className="text-xs text-gray-500">occurrences</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FindingsTab({ orgId, projectId, ingestionId }) {
  const [findings, setFindings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFindings()
  }, [orgId, projectId, ingestionId])

  const fetchFindings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIngestionFindings(orgId, projectId, ingestionId)
      setFindings(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-gray-600">Loading findings...</p>
  if (error) return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>

  if (!findings?.items || findings.items.length === 0) {
    return <p className="text-gray-600">No findings yet.</p>
  }

  const severityOrder = { CRITICAL: 0, CRIT: 0, HIGH: 1, MEDIUM: 2, MED: 2, LOW: 3, INFO: 4 }
  const sorted = [...findings.items].sort((a, b) => {
    const aScore = severityOrder[a.severity?.toUpperCase()] ?? 999
    const bScore = severityOrder[b.severity?.toUpperCase()] ?? 999
    if (aScore !== bScore) return aScore - bScore
    return (b.total_occurrences || 0) - (a.total_occurrences || 0)
  })

  const getSeverityBadgeColor = (severity) => {
    const upper = severity?.toUpperCase()
    switch (upper) {
      case 'CRITICAL':
      case 'CRIT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
      case 'MED':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Severity</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Confidence</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Occurrences</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sorted.map((finding) => (
            <tr key={finding.id} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-sm text-gray-700">{finding.title}</td>
              <td className="px-6 py-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(finding.severity)}`}>
                  {finding.severity}
                </span>
              </td>
              <td className="px-6 py-3 text-sm text-gray-700">{finding.confidence || '—'}</td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">{finding.total_occurrences || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventsTab({ orgId, projectId, ingestionId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterService, setFilterService] = useState('')

  useEffect(() => {
    fetchEvents(0)
  }, [orgId, projectId, ingestionId])

  const fetchEvents = async (newCursor) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listIngestionEvents(orgId, projectId, ingestionId, newCursor, 100)
      if (newCursor === 0) {
        setEvents(data.items)
      } else {
        setEvents((prev) => [...prev, ...data.items])
      }
      setCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const getLevelBadgeColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRIT':
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

  // Filter events
  const filtered = events.filter((event) => {
    if (filterLevel !== 'all' && event.level?.toUpperCase() !== filterLevel.toUpperCase()) {
      return false
    }
    if (filterService && !event.service?.toLowerCase().includes(filterService.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
          <input
            type="text"
            placeholder="Filter by service..."
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      {loading && events.length === 0 ? (
        <p className="text-gray-600">Loading events...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600">No events match the filters.</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Seq</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Timestamp</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Level</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Service</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-700">{event.seq}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{event.ts || '—'}</td>
                    <td className="px-6 py-3">
                      {event.level && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadgeColor(event.level)}`}>
                          {event.level}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{event.service || '—'}</td>
                    <td className="px-6 py-3 text-gray-700 break-words max-w-xs">{event.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              onClick={() => fetchEvents(cursor)}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default IngestionDetailsPage
