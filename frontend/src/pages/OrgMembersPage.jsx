import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { listOrgMembers, inviteOrgMember, updateOrgMemberRole, removeOrgMember } from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
import Container from '../components/Container'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

function OrgMembersPage() {
  const { orgId } = useParams()
  const { user, loading: authLoading } = useRequireAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Remove confirmation
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, userId: null, email: null })
  const [removing, setRemoving] = useState(false)

  // Role change
  const [roleChanging, setRoleChanging] = useState(null)

  // Toast
  const [message, setMessage] = useState({ show: false, text: '', type: 'success' })

  useEffect(() => {
    fetchMembers()
  }, [orgId])

  const fetchMembers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listOrgMembers(orgId)
      const membersList = response.items || response
      setMembers(membersList)

      // Check if current user is admin
      if (user) {
        const currentUserMembership = membersList.find((m) => m.user_id === user.id)
        setIsAdmin(currentUserMembership?.role === 'admin')
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied')
        setIsAdmin(false)
      } else {
        setError(err.response?.data?.detail || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setInviteError('Email is required')
      return
    }

    setInviting(true)
    setInviteError('')
    try {
      await inviteOrgMember(orgId, { email: inviteEmail, role: inviteRole })
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteModal(false)
      setMessage({ show: true, text: 'Member invited successfully', type: 'success' })
      fetchMembers()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      setInviteError(msg)
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    setRoleChanging(userId)
    try {
      await updateOrgMemberRole(orgId, userId, newRole)
      setMembers(members.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)))
      setMessage({ show: true, text: 'Role updated successfully', type: 'success' })
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      setMessage({ show: true, text: msg, type: 'error' })
    } finally {
      setRoleChanging(null)
    }
  }

  const handleRemoveMember = async () => {
    setRemoveConfirm({ open: false, userId: null, email: null })
    setRemoving(true)
    try {
      await removeOrgMember(orgId, removeConfirm.userId)
      setMembers(members.filter((m) => m.user_id !== removeConfirm.userId))
      setMessage({ show: true, text: 'Member removed successfully', type: 'success' })
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      setMessage({ show: true, text: msg, type: 'error' })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Container>
      <div>
        {/* Back link and title */}
        <div className="mb-6 xs:mb-8 flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3 xs:gap-0">
          <div>
            <Link to={`/app/orgs/${orgId}/projects`} className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm">
              ← Back to Projects
            </Link>
            <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mt-3 xs:mt-0">Organization Members</h2>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-xs xs:text-base transition whitespace-nowrap"
            >
              + Invite Member
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 xs:p-4 mb-4 xs:mb-6 bg-red-50 border border-red-200 text-red-700 rounded text-xs xs:text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-600 text-sm">Loading members...</p>
        ) : members.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 text-xs xs:text-sm">No members yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Name</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Email</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Role</th>
                  {isAdmin && <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.user_id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-900 font-medium">{member.name || '—'}</td>
                    <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-700 break-all">{member.email}</td>
                    <td className="px-3 sm:px-6 py-2 sm:py-3">
                      {isAdmin && member.user_id !== user?.id ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                          disabled={roleChanging === member.user_id}
                          className="px-2 py-1 text-xs border border-gray-300 rounded bg-white disabled:bg-gray-100 cursor-pointer"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${member.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {member.role}
                        </span>
                      )}
                    </td>
                    {isAdmin && member.user_id !== user?.id && (
                      <td className="px-3 sm:px-6 py-2 sm:py-3">
                        <button
                          onClick={() => setRemoveConfirm({ open: true, userId: member.user_id, email: member.email })}
                          disabled={removing}
                          className="text-red-600 hover:text-red-700 text-xs font-medium disabled:text-gray-400 transition"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h2>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={inviting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {inviteError && <p className="text-red-600 text-xs">{inviteError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteError('')
                  }}
                  disabled={inviting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:bg-blue-400"
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        open={removeConfirm.open}
        title="Remove member?"
        description={`They will lose access to this organization's projects.`}
        confirmText="Remove"
        danger={true}
        loading={removing}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveConfirm({ open: false, userId: null, email: null })}
      />

      {/* Toast */}
      {message.show && (
        <Toast message={message.text} type={message.type} onClose={() => setMessage({ show: false, text: '', type: 'success' })} />
      )}
    </Container>
  )
}

export default OrgMembersPage
