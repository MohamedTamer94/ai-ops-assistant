import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createIngestion, pasteIngestionLogs } from '../lib/api'

function NewIngestionPage() {
  const { orgId, projectId } = useParams()
  const navigate = useNavigate()
  const [logsText, setLogsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!logsText.trim() || logsText.trim().length < 10) {
      setError('Please enter at least 10 characters of logs')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Step 1: Create ingestion
      const ingestion = await createIngestion(orgId, projectId, { source_type: 'paste' })
      
      // Step 2: Paste logs
      await pasteIngestionLogs(orgId, projectId, ingestion.id, logsText)
      
      // Step 3: Redirect to details
      navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestion.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

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

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Paste Logs</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Type
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700">
              paste
            </div>
          </div>

          <div>
            <label htmlFor="logs" className="block text-sm font-medium text-gray-700 mb-2">
              Logs
            </label>
            <textarea
              id="logs"
              value={logsText}
              onChange={(e) => setLogsText(e.target.value)}
              disabled={loading}
              placeholder="Paste your logs here (minimum 10 characters)"
              rows="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded transition"
            >
              {loading ? 'Creating...' : 'Create Ingestion'}
            </button>
            <Link
              to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
              className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewIngestionPage
