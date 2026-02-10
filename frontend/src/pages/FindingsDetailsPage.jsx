import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFindingDetails } from '../lib/api'
import InsightSection from '../components/InsightSection'

function FindingsDetailsPage() {
  const { orgId, projectId, ingestionId, findingId } = useParams()
  const [finding, setFinding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFindingDetails()
  }, [orgId, projectId, ingestionId, findingId])

  const fetchFindingDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFindingDetails(orgId, projectId, ingestionId, findingId)
      setFinding(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

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
        <p className="text-gray-600 text-sm">Loading finding details...</p>
      ) : finding ? (
        <>
          {/* Finding Header */}
          <div className="bg-white rounded-lg shadow p-4 xs:p-6 mb-4 xs:mb-6">
            <div className="mb-4 xs:mb-6">
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-3 xs:mb-4">{finding.title}</h1>
              <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:gap-4 flex-wrap">
                <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getSeverityBadgeColor(finding.severity)}`}>
                  {finding.finding.severity}
                </span>
                {finding.finding.confidence && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs xs:text-sm text-gray-600 font-medium">Confidence:</span>
                    <span className="text-xs xs:text-sm font-semibold text-gray-900">{finding.finding.confidence}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs xs:text-sm text-gray-600 font-medium">Total Occurrences:</span>
                  <span className="text-xs xs:text-sm font-semibold text-gray-900">{finding.finding.total_occurrences || 0}</span>
                </div>
              </div>
            </div>

            {finding.finding.description && (
              <div className="bg-gray-50 rounded p-3 xs:p-4 border border-gray-200">
                <p className="text-xs xs:text-sm text-gray-700 leading-relaxed">{finding.finding.description}</p>
              </div>
            )}
          </div>

          {/* Matched Fingerprints */}
          {finding.finding.matched_fingerprints && finding.finding.matched_fingerprints.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 xs:p-6 mb-4 xs:mb-6">
              <h2 className="text-base xs:text-lg font-semibold text-gray-900 mb-4">Matched Fingerprints ({finding.finding.matched_fingerprints.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Fingerprint</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Count</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {finding.finding.matched_fingerprints.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-2 sm:py-3">
                          <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded break-all">
                            {item.fingerprint}
                          </code>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 font-semibold text-gray-900">{item.count}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3">
                          <Link
                            to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/groups/${item.fingerprint}`}
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-2 xs:px-3 py-1 xs:py-2 rounded transition"
                          >
                            Open Group
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evidence Preview */}
          {finding.evidence_preview && finding.evidence_preview.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 xs:p-6 mb-4 xs:mb-6">
              <h2 className="text-base xs:text-lg font-semibold text-gray-900 mb-4">Evidence Preview</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Timestamp</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900 whitespace-nowrap hidden sm:table-cell">Service</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Level</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Message</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {finding.evidence_preview.map((log, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{log.ts || '—'}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs text-gray-700 hidden sm:table-cell font-medium">{log.service || '—'}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3">
                          {log.level && (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelBadgeColor(log.level)}`}>
                              {log.level}
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-700 break-words line-clamp-2 max-w-xs sm:max-w-md text-xs sm:text-sm">
                          {log.message}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 whitespace-nowrap">
                          <Link
                            to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}?tab=events&fingerprint=${encodeURIComponent(log.fingerprint || '')}`}
                            className="inline-block bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-2 py-1 rounded transition"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Insight Section */}
          <InsightSection
            orgId={orgId}
            projectId={projectId}
            ingestionId={ingestionId}
            scopeType="finding"
            scopeId={findingId}
            initialInsight={finding.insight}
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

export default FindingsDetailsPage
