import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { getIngestionOverview, getIngestionFindings, deleteIngestion } from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
import EventsList from '../components/EventsList'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

function GroupLink({ orgId, projectId, ingestionId, fingerprint, children }) {
  return (
    <Link
      to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/groups/${fingerprint}`}
      className="text-blue-600 hover:text-blue-700 hover:underline transition font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  )
}

function IngestionDetailsPage() {
  const { orgId, projectId, ingestionId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  useRequireAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollingEnabled, setPollingEnabled] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState({ show: false, text: '', type: 'success' })

  // Handle query parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'findings', 'events'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

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

  const handleDeleteIngestion = async () => {
    setDeleteConfirm(false)
    setDeleting(true)
    try {
      await deleteIngestion(orgId, projectId, ingestionId)
      setDeleteMessage({ show: true, text: 'Ingestion deleted successfully', type: 'success' })
      setTimeout(() => navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions`), 1500)
    } catch (err) {
      const msg = err.response?.status === 403 ? 'Not allowed' : err.response?.data?.detail || 'Delete failed'
      setDeleteMessage({ show: true, text: msg, type: 'error' })
      setDeleting(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'findings', label: 'Findings' },
    { id: 'events', label: 'Events' },
  ]

  return (
    <div>
      <div className="mb-4 xs:mb-6">
        <Link
          to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
          className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm"
        >
          ← Back to Ingestions
        </Link>
      </div>

      {error && (
        <div className="p-3 sm:p-4 mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 rounded text-xs sm:text-base">
          {error}
        </div>
      )}

      {loading && !overview ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
            <div className="flex gap-2 sm:gap-8 min-w-min sm:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 sm:py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap sm:whitespace-normal ${
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
          {activeTab === 'overview' && <OverviewTab overview={overview} orgId={orgId} projectId={projectId} ingestionId={ingestionId} />}
          {activeTab === 'findings' && (
            <FindingsTab orgId={orgId} projectId={projectId} ingestionId={ingestionId} />
          )}
          {activeTab === 'events' && (
            <EventsList orgId={orgId} projectId={projectId} ingestionId={ingestionId} fingerprint={searchParams.get('fingerprint')} showFilters={true} showTitle={true} />
          )}

          {/* Danger Zone */}
          <div className="mt-8 xs:mt-12 pt-6 xs:pt-8 border-t border-gray-300">
            <h3 className="text-base xs:text-lg font-semibold text-red-600 mb-3 xs:mb-4">Danger Zone</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 xs:p-6">
              <p className="text-xs xs:text-sm text-red-800 mb-3">Delete this ingestion and all its data permanently.</p>
              <button
                onClick={() => setDeleteConfirm(true)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs sm:text-sm font-medium px-3 xs:px-4 py-2 rounded transition"
              >
                Delete Ingestion
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Dialog and Toast */}
      <ConfirmDialog
        open={deleteConfirm}
        title="Delete Ingestion?"
        description="This will permanently delete the ingestion and all its logs, findings, and analysis. This action cannot be undone."
        confirmText="Delete"
        danger={true}
        loading={deleting}
        onConfirm={handleDeleteIngestion}
        onCancel={() => setDeleteConfirm(false)}
      />
      {deleteMessage.show && (
        <Toast
          message={deleteMessage.text}
          type={deleteMessage.type}
          onClose={() => setDeleteMessage({ show: false, text: '', type: 'success' })}
        />
      )}
    </div>
  )
}

function OverviewTab({ overview, orgId, projectId, ingestionId }) {
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-tight">Total Events</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats?.total_events || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-tight">Events with TS</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats?.total_events_with_ts || 0}</p>
        </div>
        {stats?.time_range && (
          <>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-tight">Min Timestamp</p>
              <p className="text-xs sm:text-sm font-mono text-gray-900 mt-2 break-all">{stats.time_range.min_ts}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-tight">Max Timestamp</p>
              <p className="text-xs sm:text-sm font-mono text-gray-900 mt-2 break-all">{stats.time_range.max_ts}</p>
            </div>
          </>
        )}
      </div>

      {/* Top Groups */}
      {groups.top && groups.top.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Groups</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {groups.top.map((group) => (
              <Link
                key={group.fingerprint}
                to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/groups/${group.fingerprint}`}
                className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-blue-50 transition block"
              >
                <div className="flex justify-between items-start gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-mono text-blue-600 mb-1 sm:mb-2 truncate hover:text-blue-700">{group.fingerprint.substring(0, 16)}...</p>
                    <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2 break-words line-clamp-2">{group.latest?.message}</p>
                    {group.latest && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        {group.latest.service && <span className="truncate">Service: {group.latest.service}</span>}
                        {group.latest.level && (
                          <span className={`px-2 py-1 rounded text-xs ${getLevelBadgeColor(group.latest.level)} flex-shrink-0`}>
                            {group.latest.level}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{group.count}</p>
                    <p className="text-xs text-gray-500">occurrences</p>
                  </div>
                </div>
              </Link>
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
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Title</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Severity</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900 hidden sm:table-cell">Confidence</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sorted.map((finding) => (
            <tr key={finding.id} className="hover:bg-blue-50 cursor-pointer transition">
              <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-700 font-medium">
                <Link
                  to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/findings/${finding.id}`}
                  className="text-blue-600 hover:text-blue-700 hover:underline transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  {finding.title}
                </Link>
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(finding.severity)}`}>
                  {finding.severity}
                </span>
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-700 hidden sm:table-cell">{finding.confidence || '—'}</td>
              <td className="px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-900">{finding.total_occurrences || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default IngestionDetailsPage
