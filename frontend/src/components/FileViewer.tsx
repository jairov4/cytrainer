import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

interface FileViewerProps {
  filename: string | null
  content: string
}

function getLanguage(filename: string | null) {
  if (!filename) return []
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return [cpp()]
    case 'py':
    case 'pyx':
      return [python()]
    default:
      return []
  }
}

export default function FileViewer({ filename, content }: FileViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      doc: content || '',
      extensions: [
        basicSetup,
        ...getLanguage(filename),
        oneDark,
        EditorView.editable.of(false),
      ],
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [filename])

  useEffect(() => {
    const view = viewRef.current
    if (view && content !== undefined) {
      const current = view.state.doc.toString()
      if (content !== current) {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: content },
        })
      }
    }
  }, [filename, content])

  return (
    <div className="panel viewer-panel">
      <div className="panel-header">
        {filename || 'No file selected'}
        {filename && (
          <span className="panel-badge">generated</span>
        )}
      </div>
      <div ref={containerRef} className="cm-container" />
    </div>
  )
}
