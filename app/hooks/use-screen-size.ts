import { useEffect, useState } from 'react'

const SM_BREAKPOINT = 640 // 40rem
const MD_BREAKPOINT = 768 // 48rem
const LG_BREAKPOINT = 1024 // 64rem
const XL_BREAKPOINT = 1280 // 80rem
const XXL_BREAKPOINT = 1536 // 96rem

export const useScreenSize = () => {
  const [breakpoints, setBreakpoints] = useState({
    isXSmallBreakpoint: false,
    isSmallBreakpoint: false,
    isMediumBreakpoint: false,
    isLargeBreakpoint: false,
    isXlBreakpoint: false,
    is2xlBreakpoint: false,
  })

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < SM_BREAKPOINT) {
        setBreakpoints({
          isXSmallBreakpoint: true,
          isSmallBreakpoint: false,
          isMediumBreakpoint: false,
          isLargeBreakpoint: false,
          isXlBreakpoint: false,
          is2xlBreakpoint: false,
        })
      } else if (window.innerWidth >= SM_BREAKPOINT && window.innerWidth < MD_BREAKPOINT) {
        setBreakpoints({
          isXSmallBreakpoint: true,
          isSmallBreakpoint: true,
          isMediumBreakpoint: false,
          isLargeBreakpoint: false,
          isXlBreakpoint: false,
          is2xlBreakpoint: false,
        })
      } else if (window.innerWidth >= MD_BREAKPOINT && window.innerWidth < LG_BREAKPOINT) {
        setBreakpoints({
          isXSmallBreakpoint: true,
          isSmallBreakpoint: true,
          isMediumBreakpoint: true,
          isLargeBreakpoint: false,
          isXlBreakpoint: false,
          is2xlBreakpoint: false,
        })
      } else if (window.innerWidth >= LG_BREAKPOINT && window.innerWidth < XL_BREAKPOINT) {
        setBreakpoints({
          isXSmallBreakpoint: true,
          isSmallBreakpoint: true,
          isMediumBreakpoint: true,
          isLargeBreakpoint: true,
          isXlBreakpoint: false,
          is2xlBreakpoint: false,
        })
      } else if (window.innerWidth >= XL_BREAKPOINT && window.innerWidth < XXL_BREAKPOINT) {
        setBreakpoints({
          isXSmallBreakpoint: true,
          isSmallBreakpoint: true,
          isMediumBreakpoint: true,
          isLargeBreakpoint: true,
          isXlBreakpoint: true,
          is2xlBreakpoint: false,
        })
      } else if (window.innerWidth >= XXL_BREAKPOINT) {
        setBreakpoints({
          isXSmallBreakpoint: true,
          isSmallBreakpoint: true,
          isMediumBreakpoint: true,
          isLargeBreakpoint: true,
          isXlBreakpoint: true,
          is2xlBreakpoint: true,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    ...breakpoints,
  }
}
