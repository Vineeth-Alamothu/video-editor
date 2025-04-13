import type { VideoProcessorOptions } from "@/types/video"
import { applyCanvasFilter } from "./filters"

// This is a fallback implementation that runs in the main thread
// It's used when web workers with modules aren't supported
export async function processVideoInMainThread(
  videoBlob: Blob,
  options: VideoProcessorOptions = {},
  onProgress: (progress: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const {
        filter = "none",
        trimStart = 0,
        trimEnd,
        resolution = "1280x720",
        frameRate = 30,
        format = "mp4",
        quality = 80,
      } = options

      console.log("Processing video with options:", options)
      onProgress(5) // Start progress

      // Create video element to process
      const video = document.createElement("video")
      video.src = URL.createObjectURL(videoBlob)
      video.muted = true
      video.crossOrigin = "anonymous"
      video.playsInline = true

      video.onloadedmetadata = () => {
        onProgress(10) // Metadata loaded

        // Validate trim values
        const validTrimStart = Math.max(0, Math.min(trimStart || 0, video.duration))
        const validTrimEnd = trimEnd ? Math.min(trimEnd, video.duration) : video.duration

        // Calculate actual duration after trimming
        const trimmedDuration = validTrimEnd - validTrimStart

        if (trimmedDuration <= 0) {
          reject(new Error("Invalid trim range: end time must be greater than start time"))
          return
        }

        console.log(`Trimming video from ${validTrimStart}s to ${validTrimEnd}s (duration: ${trimmedDuration}s)`)

        // Parse resolution
        const [width, height] = resolution.split("x").map(Number)

        // Create canvas for processing
        const canvas = document.createElement("canvas")
        canvas.width = width || video.videoWidth
        canvas.height = height || video.videoHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        onProgress(15) // Canvas setup complete

        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
          reject(new Error("MediaRecorder is not supported in this browser"))
          return
        }

        // Set up video recording with appropriate settings
        let mimeType = "video/webm"
        if (format === "mp4" && MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4"
        } else if (!MediaRecorder.isTypeSupported("video/webm")) {
          reject(new Error("Neither MP4 nor WebM recording is supported in this browser"))
          return
        }

        // Calculate bitrate based on quality
        const bitrate = Math.floor((quality / 100) * 8000000) // Convert to bps

        // Process the video
        const chunks: Blob[] = []
        let recorderOptions = {}

        try {
          recorderOptions = {
            mimeType: mimeType,
            videoBitsPerSecond: bitrate,
          }
        } catch (e) {
          console.warn("Could not set recorder options:", e)
          // Continue with default options
        }

        // Create recorder with specified framerate
        let recorder: MediaRecorder
        try {
          recorder = new MediaRecorder(canvas.captureStream(frameRate), recorderOptions)
        } catch (e) {
          console.error("MediaRecorder creation failed:", e)
          // Try with default options
          try {
            recorder = new MediaRecorder(canvas.captureStream(frameRate))
          } catch (e2) {
            reject(new Error(`Could not create MediaRecorder: ${e2 instanceof Error ? e2.message : String(e2)}`))
            return
          }
        }

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        recorder.onstop = () => {
          onProgress(98) // Almost done
          const outputBlob = new Blob(chunks, { type: mimeType })
          onProgress(100) // Complete

          // Clean up
          URL.revokeObjectURL(video.src)

          resolve(outputBlob)
        }

        recorder.onerror = (event) => {
          console.error("MediaRecorder error:", event)
          reject(new Error("Error recording video"))
        }

        // Set video to start time
        video.currentTime = validTrimStart

        onProgress(20) // Ready to process frames

        // Process each frame
        let frameCount = 0
        const totalFrames = trimmedDuration * frameRate
        let recordingStarted = false
        let processingComplete = false

        // Function to handle seeking completion
        const handleSeeked = () => {
          video.removeEventListener("seeked", handleSeeked)

          console.log(`Video seeked to ${video.currentTime}s, starting playback`)

          // Start recording before playing
          try {
            recorder.start(1000) // Collect data every second
            recordingStarted = true
            console.log("Recording started")
          } catch (e) {
            reject(new Error(`Could not start recording: ${e instanceof Error ? e.message : String(e)}`))
            return
          }

          // Start playing and processing
          video.play().catch((err) => {
            console.error("Error playing video:", err)
            reject(new Error("Could not play video for processing"))
          })
        }

        // Add seeked event listener
        video.addEventListener("seeked", handleSeeked)

        video.onplay = () => {
          onProgress(25) // Started playing
          console.log("Video playback started")

          const processFrame = () => {
            // Check if processing is already complete
            if (processingComplete) return

            // Check if we've reached the end time or video has ended
            if (video.paused || video.ended || video.currentTime >= validTrimEnd) {
              if (recordingStarted && !processingComplete) {
                processingComplete = true
                console.log(`Reached end time (${video.currentTime}s >= ${validTrimEnd}s), stopping recording`)
                try {
                  recorder.stop()
                } catch (e) {
                  console.error("Error stopping recorder:", e)
                  // Try to resolve with what we have
                  const outputBlob = new Blob(chunks, { type: mimeType })
                  onProgress(100)
                  resolve(outputBlob)
                }
              }
              return
            }

            try {
              // Clear the canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height)

              // Draw the current frame
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

              // Apply the filter to each frame
              if (filter && filter !== "none") {
                applyCanvasFilter(ctx, filter, canvas.width, canvas.height)
              }

              // Update progress (from 25% to 95% during frame processing)
              frameCount++
              const progressValue = 25 + Math.min(70, (frameCount / totalFrames) * 70)
              onProgress(progressValue)

              // Process next frame
              requestAnimationFrame(processFrame)
            } catch (err) {
              console.error("Error processing frame:", err)
              // Continue processing despite errors
              requestAnimationFrame(processFrame)
            }
          }

          processFrame()
        }

        // If video is already at the right position, we might not get a 'seeked' event
        if (Math.abs(video.currentTime - validTrimStart) < 0.1) {
          handleSeeked()
        }
      }

      video.onerror = (e) => {
        console.error("Video error:", e)
        reject(new Error("Error loading video"))
      }
    } catch (error) {
      console.error("Processing error:", error)
      reject(error)
    }
  })
}
