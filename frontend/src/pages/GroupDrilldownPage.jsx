import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGroupOverview } from '../lib/api'
import EventsList from '../components/EventsList'
import InsightSection from '../components/InsightSection'

function GroupDrilldownPage() {
  const { orgId, projectId, ingestionId, fingerprint } = useParams()
  const [groupData, setGroupData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchGroupOverview()
  }, [orgId, projectId, ingestionId, fingerprint])

  const fetchGroupOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGroupOverview(orgId, projectId, ingestionId, fingerprint)
      setGroupData(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4 xs:mb-6">
        <Link
          to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}`}
          className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm"
        >
          ← Back to Ingestion
        </Link>
      </div>

      {error && (
        <div className="p-3 sm:p-4 mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 rounded text-xs sm:text-base">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600 text-sm">Loading group data...</p>
      ) : groupData ? (
        <>
          {/* Group Header */}
          <div className="bg-white rounded-lg shadow p-4 xs:p-6 mb-4 xs:mb-6">
            <div className="mb-4 xs:mb-6">
              <h2 className="text-base xs:text-lg font-semibold text-gray-700 mb-2">Fingerprint</h2>
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                <code className="text-xs xs:text-sm font-mono text-gray-900 break-all bg-gray-50 p-2 xs:p-3 rounded flex-1">
                  {groupData.group.fingerprint}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(groupData.group.fingerprint)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 xs:px-3 py-2 rounded-lg transition font-medium flex-shrink-0 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-4">
              <div className="bg-gray-50 rounded p-3 xs:p-4">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-tight">Total Events</p>
                <p className="text-xl xs:text-2xl font-bold text-gray-900 mt-2">{groupData.group.counts || 0}</p>
              </div>
              {groupData.group.first_seen && (
                <div className="bg-gray-50 rounded p-3 xs:p-4">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-tight">First Seen</p>
                  <p className="text-xs xs:text-sm font-mono text-gray-900 mt-2 break-all">{groupData.group.first_seen}</p>
                </div>
              )}
              {groupData.group.last_seen && (
                <div className="bg-gray-50 rounded p-3 xs:p-4">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-tight">Last Seen</p>
                  <p className="text-xs xs:text-sm font-mono text-gray-900 mt-2 break-all">{groupData.group.last_seen}</p>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6 mb-4 xs:mb-6">
            {/* Levels Breakdown */}
            {groupData.breakdown.levels && Object.keys(groupData.breakdown.levels).length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 xs:p-6">
                <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-4">Levels</h3>
                <div className="space-y-2">
                  {Object.entries(groupData.breakdown.levels)
                    .sort((a, b) => b[1] - a[1])
                    .map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelBadgeColor(level)}`}>
                            {level}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Services Breakdown */}
            {groupData.breakdown.services && Object.keys(groupData.breakdown.services).length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 xs:p-6">
                <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-4">Services</h3>
                <div className="space-y-2">
                  {Object.entries(groupData.breakdown.services)
                    .sort((a, b) => b[1] - a[1])
                    .map(([service, count]) => (
                      <div key={service} className="flex items-center justify-between gap-3">
                        <span className="text-xs xs:text-sm text-gray-700 break-words flex-1">{service || '(empty)'}</span>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Events Section */}
          <EventsList orgId={orgId} projectId={projectId} ingestionId={ingestionId} fingerprint={fingerprint} showFilters={false} showTitle={true} />

          {/* AI Insight Section */}
          <InsightSection
            orgId={orgId}
            projectId={projectId}
            ingestionId={ingestionId}
            scopeType="group"
            scopeId={fingerprint}
            initialInsight={groupData.insight}
          />
        </>
      ) : null}
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

export default GroupDrilldownPage
