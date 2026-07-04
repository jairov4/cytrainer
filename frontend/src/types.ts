export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  extension: string
}

export interface ProjectInfo {
  name: string
}

export interface CompileResult {
  generated: string[]
  errors: CompileError[]
}

export interface CompileError {
  file: string
  error: string
}

export interface CompileOptions {
  cplus: boolean
  directives: Record<string, boolean>
}
