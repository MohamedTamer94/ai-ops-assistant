import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { listProjects, createProject } from '../lib/api'
import Container from '../components/Container'

function ProjectsPage() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [orgId])

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listProjects(orgId)
      setProjects(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreating(true)
    setCreateError(null)
    try {
      const newProject = await createProject(orgId, newProjectName)
      setProjects([...projects, newProject])
      setNewProjectName('')
      // Auto-navigate to new project dashboard
      navigate(`/app/orgs/${orgId}/projects/${newProject.id}`)
    } catch (err) {
      setCreateError(err.response?.data?.detail || err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Container>
      <div>
<div className="mb-6 xs:mb-8">
        <Link to="/app" className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm">
          ← Back to Organizations
        </Link>
        <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mt-3 xs:mt-4">Projects</h2>
      </div>

      {error && (
        <div className="p-3 xs:p-4 mb-4 xs:mb-6 bg-red-50 border border-red-200 text-red-700 rounded text-xs xs:text-sm">
          {error}
        </div>
      )}

        <div className="bg-white rounded-lg shadow p-4 xs:p-6 mb-6 xs:mb-8">
          <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-3 xs:mb-4">Create Project</h3>
          <form onSubmit={handleCreateProject} className="flex flex-col xs:flex-row gap-2">
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              disabled={creating}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={creating || !newProjectName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition whitespace-nowrap"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
          {createError && (
            <p className="text-red-600 text-xs xs:text-sm mt-2">{createError}</p>
          )}
        </div>

        {loading ? (
          <p className="text-gray-600 text-sm">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 text-xs xs:text-sm">No projects yet. Create one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/app/orgs/${orgId}/projects/${project.id}`}
                className="p-4 xs:p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200 hover:border-blue-500 transition"
              >
                <h3 className="text-base xs:text-lg font-semibold text-gray-900 break-words">{project.name}</h3>
                <p className="text-xs xs:text-sm text-gray-500 mt-1 break-all">Project ID: {project.id}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export default ProjectsPage
