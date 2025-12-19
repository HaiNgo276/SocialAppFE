import { useState, useEffect } from 'react'

type Breakpoints = {
  mobile: number
  tablet: number
}

type Device = {
  isMobile: boolean
  isTablet: boolean
}

function useDevice(breakpoints: Breakpoints = { mobile: 768, tablet: 1024 }): Device {
  const [device, setDevice] = useState<Device>(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false }
    }

    const width = window.innerWidth

    return {
      isMobile: width <= breakpoints.mobile,
      isTablet: width > breakpoints.mobile && width <= breakpoints.tablet
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const width = window.innerWidth

      setDevice({
        isMobile: width <= breakpoints.mobile,
        isTablet: width > breakpoints.mobile && width <= breakpoints.tablet
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints.mobile, breakpoints.tablet])

  return device
}

export default useDevice
