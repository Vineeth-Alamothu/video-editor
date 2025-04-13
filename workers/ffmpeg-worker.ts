self.addEventListener("message", async (e) => {
  try {
    const { videoBlob, options } = e.data
    const id = options.id

    // Send initial progress
    self.postMessage({
      type: "progress",
      progress: 0,
      id,
      status: "Starting video processing...",
    })
    // Simulate processing
    self.postMessage({
      type: "fallback",
      id,
      message: "Using fallback processor for video processing",
    })
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      id: e.data.options.id,
    })
  }
})

// Handle errors
self.addEventListener("error", (event) => {
  console.error("Worker global error:", event)
  self.postMessage({
    type: "error",
    error: event.message || "Unknown worker error",
    id: "unknown",
  })
})

// Handle unhandled rejections
self.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection in worker:", event)
  self.postMessage({
    type: "error",
    error: "Unhandled promise rejection in worker",
    id: "unknown",
  })
})
