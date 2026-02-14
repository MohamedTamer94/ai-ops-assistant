import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Filter, Search } from 'lucide-react'
import { listIngestionEvents } from '@/lib/api'
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { formatDateTime, levelBadgeClass, shortId } from '@/utils/ingestionFormatters'

const LEVEL_OPTIONS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL', 'FATAL']
const DEFAULT_FILTERS = {
  q: '',
  levels: [],
  service: '',
  fingerprint: '',
  ts_from: '',
  ts_to: '',
}

function IngestionEventsTab({
  orgId,
  projectId,
  ingestionId,
  externalFilters,
}) {
  const initialFilters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      ...(externalFilters || {}),
      levels: Array.isArray(externalFilters?.levels) ? externalFilters.levels : [],
    }),
    [externalFilters]
  )

  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const requestRef = useRef(0)

  const hasFilterChanges = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(appliedFilters),
    [filters, appliedFilters]
  )

  const fetchEvents = useCallback(async (cursor = 0, append = false, filterSet = appliedFilters) => {
    const requestId = ++requestRef.current
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const params = { cursor, limit: 100 }
      if (filterSet.q.trim()) params.q = filterSet.q.trim()
      if (filterSet.levels.length > 0) params.levels = filterSet.levels.join(',')
      if (filterSet.service.trim()) params.service = filterSet.service.trim()
      if (filterSet.fingerprint.trim()) {
        params.fingerprint = filterSet.fingerprint.trim()
      }
      if (filterSet.ts_from) params.ts_from = filterSet.ts_from
      if (filterSet.ts_to) params.ts_to = filterSet.ts_to

      const data = await listIngestionEvents(orgId, projectId, ingestionId, params)
      if (requestId !== requestRef.current) return
      setItems((prev) => (append ? [...prev, ...(data?.items || [])] : data?.items || []))
      setNextCursor(data?.next_cursor ?? null)
      setHasMore(Boolean(data?.has_more))
    } catch (err) {
      if (requestId !== requestRef.current) return
      setError(err.response?.data?.detail || err.message || 'Failed to load events')
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [appliedFilters, ingestionId, orgId, projectId])

  useEffect(() => {
    fetchEvents(0, false, appliedFilters)
  }, [appliedFilters, fetchEvents])

  useEffect(() => {
    if (!externalFilters) return
    const next = {
      ...DEFAULT_FILTERS,
      ...externalFilters,
      levels: Array.isArray(externalFilters.levels) ? externalFilters.levels : [],
    }
    setFilters(next)
    setAppliedFilters(next)
  }, [externalFilters])

  const applyFilters = () => {
    setAppliedFilters({ ...filters })
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
  }

  const toggleLevel = (level) => {
    setFilters((prev) => {
      const exists = prev.levels.includes(level)
      return {
        ...prev,
        levels: exists
          ? prev.levels.filter((item) => item !== level)
          : [...prev.levels, level],
      }
    })
  }

  const copyToClipboard = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // no-op
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search message (q)"
                className="pl-9"
                value={filters.q}
                onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Filter className="h-4 w-4" />
                  {filters.levels.length > 0
                    ? `${filters.levels.length} levels`
                    : 'Select levels'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Levels</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LEVEL_OPTIONS.map((level) => (
                  <DropdownMenuCheckboxItem
                    key={level}
                    checked={filters.levels.includes(level)}
                    onCheckedChange={() => toggleLevel(level)}
                  >
                    {level}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Input
              placeholder="Service (exact)"
              value={filters.service}
              onChange={(e) => setFilters((prev) => ({ ...prev, service: e.target.value }))}
            />
            <Input
              placeholder="Fingerprint (exact)"
              value={filters.fingerprint}
              onChange={(e) => setFilters((prev) => ({ ...prev, fingerprint: e.target.value }))}
            />
            <Input
              type="datetime-local"
              value={filters.ts_from}
              onChange={(e) => setFilters((prev) => ({ ...prev, ts_from: e.target.value }))}
            />
            <Input
              type="datetime-local"
              value={filters.ts_to}
              onChange={(e) => setFilters((prev) => ({ ...prev, ts_to: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={applyFilters} disabled={!hasFilterChanges}>
              Apply filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No events found for current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seq</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Fingerprint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell>{event.seq}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.ts ? formatDateTime(event.ts) : '-'}
                    </TableCell>
                    <TableCell>
                      {event.level ? (
                        <Badge className={levelBadgeClass(event.level)} variant="secondary">
                          {event.level}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {event.service ? (
                        <Badge variant="outline">{event.service}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="max-w-[560px] truncate">{event.message}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.fingerprint ? shortId(event.fingerprint, 10, 6) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => fetchEvents(nextCursor || 0, true, appliedFilters)}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Event details</DialogTitle>
            <DialogDescription>
              Sequence #{selectedEvent?.seq}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 text-sm">
              <KeyValueRow
                label="ID"
                value={selectedEvent.id}
                onCopy={() => copyToClipboard(selectedEvent.id)}
              />
              <KeyValueRow label="Timestamp" value={selectedEvent.ts || '-'} />
              <KeyValueRow label="Level" value={selectedEvent.level || '-'} />
              <KeyValueRow label="Service" value={selectedEvent.service || '-'} />
              <KeyValueRow
                label="Fingerprint"
                value={selectedEvent.fingerprint || '-'}
                onCopy={() => copyToClipboard(selectedEvent.fingerprint)}
              />
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Message
                </p>
                <div className="max-h-64 overflow-auto rounded-md border bg-muted/20 p-3">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                    {selectedEvent.message || '-'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KeyValueRow({ label, value, onCopy }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 rounded-md border bg-muted/20 p-2 font-mono text-xs">
          <span className="break-all">{value}</span>
        </div>
        {onCopy && (
          <Button variant="outline" size="icon" onClick={onCopy} aria-label={`Copy ${label}`}>
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default IngestionEventsTab
