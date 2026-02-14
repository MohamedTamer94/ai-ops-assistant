import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Trash2, Plus, ChevronRight } from 'lucide-react'
import { listProjects, createProject, deleteProject, deleteOrganization } from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Projects</h2>
          <p className="text-sm text-neutral-600 mt-1">Manage your organization's projects</p>
        </div>
        <Link
          to={`/app/orgs/${orgId}/members`}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition"
        >
          Members
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="p-4 border-l-4 border-l-red-500 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Create Project Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Create New Project</h3>
        <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            disabled={creating}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={creating || !newProjectName.trim()}
            className="sm:whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
        {createError && (
          <p className="text-sm text-red-600 mt-3">{createError}</p>
        )}
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-600">No projects yet. Create one above to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/app/orgs/${orgId}/projects/${project.id}`}
            >
              <Card className="p-5 card-hover cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 break-words line-clamp-2">
                    {project.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-2 font-mono">
                    {project.id}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setDeleteConfirm({ open: true, type: 'project', id: project.id })
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-700 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div className="border-t border-neutral-200 pt-8">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-sm text-red-800 mb-4">
            Delete this organization and all its projects permanently. This action cannot be undone.
          </p>
          <Button
            onClick={() => setDeleteConfirm({ open: true, type: 'organization', id: null })}
            disabled={deleting}
            variant="destructive"
            size="sm"
          >
            Delete Organization
          </Button>
        </Card>
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
    </div>
  )
}

export default ProjectsPage
