export interface ExportSettings {
  resolution: string
  frameRate: number
  format: string
  quality: number
}

export interface VideoProcessorOptions {
  filter?: string
  trimStart?: number
  trimEnd?: number
  resolution?: string
  frameRate?: number
  format?: string
  quality?: number
}
