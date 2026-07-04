interface ToolbarProps {
  projectName: string
  cplusMode: boolean
  onToggleCplus: () => void
  directives: Record<string, boolean>
  onDirectiveChange: (name: string, value: boolean) => void
  onNewFile: () => void
  onNewProject: () => void
  onCompile: () => void
  isCompiling: boolean
}

const DIRECTIVES = [
  { key: 'cimport_from_pyx', label: 'cimport_from_pyx' },
  { key: 'auto_cpdef', label: 'auto_cpdef' },
  { key: 'lto', label: 'lto' },
  { key: 'infer_noexcept', label: 'infer_noexcept' },
  { key: 'python_subclassing', label: 'python_subclassing' },
] as const

export default function Toolbar({
  projectName,
  cplusMode,
  onToggleCplus,
  directives,
  onDirectiveChange,
  onNewFile,
  onNewProject,
  onCompile,
  isCompiling,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">CYTrainer</span>
        <span className="toolbar-sep">|</span>
        <span className="project-name">{projectName}</span>
      </div>
      <div className="toolbar-center">
        <button className="btn" onClick={onNewFile}>
          + New File
        </button>
        <button className="btn" onClick={onNewProject}>
          + New Project
        </button>
        <label className="toggle">
          <input
            type="checkbox"
            checked={cplusMode}
            onChange={onToggleCplus}
          />
          <span>C++</span>
        </label>
        <span className="toolbar-sep">|</span>
        {DIRECTIVES.map(({ key, label }) => (
          <label key={key} className="toggle toggle--directive">
            <input
              type="checkbox"
              checked={directives[key]}
              onChange={(e) => onDirectiveChange(key, e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <div className="toolbar-right">
        <button
          className="btn btn-compile"
          onClick={onCompile}
          disabled={isCompiling}
        >
          {isCompiling ? 'Compiling...' : 'Compile'}
        </button>
      </div>
    </div>
  )
}
