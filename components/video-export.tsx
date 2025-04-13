"use client"
import { Download, Film, Wand2, Scissors } from "lucide-react"
import type React from "react"

import type { ExportSettings } from "@/types/video"
import "../styles/globals.css"
import "../styles/card.css"
import "../styles/button.css"
import "../styles/form.css"

interface VideoExportProps {
  exportSettings: ExportSettings
  onExportSettingsChange: (settings: ExportSettings) => void
  onExport: () => void
  isProcessing: boolean
  processedVideoUrl: string | null
  videoUrl: string
  currentFilter: string
  trimRange: [number, number]
}

export function VideoExport({
  exportSettings,
  onExportSettingsChange,
  onExport,
  isProcessing,
  processedVideoUrl,
  videoUrl,
  currentFilter,
  trimRange,
}: VideoExportProps) {
  const resolutions = [
    { value: "640x360", label: "360p" },
    { value: "854x480", label: "480p" },
    { value: "1280x720", label: "720p" },
    { value: "1920x1080", label: "1080p" },
  ]

  const frameRates = [
    { value: "24", label: "24 fps" },
    { value: "30", label: "30 fps" },
    { value: "60", label: "60 fps" },
  ]

  const formats = [
    { value: "mp4", label: "MP4" },
    { value: "webm", label: "WebM" },
  ]

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onExportSettingsChange({ ...exportSettings, resolution: e.target.value })
  }

  const handleFrameRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onExportSettingsChange({ ...exportSettings, frameRate: Number.parseInt(e.target.value) })
  }

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onExportSettingsChange({ ...exportSettings, format: e.target.value })
  }

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onExportSettingsChange({ ...exportSettings, quality: Number(e.target.value) })
  }

  const handleDownload = () => {
    if (!processedVideoUrl) return

    const a = document.createElement("a")
    a.href = processedVideoUrl
    a.download = `processed-video.${exportSettings.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Format filter name for display
  const formatFilterName = (filter: string) => {
    if (!filter || filter === "none") return "None"
    return filter.charAt(0).toUpperCase() + filter.slice(1)
  }

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Film className="h-5 w-5" style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }} />
          Export Settings
        </h3>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Filter: {formatFilterName(currentFilter)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentFilter && currentFilter !== "none"
                ? "This filter will be applied to the exported video."
                : "No filter will be applied to the exported video."}
            </p>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Trim: {formatTime(trimRange[0])} - {formatTime(trimRange[1])}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              The video will be trimmed to this range during processing.
            </p>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="resolution">
              Resolution
            </label>
            <select
              id="resolution"
              className="select"
              value={exportSettings.resolution}
              onChange={handleResolutionChange}
            >
              {resolutions.map((resolution) => (
                <option key={resolution.value} value={resolution.value}>
                  {resolution.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="framerate">
              Frame Rate
            </label>
            <select
              id="framerate"
              className="select"
              value={exportSettings.frameRate.toString()}
              onChange={handleFrameRateChange}
            >
              {frameRates.map((frameRate) => (
                <option key={frameRate.value} value={frameRate.value}>
                  {frameRate.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="format">
              Format
            </label>
            <select id="format" className="select" value={exportSettings.format} onChange={handleFormatChange}>
              {formats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label className="label" htmlFor="quality">
                Quality
              </label>
              <span style={{ fontSize: "14px" }}>{exportSettings.quality}%</span>
            </div>
            <input
              type="range"
              id="quality"
              className="slider"
              min={10}
              max={100}
              step={1}
              value={exportSettings.quality}
              onChange={handleQualityChange}
            />
          </div>
        </div>

        {processedVideoUrl ? (
          <button
            className="button button-default"
            onClick={handleDownload}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              marginTop: "24px",
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Processed Video
          </button>
        ) : (
          <button
            className="button button-default"
            onClick={onExport}
            disabled={isProcessing}
            style={{
              width: "100%",
              marginTop: "24px",
              opacity: isProcessing ? "0.5" : "1",
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            {isProcessing ? "Processing..." : "Process Video"}
          </button>
        )}

        {processedVideoUrl && (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <p className="text-sm text-muted-foreground">
              Your video has been processed using the selected settings. Click the button above to download it.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
