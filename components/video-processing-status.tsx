"use client"

import { X } from "lucide-react"
import "../styles/globals.css"
import "../styles/card.css"
import "../styles/button.css"

interface VideoProcessingStatusProps {
  isProcessing: boolean
  progress: number
  status?: string
  filter?: string
  onCancel: () => void
}

export function VideoProcessingStatus({
  isProcessing,
  progress,
  status,
  filter,
  onCancel,
}: VideoProcessingStatusProps) {
  if (!isProcessing) return null

  // Update the getStatusMessage function to include filter information
  const getStatusMessage = (progress: number, filter?: string) => {
    if (progress < 20) {
      return "Initializing browser-based processing..."
    } else if (progress < 40) {
      return filter && filter !== "none"
        ? `Applying ${filter} filter and video settings...`
        : "Applying video settings..."
    } else if (progress < 60) {
      return "Processing frames..."
    } else if (progress < 80) {
      return "Encoding video with selected settings..."
    } else if (progress < 100) {
      return "Finalizing video..."
    } else {
      return "Processing complete!"
    }
  }

  return (
    <div className="card">
      <div className="card-content p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">{status || getStatusMessage(progress, filter)}</h3>
          <button className="button button-ghost button-icon" onClick={onCancel}>
            <X className="h-4 w-4" />
            <span className="sr-only">Cancel</span>
          </button>
        </div>
        <div className="progress">
          <div className="progress-value" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {progress < 100 ? `Processing: ${progress.toFixed(0)}% complete` : "Finalizing video..."}
        </p>

        {filter && filter !== "none" && progress < 100 && (
          <p className="text-xs text-muted-foreground mt-1">Using browser-based processing to apply {filter} filter</p>
        )}
      </div>
    </div>
  )
}
