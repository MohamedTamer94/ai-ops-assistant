import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { listIngestions } from '../lib/api'

function IngestionsListPage() {
  const { orgId, projectId } = useParams()
  const navigate = useNavigate()
  const [ingestions, setIngestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchIngestions()
  }, [orgId, projectId])

  const fetchIngestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listIngestions(orgId, projectId)
      setIngestions(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center mb-4 xs:mb-6 gap-2 xs:gap-0">
        <h2 className="text-xl xs:text-2xl font-bold text-gray-900">Ingestions</h2>
        <Link
          to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/new`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-xs xs:text-base transition whitespace-nowrap"
        >
          New Ingestion
        </Link>
      </div>

      {error && (
        <div className="p-3 xs:p-4 mb-4 xs:mb-6 bg-red-50 border border-red-200 text-red-700 rounded text-xs xs:text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600 text-sm">Loading ingestions...</p>
      ) : ingestions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 text-xs xs:text-sm">No ingestions yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">ID</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900 hidden xs:table-cell">Source Type</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ingestions.map((ing) => (
                <tr key={ing.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-2 sm:py-3 font-mono text-gray-700 break-all text-xs">
                    {ing.id.substring(0, 8)}...
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-700 hidden xs:table-cell">{ing.source_type}</td>
                  <td className="px-3 sm:px-6 py-2 sm:py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getStatusBadgeColor(ing.status)}`}>
                      {ing.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-3">
                    <Link
                      to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ing.id}`}
                      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default IngestionsListPage
