import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExternalLink, MoreHorizontal, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { deleteIngestion, listIngestions } from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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

function IngestionsListPage() {
  const { orgId, projectId } = useParams()
  const navigate = useNavigate()
  useRequireAuth()
  const [ingestions, setIngestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [ingestionToDelete, setIngestionToDelete] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchIngestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listIngestions(orgId, projectId)
      setIngestions(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => {
    fetchIngestions()
  }, [fetchIngestions])

  const normalizedIngestions = useMemo(() => {
    return ingestions.map((item) => ({
      ...item,
      status_normalized: normalizeStatus(item.status),
      source_type_normalized: (item.source_type || '').toLowerCase(),
    }))
  }, [ingestions])

  const hasCreatedAt = useMemo(
    () => normalizedIngestions.some((item) => Boolean(item.created_at)),
    [normalizedIngestions]
  )

  const filteredIngestions = useMemo(() => {
    const query = search.trim().toLowerCase()

    return normalizedIngestions.filter((item) => {
      const matchesSearch =
        !query ||
        item.id?.toLowerCase().includes(query) ||
        item.source_type_normalized.includes(query) ||
        item.status_normalized.includes(query)

      const matchesStatus =
        statusFilter === 'all' || item.status_normalized === statusFilter

      const matchesSource =
        sourceFilter === 'all' || item.source_type_normalized === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [normalizedIngestions, search, statusFilter, sourceFilter])

  const handleOpenIngestion = (ingestionId) => {
    navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}`)
  }

  const handleConfirmDelete = async () => {
    if (!ingestionToDelete) return

    setDeleting(true)
    setError(null)
    try {
      await deleteIngestion(orgId, projectId, ingestionToDelete.id)
      setIngestions((prev) => prev.filter((item) => item.id !== ingestionToDelete.id))
      setDeleteDialogOpen(false)
      setIngestionToDelete(null)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete ingestion')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ingestions</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage ingestion runs for this project.
          </p>
        </div>
        <Button onClick={() => navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions/new`)}>
          <Plus className="h-4 w-4" />
          New ingestion
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Could not load ingestions</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={fetchIngestions} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, source, or status"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Status"
                value={statusFilter}
                options={STATUS_FILTER_OPTIONS}
                onChange={setStatusFilter}
              />
              <FilterSelect
                label="Source"
                value={sourceFilter}
                options={SOURCE_FILTER_OPTIONS}
                onChange={setSourceFilter}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingTable hasCreatedAt={hasCreatedAt} />
          ) : ingestions.length === 0 ? (
            <EmptyState onCreate={() => navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions/new`)} />
          ) : filteredIngestions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No ingestions match your current filters.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setSourceFilter('all')
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  {hasCreatedAt && <TableHead>Created</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngestions.map((ingestion) => (
                  <TableRow key={ingestion.id}>
                    <TableCell className="font-mono text-xs">
                      {shortId(ingestion.id)}
                    </TableCell>
                    <TableCell className="capitalize">{ingestion.source_type || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={ingestion.status_normalized} />
                    </TableCell>
                    {hasCreatedAt && (
                      <TableCell className="text-muted-foreground">
                        {formatDate(ingestion.created_at)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenIngestion(ingestion.id)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Open row actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenIngestion(ingestion.id)}>
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setIngestionToDelete(ingestion)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ingestion?</DialogTitle>
            <DialogDescription>
              This permanently deletes the ingestion and related results.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs">
            {ingestionToDelete ? shortId(ingestionToDelete.id) : 'Unknown ingestion'}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'pending' },
  { value: 'processing', label: 'processing' },
  { value: 'done', label: 'done' },
  { value: 'failed', label: 'failed' },
]

const SOURCE_FILTER_OPTIONS = [
  { value: 'all', label: 'All sources' },
  { value: 'paste', label: 'paste' },
  { value: 'upload', label: 'upload' },
  { value: 'demo', label: 'demo' },
]

function FilterSelect({ label, value, options, onChange }) {
  const selected = options.find((item) => item.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[152px] justify-between">
          <span>{selected?.label || label}</span>
          <span className="text-muted-foreground">Select</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StatusBadge({ status }) {
  const classesByStatus = {
    pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    processing: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    done: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    failed: 'bg-red-100 text-red-800 hover:bg-red-100',
  }

  return (
    <Badge className={classesByStatus[status] || 'bg-muted text-foreground'} variant="secondary">
      {status}
    </Badge>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="text-sm font-medium">No ingestions yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Create an ingestion to start processing logs for this project.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        Create ingestion
      </Button>
    </div>
  )
}

function LoadingTable({ hasCreatedAt }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      {hasCreatedAt && <Skeleton className="h-10 w-full" />}
    </div>
  )
}

function normalizeStatus(status) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'completed') return 'done'
  return normalized || 'unknown'
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function shortId(value) {
  if (!value) return '-'
  if (value.length <= 12) return value
  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

export default IngestionsListPage
