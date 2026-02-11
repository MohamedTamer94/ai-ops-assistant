import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { listProjects, createProject, deleteProject, deleteOrganization } from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
import Container from '../components/Container'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

function ProjectsPage() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  useRequireAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null })
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState({ show: false, text: '', type: 'success' })

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

  const handleDeleteProject = async (projectId) => {
    setDeleteConfirm({ open: false, type: null, id: null })
    setDeleting(true)
    try {
      await deleteProject(orgId, projectId)
      setProjects(projects.filter((p) => p.id !== projectId))
      setDeleteMessage({ show: true, text: 'Project deleted successfully', type: 'success' })
    } catch (err) {
      const msg = err.response?.status === 403 ? 'Not allowed' : err.response?.data?.detail || 'Delete failed'
      setDeleteMessage({ show: true, text: msg, type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteOrganization = async () => {
    setDeleteConfirm({ open: false, type: null, id: null })
    setDeleting(true)
    try {
      await deleteOrganization(orgId)
      setDeleteMessage({ show: true, text: 'Organization deleted', type: 'success' })
      setTimeout(() => navigate('/app'), 1500)
    } catch (err) {
      const msg = err.response?.status === 403 ? 'Not allowed' : err.response?.data?.detail || 'Delete failed'
      setDeleteMessage({ show: true, text: msg, type: 'error' })
      setDeleting(false)
    }
  }

  return (
    <Container>
      <div>
        <div className="mb-6 xs:mb-8 flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3 xs:gap-0">
          <div>
            <Link to="/app" className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm">
              ← Back to Organizations
            </Link>
            <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mt-3 xs:mt-0">Projects</h2>
          </div>
          <Link
            to={`/app/orgs/${orgId}/members`}
            className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm font-medium whitespace-nowrap"
          >
            Manage Members →
          </Link>
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
              <div key={project.id} className="p-4 xs:p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200 hover:border-blue-500 transition">
                <Link
                  to={`/app/orgs/${orgId}/projects/${project.id}`}
                  className="block"
                >
                  <h3 className="text-base xs:text-lg font-semibold text-gray-900 break-words hover:text-blue-600">{project.name}</h3>
                  <p className="text-xs xs:text-sm text-gray-500 mt-1 break-all">Project ID: {project.id}</p>
                </Link>
                <button
                  onClick={() => setDeleteConfirm({ open: true, type: 'project', id: project.id })}
                  className="mt-3 text-xs font-medium text-red-600 hover:text-red-700 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-8 xs:mt-12 pt-6 xs:pt-8 border-t border-gray-300">
          <h3 className="text-base xs:text-lg font-semibold text-red-600 mb-3 xs:mb-4">Danger Zone</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 xs:p-6">
            <p className="text-xs xs:text-sm text-red-800 mb-3">Delete this organization and all its projects permanently.</p>
            <button
              onClick={() => setDeleteConfirm({ open: true, type: 'organization', id: null })}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs sm:text-sm font-medium px-3 xs:px-4 py-2 rounded transition"
            >
              Delete Organization
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs and Toast */}
      <ConfirmDialog
        open={deleteConfirm.open && deleteConfirm.type === 'project'}
        title="Delete Project?"
        description="This will permanently delete the project and all its ingestions. This action cannot be undone."
        confirmText="Delete"
        danger={true}
        loading={deleting}
        onConfirm={() => handleDeleteProject(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ open: false, type: null, id: null })}
      />
      <ConfirmDialog
        open={deleteConfirm.open && deleteConfirm.type === 'organization'}
        title="Delete Organization?"
        description="This will permanently delete the organization and all its projects and ingestions. This action cannot be undone."
        confirmText="Delete"
        danger={true}
        loading={deleting}
        onConfirm={handleDeleteOrganization}
        onCancel={() => setDeleteConfirm({ open: false, type: null, id: null })}
      />
      {deleteMessage.show && (
        <Toast
          message={deleteMessage.text}
          type={deleteMessage.type}
          onClose={() => setDeleteMessage({ show: false, text: '', type: 'success' })}
        />
      )}
    </Container>
  )
}

export default ProjectsPage
