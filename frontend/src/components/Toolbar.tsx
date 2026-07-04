interface ToolbarProps {
  projectName: string
  cplusMode: boolean
  onToggleCplus: () => void
  onNewFile: () => void
  onNewProject: () => void
  onCompile: () => void
  isCompiling: boolean
}

export default function Toolbar({
  projectName,
  cplusMode,
  onToggleCplus,
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
        <label className="cplus-toggle">
          <input
            type="checkbox"
            checked={cplusMode}
            onChange={onToggleCplus}
          />
          <span>C++ mode</span>
        </label>
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
