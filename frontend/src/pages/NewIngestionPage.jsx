import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { UploadCloud } from 'lucide-react'
import { createIngestion, pasteIngestionLogs, uploadIngestionLogs } from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
import Toast from '../components/Toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DEMO_TEMPLATES from '@/data/demoLogs'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const MIN_LOG_CHARS = 50
const MIN_LOG_LINES = 3
const ACCEPTED_EXTENSIONS = ['.log', '.txt', '.json']

function NewIngestionPage() {
  const { orgId, projectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  useRequireAuth()

  const initialMode = searchParams.get('mode')
  const safeInitialMode = ['paste', 'file', 'demo'].includes(initialMode) ? initialMode : 'paste'

  const [step, setStep] = useState(1)
  const [mode, setMode] = useState(safeInitialMode)
  const [pasteText, setPasteText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [selectedDemoId, setSelectedDemoId] = useState(DEMO_TEMPLATES[0].id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const selectedDemo = useMemo(
    () => DEMO_TEMPLATES.find((item) => item.id === selectedDemoId),
    [selectedDemoId]
  )

  const pasteStats = useMemo(() => getTextStats(pasteText), [pasteText])
  const demoStats = useMemo(() => getTextStats(selectedDemo?.logs || ''), [selectedDemo?.logs])
  const fileStats = useMemo(() => getTextStats(filePreview), [filePreview])

  const stepCanContinue = {
    1: Boolean(mode),
    2:
      mode === 'paste'
        ? isTextValid(pasteText)
        : mode === 'file'
          ? Boolean(selectedFile)
          : Boolean(selectedDemo?.logs),
    3: true,
  }

  const currentPayload = useMemo(() => {
    if (mode === 'paste') return pasteText
    if (mode === 'demo') return selectedDemo?.logs || ''
    return filePreview
  }, [mode, pasteText, selectedDemo?.logs, filePreview])

  const goNextStep = () => {
    setError('')
    if (!stepCanContinue[step]) {
      setError(getStepValidationMessage(step, mode, pasteText, selectedFile))
      return
    }
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const goPrevStep = () => {
    setError('')
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleFileSelection = async (file) => {
    setError('')
    if (!file) return

    const fileName = file.name.toLowerCase()
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : ''
    const isTextType = file.type.startsWith('text/')

    if (!isTextType && !ACCEPTED_EXTENSIONS.includes(ext)) {
      setSelectedFile(null)
      setFilePreview('')
      setError('Unsupported file type. Please upload .log, .txt, .json or text/*.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null)
      setFilePreview('')
      setError(`File is too large. Max size is ${formatBytes(MAX_FILE_SIZE)}.`)
      return
    }

    setSelectedFile(file)

    try {
      const content = await file.text()
      setFilePreview(getFirstLines(content, 30))
    } catch {
      setFilePreview('')
      setError('Could not read file preview.')
    }
  }

  const onDrop = async (event) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    await handleFileSelection(file)
  }

  const onSubmit = async () => {
    setError('')

    if (!stepCanContinue[2]) {
      setError(getStepValidationMessage(2, mode, pasteText, selectedFile))
      setStep(2)
      return
    }

    setLoading(true)
    try {
      // Backend currently accepts source_type: paste/upload/bundle.
      // UI modes "file" and "demo" are mapped to valid backend source types.
      const sourceType = mode === 'file' ? 'upload' : 'paste'
      const ingestion = await createIngestion(orgId, projectId, { source_type: sourceType })

      if (mode === 'file') {
        try {
          await uploadIngestionLogs(orgId, projectId, ingestion.id, selectedFile)
        } catch (uploadErr) {
          const status = uploadErr?.response?.status
          if (status === 404 || status === 405) {
            // Fallback if upload endpoint is unavailable.
            const fullText = await selectedFile.text()
            await pasteIngestionLogs(orgId, projectId, ingestion.id, fullText)
          } else {
            throw uploadErr
          }
        }
      } else {
        await pasteIngestionLogs(orgId, projectId, ingestion.id, currentPayload)
      }

      setSuccessMessage('Ingestion created. Processing started.')
      setTimeout(() => {
        navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestion.id}`)
      }, 700)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create ingestion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link
          to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
          className="inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          Back to ingestions
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New Ingestion</h1>
        <p className="text-sm text-muted-foreground">
          Choose a source, provide logs, and start processing.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Create Ingestion</CardTitle>
          <CardDescription>Step {step} of 3</CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <StepBadge current={step} index={1} label="Source" />
            <StepBadge current={step} index={2} label="Logs" />
            <StepBadge current={step} index={3} label="Confirm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 1 && (
            <section className="space-y-4">
              <p className="text-sm font-medium">Step 1: Choose source type</p>
              <Tabs value={mode} onValueChange={setMode}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="paste">Paste</TabsTrigger>
                  <TabsTrigger value="file">File</TabsTrigger>
                  <TabsTrigger value="demo">Demo</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                {mode === 'paste' && 'Paste raw logs directly into a text area.'}
                {mode === 'file' && 'Upload a local log file and preview it before submitting.'}
                {mode === 'demo' && 'Use one of the built-in demo log scenarios.'}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <p className="text-sm font-medium">Step 2: Provide logs</p>

              {mode === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    disabled={loading}
                    rows={14}
                    placeholder="Paste logs here..."
                    className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{pasteStats.chars} chars</Badge>
                    <Badge variant="outline">{pasteStats.lines} lines</Badge>
                    <span>Require at least {MIN_LOG_LINES} lines or {MIN_LOG_CHARS} chars.</span>
                  </div>
                </div>
              )}

              {mode === 'file' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
                      dragOver ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm">Drag and drop a file, or pick one</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Accepts .log, .txt, .json and text/*
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".log,.txt,.json,text/*"
                      onChange={(e) => handleFileSelection(e.target.files?.[0])}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      Choose file
                    </Button>
                  </div>

                  {selectedFile && (
                    <div className="rounded-md border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                    </div>
                  )}

                  {selectedFile && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Preview (first 30 lines)
                      </p>
                      <textarea
                        readOnly
                        value={filePreview}
                        rows={10}
                        className="w-full rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs"
                      />
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{fileStats.chars} chars</Badge>
                        <Badge variant="outline">{fileStats.lines} lines</Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === 'demo' && (
                <div className="space-y-3">
                  <label htmlFor="demo-template" className="text-sm font-medium">
                    Demo scenario
                  </label>
                  <select
                    id="demo-template"
                    value={selectedDemoId}
                    onChange={(e) => setSelectedDemoId(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {DEMO_TEMPLATES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <textarea
                    readOnly
                    value={selectedDemo?.logs || ''}
                    rows={12}
                    className="w-full rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{demoStats.chars} chars</Badge>
                    <Badge variant="outline">{demoStats.lines} lines</Badge>
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <p className="text-sm font-medium">Step 3: Confirm + submit</p>
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryItem label="Mode" value={mode} />
                  <SummaryItem
                    label="Source type (API)"
                    value={mode === 'file' ? 'upload' : 'paste'}
                  />
                  <SummaryItem
                    label="Characters"
                    value={String(getTextStats(currentPayload).chars)}
                  />
                  <SummaryItem
                    label="Lines"
                    value={String(getTextStats(currentPayload).lines)}
                  />
                </div>
              </div>

              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
            </section>
          )}

          {error && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={goPrevStep} disabled={step === 1 || loading}>
              Back
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost" disabled={loading}>
                <Link to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}>Cancel</Link>
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={goNextStep} disabled={loading}>
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={onSubmit} disabled={loading}>
                  {loading ? 'Creating ingestion...' : 'Create ingestion'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage('')}
          autoClose={2200}
        />
      )}
    </div>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value || '-'}</p>
    </div>
  )
}

function StepBadge({ current, index, label }) {
  const active = current === index
  const done = current > index
  return (
    <Badge variant={active ? 'default' : 'outline'}>
      {done ? `Done: ${label}` : `${index}. ${label}`}
    </Badge>
  )
}

function getTextStats(text) {
  const value = String(text || '')
  const chars = value.trim().length
  const lines = value.trim() ? value.trim().split(/\r?\n/).length : 0
  return { chars, lines }
}

function isTextValid(text) {
  const stats = getTextStats(text)
  return stats.lines >= MIN_LOG_LINES || stats.chars >= MIN_LOG_CHARS
}

function getStepValidationMessage(step, mode, pasteText, selectedFile) {
  if (step !== 2) return 'Please complete this step.'
  if (mode === 'paste' && !isTextValid(pasteText)) {
    return `Paste logs must include at least ${MIN_LOG_LINES} lines or ${MIN_LOG_CHARS} characters.`
  }
  if (mode === 'file' && !selectedFile) {
    return 'Please upload a file before continuing.'
  }
  return ''
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFirstLines(text, lineCount) {
  return String(text || '').split(/\r?\n/).slice(0, lineCount).join('\n')
}

export default NewIngestionPage
