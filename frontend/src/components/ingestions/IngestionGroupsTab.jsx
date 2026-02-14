import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { getGroupOverview, listIngestionGroups } from '@/lib/api'
import AIInsightCard from '@/components/ingestions/AIInsightCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, levelBadgeClass, shortId } from '@/utils/ingestionFormatters'

function IngestionGroupsTab({
  orgId,
  projectId,
  ingestionId,
  onViewEventsForFingerprint,
  initialFingerprint,
}) {
  const [items, setItems] = useState([])
  const [offset, setOffset] = useState(0)
  const [nextOffset, setNextOffset] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFingerprint, setSelectedFingerprint] = useState('')
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  const selectedInsight = details?.insight

  const fetchGroups = useCallback(async (startOffset = 0, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await listIngestionGroups(orgId, projectId, ingestionId, {
        offset: startOffset,
        limit: 10,
      })
      setItems((prev) => (append ? [...prev, ...(data?.items || [])] : data?.items || []))
      setOffset(startOffset)
      setNextOffset(data?.next_offset ?? null)
      setHasMore(Boolean(data?.has_more))
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load groups')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [ingestionId, orgId, projectId])

  const loadGroupDetails = useCallback(async (fingerprint) => {
    setSelectedFingerprint(fingerprint)
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const data = await getGroupOverview(orgId, projectId, ingestionId, fingerprint)
      setDetails(data)
    } catch (err) {
      setDetailsError(err.response?.data?.detail || err.message || 'Failed to load group details')
    } finally {
      setDetailsLoading(false)
    }
  }, [ingestionId, orgId, projectId])

  useEffect(() => {
    fetchGroups(0, false)
  }, [fetchGroups])

  useEffect(() => {
    if (!initialFingerprint) return
    loadGroupDetails(initialFingerprint)
  }, [initialFingerprint, loadGroupDetails])

  const levelEntries = useMemo(() => {
    const value = details?.breakdown?.levels || {}
    return Object.entries(value).sort((a, b) => b[1] - a[1])
  }, [details?.breakdown?.levels])

  const serviceEntries = useMemo(() => {
    const value = details?.breakdown?.services || {}
    return Object.entries(value).sort((a, b) => b[1] - a[1])
  }, [details?.breakdown?.services])

  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No groups available yet.
            </CardContent>
          </Card>
        ) : (
          items.map((group) => (
            <Card key={group.fingerprint} className="cursor-pointer" onClick={() => loadGroupDetails(group.fingerprint)}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-mono text-xs text-muted-foreground">
                    {shortId(group.fingerprint, 14, 8)}
                  </p>
                  <p className="truncate text-sm">{group.latest?.message || 'No preview message'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {group.latest?.level && (
                      <Badge className={levelBadgeClass(group.latest.level)} variant="secondary">
                        {group.latest.level}
                      </Badge>
                    )}
                    {group.latest?.service && <Badge variant="outline">{group.latest.service}</Badge>}
                    {group.latest?.ts && (
                      <span className="text-xs text-muted-foreground">{formatDateTime(group.latest.ts)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">{group.count || 0}</p>
                  <p className="text-xs text-muted-foreground">events</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => fetchGroups(nextOffset ?? offset + 10, true)}
          >
            {loadingMore ? 'Loading...' : 'Load more groups'}
          </Button>
        </div>
      )}

      <Dialog open={Boolean(selectedFingerprint)} onOpenChange={(open) => !open && setSelectedFingerprint('')}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Group {shortId(selectedFingerprint, 12, 8)}</DialogTitle>
            <DialogDescription>
              Drilldown by fingerprint.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading && (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {detailsError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {detailsError}
            </div>
          )}

          {!detailsLoading && details && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <MetricCard label="Total events" value={details.group?.total_events || 0} />
                <MetricCard label="First seen" value={formatDateTime(details.group?.first_seen)} />
                <MetricCard label="Last seen" value={formatDateTime(details.group?.last_seen)} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Levels breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {levelEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No levels found.</p>
                    ) : (
                      levelEntries.map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <Badge className={levelBadgeClass(level)} variant="secondary">
                            {level}
                          </Badge>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Services breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {serviceEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No services found.</p>
                    ) : (
                      serviceEntries.map(([service, count]) => (
                        <div key={service} className="flex items-center justify-between">
                          <span className="text-sm">{service}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <EventPreviewCard title="Sample event" event={details.group?.sample} />
                <EventPreviewCard title="Latest event" event={details.group?.latest} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => onViewEventsForFingerprint(selectedFingerprint)}>
                  View events for this group
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline">
                  <Sparkles className="h-4 w-4" />
                  Insight available in card below
                </Button>
                {selectedInsight && <Badge variant="secondary">Saved insight found</Badge>}
              </div>

              <AIInsightCard
                orgId={orgId}
                projectId={projectId}
                ingestionId={ingestionId}
                scopeType="group"
                scopeId={selectedFingerprint}
                initialInsight={details?.insight}
              />
            </div>
          )}
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

function EventPreviewCard({ title, event }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {event ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {event.level && (
                <Badge className={levelBadgeClass(event.level)} variant="secondary">
                  {event.level}
                </Badge>
              )}
              {event.service && <Badge variant="outline">{event.service}</Badge>}
              {event.ts && <span className="text-xs text-muted-foreground">{formatDateTime(event.ts)}</span>}
            </div>
            <p className="line-clamp-3 text-sm">{event.message}</p>
          </>
        ) : (
          <p className="text-muted-foreground">No event available.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default IngestionGroupsTab
