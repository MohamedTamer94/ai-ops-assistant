import { Link, useParams } from 'react-router-dom'

function IngestionDetailsPlaceholderPage() {
  const { orgId, projectId, ingestionId } = useParams()

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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingestion Details</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Ingestion ID</p>
            <p className="text-lg font-mono text-gray-900">{ingestionId}</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-700 font-medium">Processing started.</p>
          <p className="text-blue-600 text-sm mt-1">
            Overview page will be implemented next.
          </p>
        </div>
      </div>
    </div>
  )
}

export default IngestionDetailsPlaceholderPage
