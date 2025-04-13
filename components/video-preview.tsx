"use client"

import { useRef, useEffect, useState } from "react"
import { Maximize2, Minimize2, Play, Pause, RotateCcw, AlertCircle, RefreshCw } from "lucide-react"
import { applyCanvasFilter } from "@/lib/filters"
import "../styles/globals.css"
import "../styles/card.css"
import "../styles/button.css"

interface VideoPreviewProps {
  videoUrl: string
  currentFilter: string
  trimRange: [number, number]
  processedVideoUrl: string | null
}

export function VideoPreview({ videoUrl, currentFilter, trimRange, processedVideoUrl }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const displayUrl = processedVideoUrl || videoUrl

  // Function to retry loading the video
  const retryLoading = () => {
    setLoadError(null)
    setRetryCount((prev) => prev + 1)
  }

  // Create a placeholder image if we can't load the video
  const createPlaceholder = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match container
    canvas.width = canvas.clientWidth || 640
    canvas.height = canvas.clientHeight || 360

    ctx.fillStyle = "#1e293b" // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#3b82f6" // Primary color
    ctx.font = `${Math.max(16, canvas.width / 20)}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Video Preview Unavailable", canvas.width / 2, canvas.height / 2)

    // Draw filter info if applicable
    if (currentFilter && currentFilter !== "none") {
      ctx.font = `${Math.max(14, canvas.width / 30)}px sans-serif`
      ctx.fillText(`Filter: ${currentFilter}`, canvas.width / 2, canvas.height / 2 + 40)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Reset error state when video URL changes
    setLoadError(null)

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      // Loop within trim range with safety checks
      try {
        if (isFinite(trimRange[0]) && isFinite(trimRange[1]) && video.currentTime < trimRange[0]) {
          video.currentTime = trimRange[0]
        } else if (isFinite(trimRange[1]) && video.currentTime > trimRange[1]) {
          // Make sure trimRange[0] is valid before setting
          if (isFinite(trimRange[0])) {
            video.currentTime = trimRange[0]
          }
        }
      } catch (error) {
        console.error("Error adjusting video time:", error)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setLoadError(null)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleError = (e: Event) => {
      // Provide more detailed error information
      const videoElement = e.target as HTMLVideoElement
      let errorMessage = "Unknown video error"

      if (videoElement.error) {
        switch (videoElement.error.code) {
          case 1:
            errorMessage = "Video loading aborted"
            break
          case 2:
            errorMessage = "Network error while loading video"
            break
          case 3:
            errorMessage = "Video decoding failed"
            break
          case 4:
            errorMessage = "Video not supported"
            break
          default:
            errorMessage = `Video error: ${videoElement.error.message || "unknown"}`
        }
      }

      console.error("Video error:", errorMessage, videoElement.error)
      setLoadError(errorMessage)
      setIsPlaying(false)

      // Create a placeholder when video fails to load
      createPlaceholder()
    }

    // Try to load the video with a timeout
    let timeoutId: NodeJS.Timeout
    const loadWithTimeout = () => {
      timeoutId = setTimeout(() => {
        if (video.readyState === 0) {
          setLoadError("Video loading timed out")
          createPlaceholder()
        }
      }, 10000) // 10 second timeout
    }

    loadWithTimeout()

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      clearTimeout(timeoutId)
    }
  }, [trimRange, displayUrl, retryCount, currentFilter])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !currentFilter || currentFilter === "none" || loadError) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const renderFrame = () => {
      if (video.paused || video.ended) return

      try {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360

        // Draw the original video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Apply the selected filter
        applyCanvasFilter(ctx, currentFilter, canvas.width, canvas.height)

        animationRef.current = requestAnimationFrame(renderFrame)
      } catch (error) {
        console.error("Error rendering frame:", error)
        cancelAnimationFrame(animationRef.current)
      }
    }

    const handleCanPlay = () => {
      if (!video.paused) {
        renderFrame()
      }
    }

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("play", renderFrame)

    if (!video.paused && video.readyState >= 3) {
      renderFrame()
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("play", renderFrame)
      cancelAnimationFrame(animationRef.current)
    }
  }, [currentFilter, loadError])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().catch((error) => {
        console.error("Error playing video:", error)
        setLoadError("Failed to play video: " + error.message)
      })
    } else {
      video.pause()
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true)
        })
        .catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const resetVideo = () => {
    const video = videoRef.current
    if (!video) return

    try {
      // Only set if trimRange[0] is valid
      if (isFinite(trimRange[0])) {
        video.currentTime = trimRange[0]
        if (isPlaying) {
          video.play().catch((error) => {
            console.error("Error playing video after reset:", error)
          })
        }
      }
    } catch (error) {
      console.error("Error resetting video:", error)
    }
  }

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="card">
      <div className="card-content p-0 relative">
        <div ref={containerRef} className="canvas-container">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full bg-black/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-center text-destructive mb-4">{loadError}</p>
              <button
                onClick={retryLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                <RefreshCw size={16} /> Retry Loading
              </button>
              {currentFilter !== "none" && (
                <canvas ref={canvasRef} className="w-full h-full object-contain absolute top-0 left-0 z-0" />
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={displayUrl}
                className={currentFilter !== "none" ? "hidden" : "w-full h-full object-contain"}
                controls={false}
                crossOrigin="anonymous"
                playsInline
                muted
              />
              {currentFilter !== "none" && <canvas ref={canvasRef} className="w-full h-full object-contain" />}
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <button
                  className="button button-ghost button-icon text-white"
                  onClick={togglePlay}
                  disabled={!!loadError}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button
                  className="button button-ghost button-icon text-white"
                  onClick={resetVideo}
                  disabled={!!loadError}
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <button
                className="button button-ghost button-icon text-white"
                onClick={toggleFullscreen}
                disabled={!!loadError}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
