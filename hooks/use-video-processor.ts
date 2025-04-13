"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { ExportSettings, VideoProcessorOptions } from "@/types/video"
// Import the fallback processor
import { processVideoInMainThread } from "@/lib/video-processor-fallback"

interface VideoProcessorState {
  videoFile: File | null
  videoUrl: string | null
  isProcessing: boolean
  progress: number
  currentFilter: string
  trimRange: [number, number]
  exportSettings: ExportSettings
  processedVideoUrl: string | null
  setVideoFile: (file: File) => void
  setCurrentFilter: (filter: string) => void
  setTrimRange: (range: [number, number]) => void
  setExportSettings: (settings: ExportSettings) => void
  applyFilter: () => void
  processVideo: () => void
  cancelProcessing: () => void
}

export function useVideoProcessor(): VideoProcessorState {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState<string | undefined>(undefined)
  const [currentFilter, setCurrentFilter] = useState("none")
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0])
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null)
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    resolution: "1280x720",
    frameRate: 30,
    format: "mp4",
    quality: 80,
  })

  // Always use the fallback processor to avoid worker issues
  const [useMainThreadProcessing, setUseMainThreadProcessing] = useState(true)
  const processingIdRef = useRef<string | null>(null)
  // Track blob URLs to revoke them properly
  const blobUrlsRef = useRef<string[]>([])

  // Helper function to create and track blob URLs
  const createAndTrackBlobUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob)
    blobUrlsRef.current.push(url)
    return url
  }, [])

  // Helper function to revoke a specific blob URL
  const revokeBlobUrl = useCallback((url: string) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url)
      blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== url)
    }
  }, [])

  // Initialize video URL when file is set
  const handleSetVideoFile = useCallback(
    (file: File) => {
      setVideoFile(file)

      // Revoke previous URL to prevent memory leaks
      if (videoUrl) {
        revokeBlobUrl(videoUrl)
      }

      // Reset processed video URL
      if (processedVideoUrl) {
        revokeBlobUrl(processedVideoUrl)
        setProcessedVideoUrl(null)
      }

      const url = createAndTrackBlobUrl(file)
      setVideoUrl(url)

      // Create a temporary video element to get duration
      const video = document.createElement("video")
      video.muted = true
      video.crossOrigin = "anonymous"

      video.onloadedmetadata = () => {
        setTrimRange([0, video.duration])
      }

      video.onerror = (e) => {
        console.error("Error loading video metadata:", e)
        // Set a default duration if we can't get it from the video
        setTrimRange([0, 30]) // Default to 30 seconds
      }

      video.src = url
    },
    [videoUrl, processedVideoUrl, createAndTrackBlobUrl, revokeBlobUrl],
  )

  // Process video with the main thread processor
  const processWithMainThread = useCallback(
    async (options: VideoProcessorOptions) => {
      if (!videoFile) return

      setIsProcessing(true)
      setProgress(0)

      // Update status to include trim information
      const trimInfo =
        options.trimStart !== undefined && options.trimEnd !== undefined
          ? `Trimming from ${formatTime(options.trimStart)} to ${formatTime(options.trimEnd)}`
          : "Processing full video"

      setProcessingStatus(`Initializing video processing... ${trimInfo}`)

      try {
        console.log("Processing with options:", options)

        // Process video in main thread
        const result = await processVideoInMainThread(videoFile, options, (progress) => {
          setProgress(progress)
          if (progress < 20) {
            setProcessingStatus(`Initializing video processing... ${trimInfo}`)
          } else if (progress < 50) {
            setProcessingStatus(`Processing video frames... ${trimInfo}`)
          } else if (progress < 80) {
            setProcessingStatus(`Encoding video... ${trimInfo}`)
          } else {
            setProcessingStatus(`Finalizing video... ${trimInfo}`)
          }
        })

        // Create URL for the processed video
        if (processedVideoUrl) {
          revokeBlobUrl(processedVideoUrl)
        }
        const url = createAndTrackBlobUrl(result)
        setProcessedVideoUrl(url)
        setProgress(100)
        setProcessingStatus("Processing complete!")
      } catch (error) {
        console.error("Error in main thread processing:", error)
        alert(`Error processing video: ${error.message || "Unknown error"}`)
      } finally {
        setIsProcessing(false)
      }
    },
    [videoFile, processedVideoUrl, revokeBlobUrl, createAndTrackBlobUrl],
  )

  // Process video (this will always use the main thread processor)
  const processVideoWithOptions = useCallback(
    (options: VideoProcessorOptions) => {
      if (!videoFile) return

      setIsProcessing(true)
      setProgress(0)
      setProcessingStatus("Initializing video processing...")

      // Revoke previous processed video URL
      if (processedVideoUrl) {
        revokeBlobUrl(processedVideoUrl)
        setProcessedVideoUrl(null)
      }

      // Generate a unique ID for this processing task
      const id = Date.now().toString()
      processingIdRef.current = id

      // Always use the main thread processor
      processWithMainThread(options)
    },
    [videoFile, processedVideoUrl, revokeBlobUrl, processWithMainThread],
  )

  // Apply filter to video
  const applyFilter = useCallback(() => {
    if (!videoFile || !currentFilter || currentFilter === "none") return

    const options: VideoProcessorOptions = {
      filter: currentFilter,
      trimStart: trimRange[0],
      trimEnd: trimRange[1],
      // Use current resolution and framerate for preview
      resolution: exportSettings.resolution,
      frameRate: exportSettings.frameRate,
      format: exportSettings.format,
      quality: exportSettings.quality,
    }

    processVideoWithOptions(options)
  }, [videoFile, currentFilter, trimRange, exportSettings, processVideoWithOptions])

  // Process video for export
  const processVideo = useCallback(() => {
    if (!videoFile) return

    const options: VideoProcessorOptions = {
      filter: currentFilter,
      trimStart: trimRange[0],
      trimEnd: trimRange[1],
      resolution: exportSettings.resolution,
      frameRate: exportSettings.frameRate,
      format: exportSettings.format,
      quality: exportSettings.quality,
    }

    console.log("Processing video with options:", options)
    processVideoWithOptions(options)
  }, [videoFile, currentFilter, trimRange, exportSettings, processVideoWithOptions])

  // Cancel processing
  const cancelProcessing = useCallback(() => {
    processingIdRef.current = null
    setIsProcessing(false)
    setProgress(0)
    setProcessingStatus(undefined)
  }, [])

  // Clean up resources when component unmounts
  const cleanup = useCallback(() => {
    // Revoke all blob URLs
    blobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url)
      } catch (e) {
        console.error("Error revoking URL:", e)
      }
    })
    blobUrlsRef.current = []
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    videoFile,
    videoUrl,
    isProcessing,
    progress,
    currentFilter,
    trimRange,
    exportSettings,
    processedVideoUrl,
    setVideoFile: handleSetVideoFile,
    setCurrentFilter,
    setTrimRange,
    setExportSettings,
    applyFilter,
    processVideo,
    cancelProcessing,
  }
}

// Helper function to format time for display
function formatTime(time: number): string {
  if (!isFinite(time)) return "00:00"
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
