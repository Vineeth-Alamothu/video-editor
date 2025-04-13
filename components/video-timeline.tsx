"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import "../styles/globals.css"
import "../styles/card.css"

interface VideoTimelineProps {
  videoUrl: string
  trimRange: [number, number]
  onTrimChange: (range: [number, number]) => void
}

export function VideoTimeline({ videoUrl, trimRange, onTrimChange }: VideoTimelineProps) {
  const [duration, setDuration] = useState(0)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const leftHandleRef = useRef<HTMLDivElement>(null)
  const rightHandleRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef<"left" | "right" | "clip" | null>(null)
  const startPosRef = useRef(0)
  const startLeftRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      generateThumbnails(video)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [videoUrl])

  useEffect(() => {
    if (!trackRef.current || !clipRef.current || !duration) return

    const trackWidth = trackRef.current.clientWidth
    const leftPos = (trimRange[0] / duration) * trackWidth
    const rightPos = (trimRange[1] / duration) * trackWidth

    clipRef.current.style.left = `${leftPos}px`
    clipRef.current.style.width = `${rightPos - leftPos}px`
  }, [trimRange, duration])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !trackRef.current || !clipRef.current) return

      const trackWidth = trackRef.current.clientWidth
      const deltaX = e.clientX - startPosRef.current

      if (isDraggingRef.current === "left") {
        let newLeft = startLeftRef.current + deltaX
        newLeft = Math.max(0, Math.min(newLeft, startLeftRef.current + startWidthRef.current - 20))

        clipRef.current.style.left = `${newLeft}px`
        clipRef.current.style.width = `${startWidthRef.current - (newLeft - startLeftRef.current)}px`

        const newStartTime = (newLeft / trackWidth) * duration
        onTrimChange([newStartTime, trimRange[1]])
      } else if (isDraggingRef.current === "right") {
        let newWidth = startWidthRef.current + deltaX
        newWidth = Math.max(20, Math.min(newWidth, trackWidth - startLeftRef.current))

        clipRef.current.style.width = `${newWidth}px`

        const newEndTime = ((startLeftRef.current + newWidth) / trackWidth) * duration
        onTrimChange([trimRange[0], newEndTime])
      } else if (isDraggingRef.current === "clip") {
        let newLeft = startLeftRef.current + deltaX
        newLeft = Math.max(0, Math.min(newLeft, trackWidth - startWidthRef.current))

        clipRef.current.style.left = `${newLeft}px`

        const newStartTime = (newLeft / trackWidth) * duration
        const newEndTime = ((newLeft + startWidthRef.current) / trackWidth) * duration
        onTrimChange([newStartTime, newEndTime])
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = null
      document.body.style.cursor = "default"
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [duration, onTrimChange, trimRange])

  const generateThumbnails = async (video: HTMLVideoElement) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 160
    canvas.height = 90

    const thumbnailCount = 10
    const thumbnailsArray: string[] = []

    for (let i = 0; i < thumbnailCount; i++) {
      const time = (video.duration / thumbnailCount) * i
      video.currentTime = time

      await new Promise((resolve) => {
        const handleSeeked = () => {
          video.removeEventListener("seeked", handleSeeked)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          thumbnailsArray.push(canvas.toDataURL("image/jpeg"))
          resolve(null)
        }

        video.addEventListener("seeked", handleSeeked)
      })
    }

    setThumbnails(thumbnailsArray)
  }

  const handleLeftHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!clipRef.current) return

    isDraggingRef.current = "left"
    startPosRef.current = e.clientX
    startLeftRef.current = clipRef.current.offsetLeft
    startWidthRef.current = clipRef.current.offsetWidth
    document.body.style.cursor = "col-resize"
  }

  const handleRightHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!clipRef.current) return

    isDraggingRef.current = "right"
    startPosRef.current = e.clientX
    startLeftRef.current = clipRef.current.offsetLeft
    startWidthRef.current = clipRef.current.offsetWidth
    document.body.style.cursor = "col-resize"
  }

  const handleClipMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!clipRef.current) return

    isDraggingRef.current = "clip"
    startPosRef.current = e.clientX
    startLeftRef.current = clipRef.current.offsetLeft
    startWidthRef.current = clipRef.current.offsetWidth
    document.body.style.cursor = "move"
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="card">
      <div className="card-content p-4">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Start: {formatTime(trimRange[0])}</span>
            <span>End: {formatTime(trimRange[1])}</span>
          </div>

          <div className="relative">
            <div ref={trackRef} className="timeline-track">
              <div className="absolute inset-0 flex">
                {thumbnails.map((thumbnail, index) => (
                  <div
                    key={index}
                    className="h-full flex-1"
                    style={{
                      backgroundImage: `url(${thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ))}
              </div>

              <div ref={clipRef} className="timeline-clip" onMouseDown={handleClipMouseDown}>
                <div
                  ref={leftHandleRef}
                  className="timeline-handle timeline-handle-left"
                  onMouseDown={handleLeftHandleMouseDown}
                />
                <div
                  ref={rightHandleRef}
                  className="timeline-handle timeline-handle-right"
                  onMouseDown={handleRightHandleMouseDown}
                />
              </div>
            </div>
          </div>
        </div>

        <video ref={videoRef} src={videoUrl} className="hidden" preload="metadata" />
      </div>
    </div>
  )
}
