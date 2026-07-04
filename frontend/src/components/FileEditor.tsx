import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { oneDark } from '@codemirror/theme-one-dark'

interface FileEditorProps {
  filename: string | null
  content: string
  onChange: (content: string) => void
}

function getLanguage(filename: string | null) {
  if (!filename) return []
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'py':
    case 'pyx':
      return [python()]
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return [cpp()]
    default:
      return []
  }
}

export default function FileEditor({ filename, content, onChange }: FileEditorProps) {
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
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
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
  }, [filename])

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        {filename || 'No file selected'}
        {filename && (
          <span className="panel-badge">editor</span>
        )}
      </div>
      <div ref={containerRef} className="cm-container" />
    </div>
  )
}
