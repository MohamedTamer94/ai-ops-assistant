import { useEffect } from 'react'

function Toast({ message, type = 'error', onClose, autoClose = 5000 }) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'

  return (
    <div className={`fixed bottom-4 right-4 p-4 border rounded-lg ${bgColor} max-w-sm z-50 animate-fade-in`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

export default Toast
