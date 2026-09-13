import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * A minimal signature pad: draws on an HTML5 canvas using the Pointer Events API, which
 * covers mouse, touch, and stylus input with one set of handlers (no separate touch
 * fallback needed). Exposes getBlob() (a PNG Blob of the drawing) and isEmpty() to the
 * parent via a ref, so the parent can validate ("did they actually sign?") and read the
 * final image on submit without any prop-mutation tricks.
 */
const SignaturePad = forwardRef(function SignaturePad({ onDrawStateChange }, ref) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const hasDrawnRef = useRef(false)
  const [, forceRender] = useState(0) // re-render just to update the Clear button's disabled state

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    // Fill with paper color so the exported PNG isn't transparent - matters when it's
    // later displayed as a plain <img> against a non-paper background.
    ctx.fillStyle = '#F7F4EC'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#16202E'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasDrawnRef.current,
    getBlob: () =>
      new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => resolve(blob), 'image/png')
      }),
    clear: handleClear,
  }))

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const handlePointerDown = (e) => {
    e.preventDefault()
    drawingRef.current = true
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true
      onDrawStateChange?.(true)
      forceRender((n) => n + 1)
    }
  }

  const stopDrawing = () => {
    drawingRef.current = false
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#F7F4EC'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    hasDrawnRef.current = false
    onDrawStateChange?.(false)
    forceRender((n) => n + 1)
  }

  return (
    <div>
      <div className="stamp-card p-1 bg-paper">
        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          className="w-full touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="eyebrow text-slate">Sign above with mouse, stylus, or finger</p>
        <button type="button" onClick={handleClear} className="eyebrow underline underline-offset-2">
          Clear
        </button>
      </div>
    </div>
  )
})

export default SignaturePad
