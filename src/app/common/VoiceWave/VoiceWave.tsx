import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

const VoiceWave = ({ url }: { url: string }) => {
  const waveformRef = useRef(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setisPlaying] = useState(false)
  const [duration, setDuration] = useState('0')

  const togglePlayingVoice = () => {
    setisPlaying(!isPlaying)
    if (!isPlaying) wavesurferRef.current?.play()
    else wavesurferRef.current?.pause()
  }

  const formatDuration = (second: number) => {
    const minutes = Math.floor(second / 60)
    const secs = Math.floor(second % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}` // Đảm bảo có 2 chữ số mm:ss
  }

  useEffect(() => {
    if (!waveformRef.current) return

    const wavesufer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(167, 167, 167, 1)',
      progressColor: 'rgba(89, 89, 89, 1)',
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      height: 40,
      width: 121
    })

    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => {
      setDuration(formatDuration(audio.duration))
    })

    wavesufer.load(url)
    wavesurferRef.current = wavesufer
    return () => {
      wavesufer.destroy()
    }
  }, [url])
  return (
    <div className='flex items-center gap-3 p-2 rounded-3xl'>
      {!isPlaying && (
        <FontAwesomeIcon
          className='cursor-pointer bg-blue-400 p-2 rounded-full'
          onClick={togglePlayingVoice}
          icon={faPlay}
        />
      )}
      {isPlaying && (
        <FontAwesomeIcon
          className='cursor-pointer bg-blue-400 p-2 rounded-full'
          onClick={togglePlayingVoice}
          icon={faPause}
        />
      )}
      <div ref={waveformRef} />
      <p className='ml-[6px] bg-gray-400 rounded-2xl p-1 select-none'>{duration}</p>
    </div>
  )
}

export default VoiceWave
