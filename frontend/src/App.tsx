import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from './api'
import type { FileEntry } from './types'
import Toolbar from './components/Toolbar'
import FileExplorer from './components/FileExplorer'
import FileEditor from './components/FileEditor'
import FileViewer from './components/FileViewer'
import HelpModal from './components/HelpModal'
import './App.css'

const DEMO_CONTENT = `# cython: language_level=3
from cython cimport value_type, final, dataclasses, cclass, double


@value_type
@final
@dataclasses.dataclass(frozen=True)
@cclass
class Vec2:
    x: double
    y: double

    def __add__(self, other: Vec2) -> Vec2:
        return Vec2(self.x + other.x, self.y + other.y)

    def dot(self, other: Vec2) -> double:
        return self.x * other.x + self.y * other.y

    @classmethod
    def one(cls) -> Vec2:
        return Vec2(1, 1)


def make_vec(x: double, y: double) -> Vec2:
    return Vec2(x, y)


def summation() -> double:
  return (Vec2(3, 2) + Vec2(4, 1)).dot(Vec2(1,2))
`

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
    infer_noexcept: true,
    python_subclassing: false,
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info')
  const [showHelp, setShowHelp] = useState(false)

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
      return fileData.files.length === 0
    } catch (err: any) {
      setStatusMessage(`Failed to load: ${err.message}`)
      setStatusType('error')
      return false
    }
  }, [])

  useEffect(() => {
    (async () => {
      const isEmpty = await loadProject()
      if (isEmpty) setShowHelp(true)
    })()
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

      if (viewerFile) {
        try {
          const { content } = await api.getFile(viewerFile)
          setViewerContent(content)
        } catch (_) {}
      }

      if (result.errors.length > 0) {
        const first = result.errors[0]
        const lines = (first.error || '').split('\n').filter(Boolean)
        const short = lines.length > 1 ? lines[lines.length - 1] : (lines[0] || '')
        const msg = short ? `${result.generated.length} generated, ${result.errors.length} error(s): ${short}` : `${result.generated.length} generated, ${result.errors.length} error(s)`
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

  const handleDemo = useCallback(async () => {
    setStatusMessage('Creating demo project...')
    setStatusType('info')
    try {
      await api.createProject('Demo')
      setDirectives({ cimport_from_pyx: true, auto_cpdef: true, lto: true, infer_noexcept: true, python_subclassing: false })
      setCplusMode(false)
      setSelectedFile(null)
      setEditorContent('')
      setViewerFile(null)
      setViewerContent('')
      await loadProject()

      await api.createFile('main.pyx', DEMO_CONTENT)
      await loadProject()

      const { content: pyxContent } = await api.getFile('main.pyx')
      setSelectedFile('main.pyx')
      setEditorContent(pyxContent)

      setIsCompiling(true)
      try {
        const result = await api.compile({
          cplus: false,
          directives: { cimport_from_pyx: true, auto_cpdef: true, lto: true, infer_noexcept: true, python_subclassing: false },
        })
        await loadProject()

        const cFile = result.generated.find(f => f.endsWith('.c') || f.endsWith('.cpp'))
        if (cFile) {
          const { content: cContent } = await api.getFile(cFile)
          setViewerFile(cFile)
          setViewerContent(cContent)
        }

        if (result.errors.length > 0) {
          const first = result.errors[0]
          const lines = (first.error || '').split('\n').filter(Boolean)
          const short = lines.length > 1 ? lines[lines.length - 1] : (lines[0] || '')
          setStatusMessage(short || `${result.errors.length} error(s)`)
          setStatusType('error')
        } else {
          setStatusMessage(`Demo compiled — ${result.generated.join(', ')}`)
          setStatusType('success')
        }
      } finally {
        setIsCompiling(false)
      }
    } catch (err: any) {
      setStatusMessage(`Demo failed: ${err.message}`)
      setStatusType('error')
      setIsCompiling(false)
    }
  }, [loadProject])

  const handleHelp = useCallback(() => {
    setShowHelp(true)
  }, [])

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
        onDemo={handleDemo}
        onHelp={handleHelp}
        isCompiling={isCompiling}
      />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

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
