import React, { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Modal, Slider, Button } from 'antd'

interface ImageCropModalProps {
  open: boolean
  loading: boolean
  image: string | null
  onClose: () => void
  onCropDone: (croppedImage: string) => void
}

const ImageCropModal = ({ open, loading, image, onClose, onCropDone }: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedPixels(croppedAreaPixels)
  }, [])

  const getCroppedImage = async () => {
    if (!image || !croppedPixels) return null

    const img = new Image()
    img.src = image

    await new Promise((resolve) => (img.onload = resolve))

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    const size = Math.max(croppedPixels.width, croppedPixels.height)
    canvas.width = size
    canvas.height = size

    ctx.drawImage(img, croppedPixels.x, croppedPixels.y, croppedPixels.width, croppedPixels.height, 0, 0, size, size)

    return canvas.toDataURL('image/jpeg')
  }

  const handleSave = async () => {
    const croppedImg = await getCroppedImage()
    if (croppedImg) {
      onCropDone(croppedImg)
    }
  }

  return (
    <Modal title='Crop Image' open={open} onCancel={onClose} footer={null} width={520}>
      <div
        style={{
          position: 'relative',
          height: 400,
          background: '#222'
        }}
      >
        {image && (
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape='round'
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>

      <Slider min={1} max={3} step={0.1} className='mt-4' value={zoom} onChange={setZoom} />

      <Button type='primary' block size='large' className='mt-4' onClick={handleSave} loading={loading}>
        Save
      </Button>
    </Modal>
  )
}

export default ImageCropModal
