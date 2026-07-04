import type { FileEntry, ProjectInfo, CompileResult, CompileOptions } from './types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return data as T
}

export const api = {
  getProject(): Promise<ProjectInfo> {
    return request('/api/project')
  },

  createProject(name: string): Promise<ProjectInfo> {
    return request('/api/project', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  listFiles(): Promise<{ files: FileEntry[] }> {
    return request('/api/files')
  },

  createFile(path: string, content = ''): Promise<FileEntry> {
    return request('/api/files', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    })
  },

  getFile(path: string): Promise<{ content: string }> {
    return request(`/api/files/${encodeURIComponent(path)}`)
  },

  saveFile(path: string, content: string): Promise<{ ok: boolean }> {
    return request(`/api/files/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  },

  deleteFile(path: string): Promise<{ ok: boolean }> {
    return request(`/api/files/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    })
  },

  compile(options: CompileOptions): Promise<CompileResult> {
    return request('/api/compile', {
      method: 'POST',
      body: JSON.stringify(options),
    })
  },
}
