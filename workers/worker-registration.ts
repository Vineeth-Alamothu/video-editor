export function registerWorker(workerUrl: URL): Worker {
  try {
    return new Worker(workerUrl, {
      type: "module",
    })
  } catch (error) {
    console.error("Failed to register worker:", error)
    throw new Error(`Worker registration failed: ${error}`)
  }
}
