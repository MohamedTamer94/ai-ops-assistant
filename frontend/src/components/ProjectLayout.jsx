import { Routes, Route, Navigate, Link, useParams, useLocation } from 'react-router-dom'
import Container from './Container'
import IngestionsListPage from '../pages/IngestionsListPage'
import NewIngestionPage from '../pages/NewIngestionPage'
import IngestionDetailsPage from '../pages/IngestionDetailsPage'
import GroupDrilldownPage from '../pages/GroupDrilldownPage'
import FindingsDetailsPage from '../pages/FindingsDetailsPage'

function ProjectLayout() {
  const { orgId, projectId } = useParams()
  const location = useLocation()

  // Check if current route is under /ingestions
  const isIngestionsActive = location.pathname.includes('/ingestions')

  return (
    <Container>
      <div>
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link to={`/app/orgs/${orgId}/projects`} className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm mb-3 sm:mb-4 block">
            ← Back to Projects
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:gap-6">
          {/* Sidebar */}
          <aside className="w-full sm:w-48 sm:flex-shrink-0 mb-4 sm:mb-0">
            <nav className="grid grid-cols-1 sm:grid-cols-1 gap-2">
              <Link
                to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
                className={`block px-4 py-2 rounded text-sm transition ${
                  isIngestionsActive
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Ingestions
              </Link>
              <div className="px-4 py-2 text-gray-500 text-xs sm:text-sm cursor-not-allowed opacity-60">
                Settings (coming soon)
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<Navigate to="ingestions" replace />} />
              <Route path="/ingestions" element={<IngestionsListPage />} />
              <Route path="/ingestions/new" element={<NewIngestionPage />} />
              <Route path="/ingestions/:ingestionId" element={<IngestionDetailsPage />} />
              <Route path="/ingestions/:ingestionId/groups/:fingerprint" element={<GroupDrilldownPage />} />
              <Route path="/ingestions/:ingestionId/findings/:findingId" element={<FindingsDetailsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Container>
  )
}

export default ProjectLayout

