"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Film } from "lucide-react"
import "../styles/globals.css"
import "../styles/card.css"
import "../styles/button.css"

interface VideoUploaderProps {
  onVideoSelected: (file: File) => void
}

export function VideoUploader({ onVideoSelected }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("video/")) {
        simulateUpload(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      simulateUpload(file)
    }
  }

  const simulateUpload = (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 5
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            onVideoSelected(file)
          }, 500)
          return 100
        }
        return newProgress
      })
    }, 100)
  }

  return (
    <div className={`card border-2 border-dashed ${isDragging ? "border-primary" : "border-border"} transition-colors`}>
      <div className="card-content flex flex-col items-center justify-center p-12 text-center">
        <div
          className="w-full h-full flex flex-col items-center justify-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="w-full max-w-md space-y-4">
              <Film className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-medium">Uploading video...</h3>
              <div className="progress">
                <div className="progress-value" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Drag and drop your video here</h3>
              <p className="text-sm text-muted-foreground mb-6">Support for MP4, WebM, MOV, and AVI formats</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="button button-default mt-2">
                Select Video
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
