"use client"
import { VideoUploader } from "./video-uploader"
import { VideoPreview } from "./video-preview"
import { VideoControls } from "./video-controls"
import { VideoTimeline } from "./video-timeline"
import { VideoEffects } from "./video-effects"
import { VideoExport } from "./video-export"
import { VideoProcessingStatus } from "./video-processing-status"
import { useVideoProcessor } from "@/hooks/use-video-processor"
import { Layers } from "lucide-react"
import { useEffect, useState } from "react"

import "../styles/globals.css"
import "../styles/card.css"
import "../styles/button.css"
import "../styles/tabs.css"
import "../styles/separator.css"

export function VideoEditor() {
  const {
    videoFile,
    videoUrl,
    isProcessing,
    progress,
    currentFilter,
    trimRange,
    exportSettings,
    processedVideoUrl,
    setVideoFile,
    setCurrentFilter,
    setTrimRange,
    setExportSettings,
    applyFilter,
    processVideo,
    cancelProcessing,
  } = useVideoProcessor()

  const [activeTab, setActiveTab] = useState("effects")

  // Add error handling for worker initialization
  useEffect(() => {
    window.addEventListener("error", (e) => {
      if (e.message.includes("Cannot use import statement outside a module")) {
        console.error("Worker initialization error:", e.message)
        alert("There was an error initializing the video processor. Please check the console for details.")
      }
    })
  }, [])

  return (
    <div className="container py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">VideoForge</h1>
        </div>
      </header>

      <div className="separator"></div>

      {!videoUrl ? (
        <VideoUploader onVideoSelected={setVideoFile} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <VideoPreview
              videoUrl={videoUrl}
              currentFilter={currentFilter}
              trimRange={trimRange}
              processedVideoUrl={processedVideoUrl}
            />

            <VideoTimeline videoUrl={videoUrl} trimRange={trimRange} onTrimChange={setTrimRange} />

            <VideoProcessingStatus
              isProcessing={isProcessing}
              progress={progress}
              filter={currentFilter}
              onCancel={cancelProcessing}
            />
          </div>

          <div className="space-y-6">
            <div className="tabs">
              <div className="tabs-list">
                <button
                  className="tabs-trigger"
                  data-state={activeTab === "effects" ? "active" : "inactive"}
                  onClick={() => setActiveTab("effects")}
                >
                  Effects
                </button>
                <button
                  className="tabs-trigger"
                  data-state={activeTab === "settings" ? "active" : "inactive"}
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>
                <button
                  className="tabs-trigger"
                  data-state={activeTab === "export" ? "active" : "inactive"}
                  onClick={() => setActiveTab("export")}
                >
                  Export
                </button>
              </div>

              <div className="tabs-content" data-state={activeTab === "effects" ? "active" : "inactive"}>
                <VideoEffects
                  currentFilter={currentFilter}
                  onFilterChange={setCurrentFilter}
                  onApplyFilter={applyFilter}
                  videoUrl={videoUrl}
                />
              </div>

              <div className="tabs-content" data-state={activeTab === "settings" ? "active" : "inactive"}>
                <VideoControls videoUrl={videoUrl} trimRange={trimRange} onTrimChange={setTrimRange} />
              </div>

              <div className="tabs-content" data-state={activeTab === "export" ? "active" : "inactive"}>
                <VideoExport
                  exportSettings={exportSettings}
                  onExportSettingsChange={setExportSettings}
                  onExport={processVideo}
                  isProcessing={isProcessing}
                  processedVideoUrl={processedVideoUrl}
                  videoUrl={videoUrl}
                  currentFilter={currentFilter}
                  trimRange={trimRange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
