import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles } from 'lucide-react'
import { generateInsight } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function AIInsightCard({
  orgId,
  projectId,
  ingestionId,
  scopeType,
  scopeId,
  initialInsight,
}) {
  const [insight, setInsight] = useState(initialInsight || '')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cached, setCached] = useState(false)

  useEffect(() => {
    setInsight(initialInsight || '')
  }, [initialInsight])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await generateInsight(orgId, projectId, ingestionId, scopeType, scopeId)
      setInsight(data?.insight || '')
      setCached(Boolean(data?.cached))
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate insight')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">AI Explanation</CardTitle>
            <CardDescription>
              Summarized analysis for this {scopeType}.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {cached && <Badge variant="secondary">Cached</Badge>}
            <Button onClick={handleGenerate} disabled={loading}>
              <Sparkles className="h-4 w-4" />
              {insight ? (loading ? 'Regenerating...' : 'Regenerate') : loading ? 'Generating...' : 'Explain with AI'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {!insight && !error && !loading && (
          <p className="text-sm text-muted-foreground">
            No explanation yet. Generate one for this {scopeType}.
          </p>
        )}
        {insight && (
          <div className="prose prose-sm max-w-none text-foreground">
            <ReactMarkdown>{insight}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AIInsightCard
