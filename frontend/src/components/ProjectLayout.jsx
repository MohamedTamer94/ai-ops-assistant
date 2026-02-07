import { Routes, Route, Navigate, Link, useParams, useLocation } from 'react-router-dom'
import Container from './Container'
import IngestionsListPage from '../pages/IngestionsListPage'
import NewIngestionPage from '../pages/NewIngestionPage'
import IngestionDetailsPage from '../pages/IngestionDetailsPage'

function ProjectLayout() {
  const { orgId, projectId } = useParams()
  const location = useLocation()

  // Check if current route is under /ingestions
  const isIngestionsActive = location.pathname.includes('/ingestions')

  return (
    <Container>
      <div>
        {/* Header */}
        <div className="mb-6">
          <Link to={`/app/orgs/${orgId}/projects`} className="text-blue-600 hover:text-blue-700 text-sm mb-4 block">
            ← Back to Projects
          </Link>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Org ID: {orgId}</p>
            <p>Project ID: {projectId}</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-2">
              <Link
                to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
                className={`block px-4 py-2 rounded transition ${
                  isIngestionsActive
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Ingestions
              </Link>
              <div className="px-4 py-2 text-gray-500 text-sm cursor-not-allowed opacity-60">
                Settings (coming soon)
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="ingestions" replace />} />
              <Route path="/ingestions" element={<IngestionsListPage />} />
              <Route path="/ingestions/new" element={<NewIngestionPage />} />
              <Route path="/ingestions/:ingestionId" element={<IngestionDetailsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Container>
  )
}

export default ProjectLayout

