import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { generateInsight } from '../lib/api'
import Toast from './Toast'

function InsightSection({ orgId, projectId, ingestionId, scopeType, scopeId, initialInsight }) {
  const [insight, setInsight] = useState(initialInsight || null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [showError, setShowError] = useState(false)

  const handleGenerateInsight = async () => {
    setGenerating(true)
    setError(null)
    setShowError(false)

    try {
      const data = await generateInsight(orgId, projectId, ingestionId, scopeType, scopeId)
      setInsight(data.insight)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate insight'
      setError(errorMsg)
      setShowError(true)
    } finally {
      setGenerating(false)
    }
  }

  if (!insight && !generating) {
    return (
      <div className="bg-white rounded-lg shadow p-4 xs:p-6 mb-4 xs:mb-6">
        <button
          onClick={handleGenerateInsight}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-xs sm:text-sm font-medium px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg transition"
        >
          <span>✨</span>
          <span>Explain with AI</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 xs:p-6 mb-4 xs:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base xs:text-lg font-semibold text-gray-900">AI Insight</h2>
          <button
            onClick={handleGenerateInsight}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-xs font-medium px-2 xs:px-3 py-1.5 xs:py-2 rounded transition"
          >
            {generating ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Regenerate</span>
              </>
            )}
          </button>
        </div>

        {insight && (
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="mb-3 text-xs xs:text-sm leading-relaxed" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-3 mt-4 text-gray-900" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3 text-gray-900" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-2 mt-2 text-gray-900" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1 text-xs xs:text-sm" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-xs xs:text-sm" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-900" {...props} />
                  ) : (
                    <code className="block bg-gray-100 p-3 rounded mb-3 text-xs font-mono text-gray-900 overflow-x-auto" {...props} />
                  ),
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-300 pl-3 py-1 mb-3 italic text-gray-700 text-xs xs:text-sm" {...props} />,
              }}
            >
              {insight}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {showError && (
        <Toast message={error} type="error" onClose={() => setShowError(false)} autoClose={5000} />
      )}
    </>
  )
}

export default InsightSection
