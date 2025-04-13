"use client"

import { useRef, useEffect, useState } from "react"
import { Wand2 } from "lucide-react"
import { applyCanvasFilter } from "@/lib/filters"
import "../styles/globals.css"
import "../styles/card.css"
import "../styles/button.css"

interface VideoEffectsProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  onApplyFilter: () => void
  videoUrl: string
}

export function VideoEffects({ currentFilter, onFilterChange, onApplyFilter, videoUrl }: VideoEffectsProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [filterPreviews, setFilterPreviews] = useState<Record<string, string>>({})

  const filters = [
    { id: "none", name: "Original" },
    { id: "grayscale", name: "Grayscale" },
    { id: "sepia", name: "Sepia" },
    { id: "invert", name: "Invert" },
    { id: "blur", name: "Blur" },
    { id: "brightness", name: "Bright" },
    { id: "contrast", name: "Contrast" },
    { id: "vintage", name: "Vintage" },
    { id: "vignette", name: "Vignette" },
  ]

  useEffect(() => {
    if (!videoUrl) return

    const video = videoRef.current
    if (!video) return

    const generatePreviews = async () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Wait for video metadata to load
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve()
        } else {
          video.onloadeddata = () => resolve()
        }
      })

      // Set canvas dimensions
      canvas.width = 160
      canvas.height = 90

      // Seek to middle of video for preview
      video.currentTime = video.duration / 2

      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve()
      })

      // Generate preview for each filter
      const previews: Record<string, string> = {}

      for (const filter of filters) {
        // Draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Apply filter (except for 'none')
        if (filter.id !== "none") {
          applyCanvasFilter(ctx, filter.id, canvas.width, canvas.height)
        }

        // Convert to data URL
        previews[filter.id] = canvas.toDataURL("image/jpeg")
      }

      setFilterPreviews(previews)
    }

    generatePreviews()
  }, [videoUrl, filters])

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Wand2 className="h-5 w-5" style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }} />
          Video Effects
        </h3>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-3 gap-4">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className={`filter-preview ${currentFilter === filter.id ? "active" : ""}`}
              onClick={() => onFilterChange(filter.id)}
            >
              {filterPreviews[filter.id] ? (
                <img
                  src={filterPreviews[filter.id] || "/placeholder.svg"}
                  alt={filter.name}
                  style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "4px" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "var(--muted)",
                    borderRadius: "4px",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              )}
              <span style={{ fontSize: "0.75rem", fontWeight: "500" }}>{filter.name}</span>
            </div>
          ))}
        </div>

        <button
          className="button button-default"
          onClick={onApplyFilter}
          disabled={currentFilter === "none"}
          style={{ width: "100%", marginTop: "1rem" }}
        >
          Apply Effect
        </button>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Effects are processed using browser-based video processing
        </p>

        <video ref={videoRef} src={videoUrl} className="hidden" preload="metadata" crossOrigin="anonymous" />
      </div>
    </div>
  )
}
