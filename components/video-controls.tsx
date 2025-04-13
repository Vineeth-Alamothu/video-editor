"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Scissors, Clock } from "lucide-react"
import "../styles/globals.css"
import "../styles/card.css"
import "../styles/button.css"
import "../styles/form.css"

interface VideoControlsProps {
  videoUrl: string
  trimRange: [number, number]
  onTrimChange: (range: [number, number]) => void
}

export function VideoControls({ videoUrl, trimRange, onTrimChange }: VideoControlsProps) {
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(trimRange[0])
  const [endTime, setEndTime] = useState(trimRange[1])
  const [videoSpeed, setVideoSpeed] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const video = document.createElement("video")
    video.src = videoUrl

    video.onloadedmetadata = () => {
      setDuration(video.duration)
      setStartTime(trimRange[0])
      setEndTime(trimRange[1])
    }
  }, [videoUrl, trimRange])

  useEffect(() => {
    setStartTime(trimRange[0])
    setEndTime(trimRange[1])
  }, [trimRange])

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = Number.parseFloat(e.target.value)
    if (newStart < endTime) {
      setStartTime(newStart)
      onTrimChange([newStart, endTime])
    }
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = Number.parseFloat(e.target.value)
    if (newEnd > startTime) {
      setEndTime(newEnd)
      onTrimChange([startTime, newEnd])
    }
  }

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = Number.parseFloat(e.target.value)
    if (!isNaN(newStart) && newStart >= 0 && newStart < endTime) {
      setStartTime(newStart)
      onTrimChange([newStart, endTime])
    }
  }

  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = Number.parseFloat(e.target.value)
    if (!isNaN(newEnd) && newEnd > startTime && newEnd <= duration) {
      setEndTime(newEnd)
      onTrimChange([startTime, newEnd])
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Scissors
            className="h-5 w-5"
            style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }}
          />
          Video Trimming
        </h3>
      </div>
      <div className="card-content space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="start-time">
              Start Time: {formatTime(startTime)}
            </label>
            <input
              id="start-time-input"
              className="input"
              type="number"
              min={0}
              max={endTime}
              step={0.1}
              value={startTime.toFixed(1)}
              onChange={handleStartInputChange}
              style={{ width: "80px" }}
            />
          </div>
          <input
            id="start-time"
            className="slider"
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={startTime}
            onChange={handleStartTimeChange}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="end-time">
              End Time: {formatTime(endTime)}
            </label>
            <input
              id="end-time-input"
              className="input"
              type="number"
              min={startTime}
              max={duration}
              step={0.1}
              value={endTime.toFixed(1)}
              onChange={handleEndInputChange}
              style={{ width: "80px" }}
            />
          </div>
          <input
            id="end-time"
            className="slider"
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={endTime}
            onChange={handleEndTimeChange}
          />
        </div>

        <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <h3 className="card-title" style={{ marginBottom: "1rem" }}>
            <Clock
              className="h-5 w-5"
              style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }}
            />
            Playback Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="video-speed">
                Playback Speed
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    className={`button ${videoSpeed === speed ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setVideoSpeed(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="switch">
                <input type="checkbox" checked={isMuted} onChange={(e) => setIsMuted(e.target.checked)} />
                <span className="switch-slider"></span>
              </label>
              <label className="label" htmlFor="mute-video" style={{ marginBottom: 0 }}>
                Mute Audio
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
