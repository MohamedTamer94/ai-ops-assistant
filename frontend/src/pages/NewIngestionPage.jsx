import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createIngestion, pasteIngestionLogs, uploadIngestionLogs } from '../lib/api'
import useRequireAuth from '../hooks/useRequireAuth'
import Toast from '../components/Toast'
import { DEMO_DATASETS } from '../data/demoLogs'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_EXTENSIONS = ['.txt', '.log', '.jsonl', '.json']

function NewIngestionPage() {
  const { orgId, projectId } = useParams()
  const navigate = useNavigate()
  useRequireAuth()

  // Mode selection
  const [mode, setMode] = useState('paste') // 'paste', 'upload', 'demo'

  // Paste mode
  const [logsText, setLogsText] = useState('')

  // Upload mode
  const fileInputRef = useRef(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileError, setFileError] = useState('')

  // Demo mode
  const [selectedDemo, setSelectedDemo] = useState(DEMO_DATASETS[0]?.id)
  const [demoPreview, setDemoPreview] = useState(DEMO_DATASETS[0]?.logs)

  // Submission
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError('')
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`)
      setUploadedFile(null)
      return
    }

    // Check file type
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
      setUploadedFile(null)
      return
    }

    // Keep the File object and let backend read it
    setUploadedFile(file)
  }

  // Handle demo selection
  const handleDemoSelect = (demoId) => {
    const dataset = DEMO_DATASETS.find((d) => d.id === demoId)
    if (dataset) {
      setSelectedDemo(demoId)
      setDemoPreview(dataset.logs)
    }
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    let sourceType = mode === 'demo' ? 'paste' : mode;
    let textToSubmit = ''

    if (mode === 'paste') {
      if (!logsText.trim() || logsText.trim().length < 10) {
        setError('Please enter at least 10 characters of logs')
        return
      }
      textToSubmit = logsText
    } else if (mode === 'upload') {
      if (!uploadedFile) {
        setError('Please select and load a file')
        return
      }
      // file will be uploaded to backend after creating ingestion
    } else if (mode === 'demo') {
      if (!demoPreview) {
        setError('Please select a demo dataset')
        return
      }
      textToSubmit = demoPreview
    }

    setLoading(true)
    try {
      // Step 1: Create ingestion
      const ingestion = await createIngestion(orgId, projectId, { source_type: sourceType })

      // Step 2: Send logs to backend (either paste or upload)
      if (mode === 'upload') {
        await uploadIngestionLogs(orgId, projectId, ingestion.id, uploadedFile)
      } else {
        await pasteIngestionLogs(orgId, projectId, ingestion.id, textToSubmit)
      }

      // Step 3: Show success and redirect
      setSuccessMessage('Ingestion created successfully!')
      setTimeout(() => {
        navigate(`/app/orgs/${orgId}/projects/${projectId}/ingestions/${ingestion.id}`)
      }, 1000)
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      if (err.response?.status === 413) {
        setError('File or logs too large. Try a smaller file.')
      } else if (err.response?.status === 401) {
        setError('Please log in again')
      } else if (err.response?.status === 403) {
        setError("You don't have access")
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const getLinesPreview = (text, lines = 30) => {
    return text.split('\n').slice(0, lines).join('\n')
  }

  return (
    <div>
      <div className="mb-4 xs:mb-6">
        <Link
          to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
          className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm"
        >
          ← Back to Ingestions
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 xs:p-6 max-w-2xl">
        <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-6">Create Ingestion</h2>

        {/* Mode selector */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {['paste', 'upload', 'demo'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-medium transition border-b-2 ${
                mode === m
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paste Mode */}
          {mode === 'paste' && (
            <div>
              <label htmlFor="logs" className="block text-xs xs:text-sm font-medium text-gray-700 mb-2">
                Paste Logs
              </label>
              <textarea
                id="logs"
                value={logsText}
                onChange={(e) => setLogsText(e.target.value)}
                disabled={loading}
                placeholder="Paste your logs here (minimum 10 characters)"
                rows="10"
                className="w-full px-3 py-2 text-xs xs:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-mono"
              />
              <p className="text-gray-500 text-xs mt-2">{logsText.length} characters</p>
            </div>
          )}

          {/* Upload Mode */}
          {mode === 'upload' && (
            <div>
              <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-2">
                Upload Log File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  disabled={loading}
                  accept=".txt,.log,.jsonl,.json"
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">✓ File loaded</p>
                    <p className="text-xs text-gray-600">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Drag and drop a file, or click to select
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="inline-block px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Select File
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Allowed: .txt, .log, .json, .jsonl (max 5MB)</p>
                  </div>
                )}
              </div>
              {fileError && (
                <div className="mt-2 p-2 xs:p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {fileError}
                </div>
              )}
            </div>
          )}

          {/* Demo Mode */}
          {mode === 'demo' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="demo-select" className="block text-xs xs:text-sm font-medium text-gray-700 mb-2">
                  Choose Demo Dataset
                </label>
                <select
                  id="demo-select"
                  value={selectedDemo}
                  onChange={(e) => handleDemoSelect(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-xs xs:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  {DEMO_DATASETS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {DEMO_DATASETS.find((d) => d.id === selectedDemo)?.description}
                </p>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-2">
                  Preview (first 30 lines)
                </label>
                <pre className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 overflow-x-auto max-h-64 font-mono whitespace-pre-wrap break-words">
                  {getLinesPreview(demoPreview, 30)}
                </pre>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2 xs:p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs xs:text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-xs xs:text-base transition whitespace-nowrap flex items-center justify-center gap-2"
            >
              {loading && <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{loading ? 'Creating...' : 'Create Ingestion'}</span>
            </button>
            <Link
              to={`/app/orgs/${orgId}/projects/${projectId}/ingestions`}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition text-xs xs:text-base text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {successMessage && (
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} autoClose={2000} />
      )}
    </div>
  )
}

export default NewIngestionPage
