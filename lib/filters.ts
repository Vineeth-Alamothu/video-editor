export function applyCanvasFilter(ctx: CanvasRenderingContext2D, filter: string, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  switch (filter) {
    case "grayscale":
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg
        data[i + 1] = avg
        data[i + 2] = avg
      }
      break

    case "sepia":
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
      }
      break

    case "invert":
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]
        data[i + 1] = 255 - data[i + 1]
        data[i + 2] = 255 - data[i + 2]
      }
      break

    case "blur":
      ctx.putImageData(imageData, 0, 0)
      ctx.filter = "blur(5px)"
      ctx.drawImage(ctx.canvas, 0, 0)
      ctx.filter = "none"
      return

    case "brightness":
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3)
        data[i + 1] = Math.min(255, data[i + 1] * 1.3)
        data[i + 2] = Math.min(255, data[i + 2] * 1.3)
      }
      break

    case "contrast":
      const factor = 1.5
      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128
        data[i + 1] = factor * (data[i + 1] - 128) + 128
        data[i + 2] = factor * (data[i + 2] - 128) + 128
      }
      break

    case "vintage":
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        data[i] = Math.min(255, r * 0.9 + g * 0.05 + b * 0.05)
        data[i + 1] = Math.min(255, r * 0.07 + g * 0.8 + b * 0.05)
        data[i + 2] = Math.min(255, r * 0.05 + g * 0.1 + b * 0.9)
      }
      break

    case "vignette":
      ctx.putImageData(imageData, 0, 0)

      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.sqrt(width * width + height * height) / 2,
      )

      gradient.addColorStop(0, "rgba(0,0,0,0)")
      gradient.addColorStop(0.5, "rgba(0,0,0,0)")
      gradient.addColorStop(1, "rgba(0,0,0,0.7)")

      ctx.fillStyle = gradient
      ctx.globalCompositeOperation = "multiply"
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = "source-over"
      return
  }

  ctx.putImageData(imageData, 0, 0)
}
