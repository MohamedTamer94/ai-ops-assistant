import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MoreHorizontal, UserPlus } from 'lucide-react'
import {
  inviteOrgMember,
  listOrgMembers,
  removeOrgMember,
  updateOrgMemberRole,
} from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
import Toast from '../components/Toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function OrgMembersPage() {
  const { orgId } = useParams()
  const { user } = useRequireAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteError, setInviteError] = useState('')
  const [inviting, setInviting] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState('')
  const [removeDialog, setRemoveDialog] = useState({ open: false, userId: '', email: '' })
  const [removing, setRemoving] = useState(false)
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' })

  const currentMember = useMemo(
    () => members.find((member) => member.user_id === user?.id),
    [members, user?.id]
  )

  const canManage = isAdmin || currentMember?.role === 'admin'

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listOrgMembers(orgId)
      const items = Array.isArray(response) ? response : response?.items || []
      setMembers(items)
      if (user) {
        const mine = items.find((item) => item.user_id === user.id)
        setIsAdmin(mine?.role === 'admin')
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Admin role required to manage members in this workspace.')
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to load members.')
      }
      setMembers([])
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [orgId, user])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleInvite = async () => {
    setInviteError('')
    if (!isValidEmail(inviteEmail)) {
      setInviteError('Enter a valid email.')
      return
    }

    setInviting(true)
    try {
      await inviteOrgMember(orgId, { email: inviteEmail.trim(), role: inviteRole })
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('member')
      setToast({ show: true, text: 'Invitation sent successfully.', type: 'success' })
      fetchMembers()
    } catch (err) {
      setInviteError(err.response?.data?.detail || err.message || 'Failed to invite member.')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleToggle = async (member) => {
    if (!canManage) return
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    setUpdatingUserId(member.user_id)
    try {
      await updateOrgMemberRole(orgId, member.user_id, newRole)
      setMembers((prev) =>
        prev.map((item) =>
          item.user_id === member.user_id ? { ...item, role: newRole } : item
        )
      )
      setToast({ show: true, text: 'Member role updated.', type: 'success' })
    } catch (err) {
      setToast({
        show: true,
        text: err.response?.data?.detail || err.message || 'Failed to update role.',
        type: 'error',
      })
    } finally {
      setUpdatingUserId('')
    }
  }

  const handleRemove = async () => {
    if (!removeDialog.userId) return
    setRemoving(true)
    try {
      await removeOrgMember(orgId, removeDialog.userId)
      setMembers((prev) => prev.filter((item) => item.user_id !== removeDialog.userId))
      setToast({ show: true, text: 'Member removed.', type: 'success' })
    } catch (err) {
      setToast({
        show: true,
        text: err.response?.data?.detail || err.message || 'Failed to remove member.',
        type: 'error',
      })
    } finally {
      setRemoving(false)
      setRemoveDialog({ open: false, userId: '', email: '' })
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )
    }

    if (error) {
      return (
        <CardContent className="space-y-4 p-6">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          <Button variant="outline" onClick={fetchMembers}>
            Retry
          </Button>
        </CardContent>
      )
    }

    if (members.length === 0) {
      return (
        <CardContent className="space-y-4 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No members found for this organization.
          </p>
          <Button
            onClick={() => setInviteOpen(true)}
            disabled={!canManage}
            title={canManage ? '' : 'Admin only'}
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </CardContent>
      )
    }

    return (
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isSelf = member.user_id === user?.id
              const actionDisabled = !canManage || isSelf || updatingUserId === member.user_id
              const disableReason = !canManage
                ? 'Admin only'
                : isSelf
                  ? "You can't remove yourself."
                  : ''

              return (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium">{member.name || '-'}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.joined_at ? formatDate(member.joined_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!canManage}
                          title={canManage ? '' : 'Admin only'}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={actionDisabled}
                          title={disableReason}
                          onClick={() => handleRoleToggle(member)}
                        >
                          {member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={actionDisabled}
                          title={disableReason}
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            setRemoveDialog({
                              open: true,
                              userId: member.user_id,
                              email: member.email,
                            })
                          }
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to={`/app/orgs/${orgId}/projects`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage who can access this organization.
          </p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          disabled={!canManage}
          title={canManage ? '' : 'Admin only'}
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>{renderContent()}</Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="invite-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviting}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Role</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inviteRole === 'member' ? 'default' : 'outline'}
                  onClick={() => setInviteRole('member')}
                  disabled={inviting}
                >
                  Member
                </Button>
                <Button
                  type="button"
                  variant={inviteRole === 'admin' ? 'default' : 'outline'}
                  onClick={() => setInviteRole('admin')}
                  disabled={inviting}
                >
                  Admin
                </Button>
              </div>
            </div>

            {inviteError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {inviteError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteOpen(false)
                setInviteError('')
              }}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeDialog.open}
        onOpenChange={(open) =>
          !open && setRemoveDialog({ open: false, userId: '', email: '' })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              This will revoke access for <span className="font-medium">{removeDialog.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialog({ open: false, userId: '', email: '' })}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast.show && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast({ show: false, text: '', type: 'success' })}
        />
      )}
    </div>
  )
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default OrgMembersPage
