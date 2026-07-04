import { useEffect, useMemo, useRef, useCallback } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { search, searchKeymap, openSearchPanel } from '@codemirror/search'
import { keymap } from '@codemirror/view'

interface FileViewerProps {
  filename: string | null
  content: string
}

const FUNC_RE = /__pyx_f_\w+|__pyx_p[fw]_\w+/
const STRUCT_RE = /^\s*struct\s+(__pyx_(?:obj|val|vtabstruct)_\w+)\s*{/

interface SymbolEntry {
  name: string
  line: number
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

function isCFamily(filename: string | null) {
  if (!filename) return false
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['c', 'cpp', 'h', 'hpp'].includes(ext || '')
}

function parseFunctions(content: string): SymbolEntry[] {
  const lines = content.split('\n')
  const result: SymbolEntry[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(FUNC_RE)
    if (m && line.includes('(') && line.trimEnd().endsWith('{')) {
      result.push({ name: m[0], line: i + 1 })
    }
  }
  return result
}

function parseStructs(content: string): SymbolEntry[] {
  const lines = content.split('\n')
  const result: SymbolEntry[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(STRUCT_RE)
    if (m) {
      result.push({ name: m[1], line: i + 1 })
    }
  }
  return result
}

export default function FileViewer({ filename, content }: FileViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const functions = useMemo<SymbolEntry[]>(() => {
    if (!content || !isCFamily(filename)) return []
    return parseFunctions(content)
  }, [content, filename])

  const structs = useMemo<SymbolEntry[]>(() => {
    if (!content || !isCFamily(filename)) return []
    return parseStructs(content)
  }, [content, filename])

  const scrollToLine = useCallback((lineNumber: number) => {
    const view = viewRef.current
    if (!view) return
    const line = view.state.doc.line(lineNumber)
    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: 'start' }),
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      doc: content || '',
      extensions: [
        basicSetup,
        search(),
        keymap.of(searchKeymap),
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
        const scroller = view.scrollDOM
        const prevScrollTop = scroller.scrollTop
        view.dispatch({
          changes: { from: 0, to: current.length, insert: content },
        })
        scroller.scrollTop = prevScrollTop
      }
    }
  }, [filename, content])

  const hasPanels = functions.length > 0 || structs.length > 0

  return (
    <div className="panel viewer-panel">
      <div className="panel-header">
        <span>{filename || 'No file selected'}</span>
        <span className="panel-header-actions">
          {filename && (
            <button
              className="panel-btn"
              title="Search (Ctrl+F)"
              onClick={() => viewRef.current && openSearchPanel(viewRef.current)}
            >
              🔍
            </button>
          )}
          {filename && (
            <span className="panel-badge">generated</span>
          )}
        </span>
      </div>
      <div ref={containerRef} className="cm-container" />
      {hasPanels && (
        <div className="symbol-panels">
          {functions.length > 0 && (
            <div className="symbol-panel">
              <div className="symbol-panel-header">
                Functions ({functions.length})
              </div>
              <div className="symbol-panel-list">
                {functions.map((s) => (
                  <button
                    key={s.name}
                    className="symbol-item"
                    onClick={() => scrollToLine(s.line)}
                    title={`Line ${s.line}`}
                  >
                    <span className={`symbol-name${s.name.startsWith('__pyx_f_') ? ' symbol-name--fn' : ''}`}>{s.name}</span>
                    <span className="symbol-line">:{s.line}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {structs.length > 0 && (
            <div className="symbol-panel">
              <div className="symbol-panel-header">
                Structs ({structs.length})
              </div>
              <div className="symbol-panel-list">
                {structs.map((s) => (
                  <button
                    key={s.name}
                    className="symbol-item"
                    onClick={() => scrollToLine(s.line)}
                    title={`Line ${s.line}`}
                  >
                    <span className={`symbol-name${s.name.startsWith('__pyx_val_') ? ' symbol-name--val' : ''}`}>{s.name}</span>
                    <span className="symbol-line">:{s.line}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
