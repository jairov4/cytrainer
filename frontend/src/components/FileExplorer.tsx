import type { FileEntry } from '../types'

interface FileExplorerProps {
  files: FileEntry[]
  selectedFile: string | null
  viewerFile: string | null
  onFileSelect: (path: string) => void
  onFileDelete: (path: string) => void
}

const EXT_ICONS: Record<string, string> = {
  pyx: '▸',
  py: '▸',
  c: '◇',
  cpp: '◇',
  h: '◇',
  hpp: '◇',
}

function fileIcon(ext: string): string {
  return EXT_ICONS[ext] || '·'
}

export default function FileExplorer({
  files,
  selectedFile,
  viewerFile,
  onFileSelect,
  onFileDelete,
}: FileExplorerProps) {
  return (
    <div className="panel explorer-panel">
      <div className="panel-header">Files</div>
      <div className="file-list">
        {files.length === 0 && (
          <div className="file-list-empty">No files yet</div>
        )}
        {files.map((file) => {
          const isSelected = selectedFile === file.path
          const isViewed = viewerFile === file.path
          const isActive = isSelected || isViewed
          return (
            <div
              key={file.path}
              className={
                'file-item' +
                (isActive ? ' file-item--active' : '') +
                (isViewed ? ' file-item--viewed' : '') +
                (isSelected ? ' file-item--selected' : '')
              }
              onClick={() => onFileSelect(file.path)}
            >
              <span className="file-icon">{fileIcon(file.extension)}</span>
              <span className="file-name">{file.name}</span>
              <button
                className="file-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onFileDelete(file.path)
                }}
                title="Delete file"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
