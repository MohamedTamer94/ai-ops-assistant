import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/auth'
import Container from '../components/Container'

function OrgSelectPage() {
  const user = useAuthStore((state) => state.user)
  const fetchMe = useAuthStore((state) => state.fetchMe)
  const loading = useAuthStore((state) => state.loading)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      fetchMe()
    }
  }, [])

  if (loading && !user) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Container>
    )
  }

  if (!user?.organizations || user.organizations.length === 0) {
    return (
      <Container>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-700">No organizations yet. Create one to get started.</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Organization</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {user.organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => navigate(`/app/orgs/${org.id}/projects`)}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200 hover:border-blue-500 transition text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
            <p className="text-sm text-gray-500 mt-1">Click to manage projects</p>
          </button>
        ))}
      </div>
    </Container>
  )
}

export default OrgSelectPage
