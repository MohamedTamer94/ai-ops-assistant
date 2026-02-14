import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import {
  deleteIngestion,
  getIngestionOverview,
} from '@/lib/api'
import IngestionEventsTab from '@/components/ingestions/IngestionEventsTab'
import IngestionGroupsTab from '@/components/ingestions/IngestionGroupsTab'
import IngestionFindingsTab from '@/components/ingestions/IngestionFindingsTab'
import useRequireAuth from '@/hooks/useRequireAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  formatDateTime,
  levelBadgeClass,
  normalizeStatus,
  severityBadgeClass,
  shortId,
  statusBadgeClass,
} from '@/utils/ingestionFormatters'

function IngestionDetailsPage() {
  const { orgId, projectId, ingestionId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  useRequireAuth()

  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'events')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [eventsExternalFilters, setEventsExternalFilters] = useState({
    fingerprint: searchParams.get('fingerprint') || '',
  })
  const [groupsInitialFingerprint, setGroupsInitialFingerprint] = useState('')

  const fetchOverview = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await getIngestionOverview(orgId, projectId, ingestionId)
      setOverview(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load ingestion overview')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [ingestionId, orgId, projectId])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    const status = normalizeStatus(overview?.ingestion?.status)
    if (status !== 'pending' && status !== 'processing') return

    const interval = setInterval(() => {
      fetchOverview({ silent: true })
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchOverview, overview?.ingestion?.status])

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deleteIngestion(orgId, projectId, ingestionId)
      navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions`)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Delete failed')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const openEventsForFingerprint = (fingerprint) => {
    setEventsExternalFilters({ fingerprint: fingerprint || '' })
    setActiveTab('events')
  }

  const openGroupDrilldown = (fingerprint) => {
    if (!fingerprint) return
    setGroupsInitialFingerprint(fingerprint)
    setActiveTab('groups')
  }

  const ingestion = overview?.ingestion
  const stats = overview?.stats
  const findings = overview?.findings
  const groups = overview?.groups

  const servicesTop = useMemo(() => {
    const entries = Object.entries(stats?.services_top || {})
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [stats?.services_top])

  const levelTop = useMemo(() => {
    const entries = Object.entries(stats?.levels || {})
    return entries.sort((a, b) => b[1] - a[1])
  }, [stats?.levels])

  if (loading && !overview) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link
            to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
            className="inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            Back to ingestions
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ingestion {shortId(ingestionId, 8, 0)}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{ingestion?.source_type || 'unknown source'}</Badge>
            <Badge className={statusBadgeClass(ingestion?.status)} variant="secondary">
              {normalizeStatus(ingestion?.status)}
            </Badge>
            {stats?.time_range?.min_ts && (
              <span>First event: {formatDateTime(stats.time_range.min_ts)}</span>
            )}
            {stats?.time_range?.max_ts && (
              <span>Last event: {formatDateTime(stats.time_range.max_ts)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/app/orgs/${orgId}/projects/${projectId}/ingestions/new`}>
              <Plus className="h-4 w-4" />
              New ingestion
            </Link>
          </Button>
          <Button variant="outline" onClick={() => fetchOverview({ silent: true })} disabled={refreshing}>
            <RefreshCw className="h-4 w-4" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete ingestion
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total events" value={stats?.total_events || 0} />
        <MetricCard label="Events with timestamp" value={stats?.total_events_with_ts || 0} />
        <MetricCard label="Min timestamp" value={formatDateTime(stats?.time_range?.min_ts)} />
        <MetricCard label="Max timestamp" value={formatDateTime(stats?.time_range?.max_ts)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Levels distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {levelTop.length === 0 ? (
              <p className="text-sm text-muted-foreground">No levels yet.</p>
            ) : (
              levelTop.map(([level, count]) => (
                <div key={level} className="flex items-center justify-between gap-2">
                  <Badge className={levelBadgeClass(level)} variant="secondary">
                    {level}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {servicesTop.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services yet.</p>
            ) : (
              servicesTop.map(([service, count]) => (
                <div key={service} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{service}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Findings summary</CardTitle>
            <CardDescription>{findings?.count || 0} findings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!Array.isArray(findings?.items) || findings.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No findings yet.</p>
            ) : (
              findings.items.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm">{item.title}</p>
                  <Badge className={severityBadgeClass(item.severity)} variant="secondary">
                    {item.severity}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top groups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!Array.isArray(groups?.top) || groups.top.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No groups yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Latest message</TableHead>
                  <TableHead>Latest level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.top.slice(0, 8).map((group) => (
                  <TableRow
                    key={group.fingerprint}
                    className="cursor-pointer"
                    onClick={() => openGroupDrilldown(group.fingerprint)}
                  >
                    <TableCell className="font-mono text-xs">
                      {shortId(group.fingerprint, 14, 8)}
                    </TableCell>
                    <TableCell>{group.count}</TableCell>
                    <TableCell className="max-w-[520px] truncate">
                      {group.latest?.message || '-'}
                    </TableCell>
                    <TableCell>
                      {group.latest?.level ? (
                        <Badge className={levelBadgeClass(group.latest.level)} variant="secondary">
                          {group.latest.level}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="findings">Findings</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'events' && (
          <IngestionEventsTab
            orgId={orgId}
            projectId={projectId}
            ingestionId={ingestionId}
            externalFilters={eventsExternalFilters}
          />
        )}
        {activeTab === 'groups' && (
          <IngestionGroupsTab
            orgId={orgId}
            projectId={projectId}
            ingestionId={ingestionId}
            initialFingerprint={groupsInitialFingerprint}
            onViewEventsForFingerprint={openEventsForFingerprint}
          />
        )}
        {activeTab === 'findings' && (
          <IngestionFindingsTab
            orgId={orgId}
            projectId={projectId}
            ingestionId={ingestionId}
            onViewEventsForFingerprint={openEventsForFingerprint}
          />
        )}
      </section>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ingestion?</DialogTitle>
            <DialogDescription>
              This permanently deletes logs, findings, and generated analysis.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </CardContent>
    </Card>
  )
}

export default IngestionDetailsPage
