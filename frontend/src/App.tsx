import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from './api'
import type { FileEntry } from './types'
import Toolbar from './components/Toolbar'
import FileExplorer from './components/FileExplorer'
import FileEditor from './components/FileEditor'
import FileViewer from './components/FileViewer'
import './App.css'

const SOURCE_EXTS = new Set(['py', 'pyx'])

function isSourceFile(file: FileEntry): boolean {
  return SOURCE_EXTS.has(file.extension)
}

function isGeneratedFile(file: FileEntry): boolean {
  return ['c', 'cpp', 'h', 'hpp'].includes(file.extension)
}

export default function App() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [projectName, setProjectName] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [viewerFile, setViewerFile] = useState<string | null>(null)
  const [viewerContent, setViewerContent] = useState('')
  const [cplusMode, setCplusMode] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [directives, setDirectives] = useState<Record<string, boolean>>({
    cimport_from_pyx: false,
    auto_cpdef: true,
    lto: true,
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info')

  const selectedFileRef = useRef(selectedFile)
  const pendingContentRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  selectedFileRef.current = selectedFile

  const loadProject = useCallback(async () => {
    try {
      const [project, fileData] = await Promise.all([
        api.getProject(),
        api.listFiles(),
      ])
      setProjectName(project.name)
      setFiles(fileData.files)
    } catch (err: any) {
      setStatusMessage(`Failed to load: ${err.message}`)
      setStatusType('error')
    }
  }, [])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const selectFile = useCallback(async (path: string) => {
    const file = files.find((f) => f.path === path)
    if (!file) return

    try {
      const { content } = await api.getFile(path)

      if (isGeneratedFile(file)) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        setViewerFile(path)
        setViewerContent(content)
      } else {
        setSelectedFile(path)
        setEditorContent(content)
        setViewerFile(null)
        setViewerContent('')
      }
    } catch (err: any) {
      setStatusMessage(`Failed to open: ${err.message}`)
      setStatusType('error')
    }
  }, [files])

  const handleEditorChange = useCallback((content: string) => {
    setEditorContent(content)
    pendingContentRef.current = content

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const file = selectedFileRef.current
      const c = pendingContentRef.current
      if (file) {
        try {
          await api.saveFile(file, c)
        } catch (err: any) {
          setStatusMessage(`Save failed: ${err.message}`)
          setStatusType('error')
        }
      }
    }, 600)
  }, [])

  const handleNewFile = useCallback(async () => {
    const name = prompt('Enter file name (e.g., main.pyx):')
    if (!name || !name.trim()) return
    try {
      await api.createFile(name.trim(), '')
      await loadProject()
      setViewerFile(null)
      setViewerContent('')
      selectFile(name.trim())
      setStatusMessage(`Created ${name.trim()}`)
      setStatusType('success')
    } catch (err: any) {
      setStatusMessage(err.message)
      setStatusType('error')
    }
  }, [loadProject, selectFile])

  const handleNewProject = useCallback(async () => {
    const name = prompt('Project name:')
    if (!name || !name.trim()) return
    try {
      await api.createProject(name.trim())
      setSelectedFile(null)
      setEditorContent('')
      setViewerFile(null)
      setViewerContent('')
      await loadProject()
      setStatusMessage(`Project "${name.trim()}" created`)
      setStatusType('success')
    } catch (err: any) {
      setStatusMessage(err.message)
      setStatusType('error')
    }
  }, [loadProject])

  const handleDeleteFile = useCallback(async (path: string) => {
    if (!confirm(`Delete "${path}"?`)) return
    try {
      await api.deleteFile(path)
      if (selectedFile === path) {
        setSelectedFile(null)
        setEditorContent('')
      }
      if (viewerFile === path) {
        setViewerFile(null)
        setViewerContent('')
      }
      await loadProject()
      setStatusMessage(`Deleted ${path}`)
      setStatusType('info')
    } catch (err: any) {
      setStatusMessage(err.message)
      setStatusType('error')
    }
  }, [loadProject, selectedFile, viewerFile])

  const handleCompile = useCallback(async () => {
    setIsCompiling(true)
    setStatusMessage('Compiling...')
    setStatusType('info')
    try {
      const result = await api.compile({ cplus: cplusMode, directives })
      await loadProject()

      if (result.errors.length > 0) {
        const msg = `${result.generated.length} generated, ${result.errors.length} error(s)`
        setStatusMessage(msg)
        setStatusType('error')
        console.error('Compile errors:', result.errors.map((e) => `${e.file}: ${e.error}`).join('\n'))
      } else if (result.generated.length > 0) {
        setStatusMessage(`Generated ${result.generated.length} file(s): ${result.generated.join(', ')}`)
        setStatusType('success')
      } else {
        setStatusMessage('No .py or .pyx files to compile')
        setStatusType('info')
      }
    } catch (err: any) {
      setStatusMessage(`Compilation failed: ${err.message}`)
      setStatusType('error')
    }
    setIsCompiling(false)
  }, [cplusMode, directives, loadProject])

  return (
    <div className="app">
      <Toolbar
        projectName={projectName}
        cplusMode={cplusMode}
        onToggleCplus={() => setCplusMode((v) => !v)}
        directives={directives}
        onDirectiveChange={(name, value) =>
          setDirectives((prev) => ({ ...prev, [name]: value }))
        }
        onNewFile={handleNewFile}
        onNewProject={handleNewProject}
        onCompile={handleCompile}
        isCompiling={isCompiling}
      />

      <div className="main-panels">
        <FileExplorer
          files={files}
          selectedFile={selectedFile}
          viewerFile={viewerFile}
          onFileSelect={selectFile}
          onFileDelete={handleDeleteFile}
        />

        <FileEditor
          filename={selectedFile}
          content={editorContent}
          onChange={handleEditorChange}
        />

        <FileViewer
          filename={viewerFile}
          content={viewerContent}
        />
      </div>

      {statusMessage && (
        <div className={`status-bar status-bar--${statusType}`}>
          <span>{statusMessage}</span>
          <button className="status-close" onClick={() => setStatusMessage('')}>×</button>
        </div>
      )}
    </div>
  )
}
