import { Routes, Route, Navigate } from 'react-router-dom'
import IngestionsListPage from '../pages/IngestionsListPage'
import NewIngestionPage from '../pages/NewIngestionPage'
import IngestionDetailsPage from '../pages/IngestionDetailsPage'

function ProjectLayout() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="ingestions" replace />} />
      <Route path="/ingestions" element={<IngestionsListPage />} />
      <Route path="/ingestions/new" element={<NewIngestionPage />} />
      <Route path="/ingestions/:ingestionId" element={<IngestionDetailsPage />} />
    </Routes>
  )
}

export default ProjectLayout

