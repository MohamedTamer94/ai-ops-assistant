import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { getFindingDetails, getIngestionFindings } from '@/lib/api'
import AIInsightCard from '@/components/ingestions/AIInsightCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { severityBadgeClass, sortFindings, shortId } from '@/utils/ingestionFormatters'

function IngestionFindingsTab({
  orgId,
  projectId,
  ingestionId,
  onViewEventsForFingerprint,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFindingId, setSelectedFindingId] = useState('')
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  const sortedItems = useMemo(() => sortFindings(items), [items])

  const fetchFindings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIngestionFindings(orgId, projectId, ingestionId)
      setItems(data?.items || [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load findings')
    } finally {
      setLoading(false)
    }
  }, [ingestionId, orgId, projectId])

  const fetchFindingDetails = useCallback(async (findingId) => {
    setSelectedFindingId(findingId)
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const data = await getFindingDetails(orgId, projectId, ingestionId, findingId)
      setDetails(data)
    } catch (err) {
      setDetailsError(err.response?.data?.detail || err.message || 'Failed to load finding details')
    } finally {
      setDetailsLoading(false)
    }
  }, [ingestionId, orgId, projectId])

  useEffect(() => {
    fetchFindings()
  }, [fetchFindings])

  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No findings available yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Total occurrences</TableHead>
                  <TableHead>Fingerprints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((finding) => (
                  <TableRow
                    key={finding.id}
                    className="cursor-pointer"
                    onClick={() => fetchFindingDetails(finding.id)}
                  >
                    <TableCell className="font-medium">{finding.title}</TableCell>
                    <TableCell>
                      <Badge className={severityBadgeClass(finding.severity)} variant="secondary">
                        {finding.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{finding.confidence ?? '-'}</TableCell>
                    <TableCell>{finding.total_occurrences || 0}</TableCell>
                    <TableCell>{Array.isArray(finding.matched_fingerprints) ? finding.matched_fingerprints.length : 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedFindingId)} onOpenChange={(open) => !open && setSelectedFindingId('')}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Finding details</DialogTitle>
            <DialogDescription>{shortId(selectedFindingId, 12, 8)}</DialogDescription>
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
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={severityBadgeClass(details.finding?.severity)} variant="secondary">
                      {details.finding?.severity}
                    </Badge>
                    <Badge variant="outline">Confidence: {details.finding?.confidence ?? '-'}</Badge>
                    <Badge variant="outline">Occurrences: {details.finding?.total_occurrences || 0}</Badge>
                    {details?.insight && <Badge variant="secondary">Saved insight found</Badge>}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{details.finding?.title}</p>
                    <p className="text-sm text-muted-foreground">Rule: {details.finding?.rule_id || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-2 p-4">
                  <p className="text-sm font-medium">Matched fingerprints</p>
                  {!Array.isArray(details.finding?.matched_fingerprints) || details.finding?.matched_fingerprints.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No matched fingerprints.</p>
                  ) : (
                    details.finding.matched_fingerprints.map((item, index) => (
                      <div key={`${item.fingerprint}-${index}`} className="flex items-center justify-between gap-2 rounded-md border p-2">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs">
                            {shortId(item.fingerprint, 14, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">Count: {item.count || 0}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewEventsForFingerprint(item.fingerprint)}
                        >
                          View events
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-2 p-4">
                  <p className="text-sm font-medium">Evidence preview</p>
                  {!Array.isArray(details.evidence_preview) || details.evidence_preview.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No evidence events.</p>
                  ) : (
                    details.evidence_preview.slice(0, 12).map((event) => (
                      <div key={event.id} className="rounded-md border p-2">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Seq {event.seq}</Badge>
                          {event.level && (
                            <Badge className={severityBadgeClass(event.level)} variant="secondary">
                              {event.level}
                            </Badge>
                          )}
                          {event.fingerprint && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => onViewEventsForFingerprint(event.fingerprint)}
                            >
                              View by fingerprint
                            </Button>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm">{event.message}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <AIInsightCard
                orgId={orgId}
                projectId={projectId}
                ingestionId={ingestionId}
                scopeType="finding"
                scopeId={selectedFindingId}
                initialInsight={details?.insight}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default IngestionFindingsTab
