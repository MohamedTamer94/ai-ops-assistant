import { Link, useParams } from 'react-router-dom'

function ProjectDashboardPage() {
  const { orgId, projectId } = useParams()

  return (
    <div>
      <Link to={`/app/orgs/${orgId}/projects`} className="text-blue-600 hover:text-blue-700 text-sm">
        ← Back to Projects
      </Link>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Dashboard</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-600">Organization ID</p>
            <p className="text-lg font-mono">{orgId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Project ID</p>
            <p className="text-lg font-mono">{projectId}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700">Ingestions and analysis features coming soon.</p>
      </div>
    </div>
  )
}

export default ProjectDashboardPage
