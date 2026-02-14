import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import useAuthStore from '../stores/auth'
import { createOrganization } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

function OrgSelectPage() {
  const user = useAuthStore((state) => state.user)
  const fetchMe = useAuthStore((state) => state.fetchMe)
  const loading = useAuthStore((state) => state.loading)
  const navigate = useNavigate()
  const [newOrgName, setNewOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  useEffect(() => {
    if (!user) {
      fetchMe()
    }
  }, [])

  const handleCreateOrganization = async (e) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setCreating(true)
    setCreateError(null)
    try {
      const organization = await createOrganization(newOrgName.trim())
      setNewOrgName('')
      await fetchMe()
      navigate(`/app/orgs/${organization.id}/projects`)
    } catch (err) {
      setCreateError(err.response?.data?.detail || err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Organizations</h2>
          <p className="text-sm text-neutral-600">Select an organization to manage projects</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!user?.organizations || user.organizations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Organizations</h2>
          <p className="text-sm text-neutral-600">No organizations yet</p>
        </div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Create Organization</h3>
          <form onSubmit={handleCreateOrganization} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter organization name..."
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              disabled={creating}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={creating || !newOrgName.trim()}
              className="sm:whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" />
              {creating ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
          {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
        </Card>
        <Card className="p-6 border-l-4 border-l-blue-500 bg-blue-50">
          <p className="text-blue-900 text-sm">
            You don't have any organizations yet. Create one to get started.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Organizations</h2>
        <p className="text-sm text-neutral-600">Select an organization to manage projects</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Create Organization</h3>
        <form onSubmit={handleCreateOrganization} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter organization name..."
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            disabled={creating}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={creating || !newOrgName.trim()}
            className="sm:whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            {creating ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
        {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {user.organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => navigate(`/app/orgs/${org.id}/projects`)}
            className="text-left"
          >
            <Card className="p-5 card-hover cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 truncate text-sm">
                    {org.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Click to view projects
                  </p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}

export default OrgSelectPage
