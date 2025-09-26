"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageGalleryProps {
  galleryImages: string[]
  productName: string
  compareAtPrice?: string | null
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

const ChevronLeftIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const MaximizeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
)

const XIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export function ImageGallery({ galleryImages, productName, compareAtPrice, isFullscreen = false, onToggleFullscreen }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullScreenGallery, setIsFullScreenGallery] = useState(false)
  const [fullScreenIndex, setFullScreenIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [mainItemWidth, setMainItemWidth] = useState(0)
  const [thumbItemWidth, setThumbItemWidth] = useState(0)

  const touchRef = useRef({ startX: 0, deltaX: 0 })
  const thumbRef = useRef<HTMLDivElement>(null)
  const mainGalleryRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateThumbWidth = () => {
      if (thumbRef.current && thumbRef.current.children.length > 0) {
        setThumbItemWidth((thumbRef.current.children[0] as HTMLElement)?.offsetWidth || 0)
      }
    }
    updateThumbWidth()
    window.addEventListener('resize', updateThumbWidth)
    return () => window.removeEventListener('resize', updateThumbWidth)
  }, [galleryImages.length])

  useEffect(() => {
    const updateMainWidth = () => {
      if (scrollerRef.current) {
        const firstContainer = scrollerRef.current.querySelector('.flex-shrink-0') as HTMLElement
        setMainItemWidth(firstContainer?.offsetWidth || 0)
      }
    }
    updateMainWidth()
    window.addEventListener('resize', updateMainWidth)
    return () => window.removeEventListener('resize', updateMainWidth)
  }, [galleryImages.length])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    setIsMobile(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Ensure initial index on mount
  useEffect(() => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex(0)
    }
  }, [galleryImages.length])

  const goToPreviousImage = () => {
    const newIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1
    setCurrentImageIndex(newIndex)
    if (scrollerRef.current && mainItemWidth > 0) {
      scrollerRef.current.scrollTo({ left: newIndex * mainItemWidth, behavior: 'smooth' })
    }
    if (thumbRef.current && thumbItemWidth > 0) {
      thumbRef.current.scrollTo({ left: newIndex * thumbItemWidth, behavior: 'smooth' })
    }
  }

  const goToNextImage = () => {
    const newIndex = currentImageIndex === galleryImages.length - 1 ? 0 : currentImageIndex + 1
    setCurrentImageIndex(newIndex)
    if (scrollerRef.current && mainItemWidth > 0) {
      scrollerRef.current.scrollTo({ left: newIndex * mainItemWidth, behavior: 'smooth' })
    }
    if (thumbRef.current && thumbItemWidth > 0) {
      thumbRef.current.scrollTo({ left: newIndex * thumbItemWidth, behavior: 'smooth' })
    }
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
    if (scrollerRef.current && mainItemWidth > 0) {
      scrollerRef.current.scrollTo({ left: index * mainItemWidth, behavior: 'smooth' })
    }
    if (thumbRef.current && thumbItemWidth > 0) {
      thumbRef.current.scrollTo({ left: index * thumbItemWidth, behavior: 'smooth' })
    }
  }

  const goToFullScreenPrevious = () => {
    setFullScreenIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }

  const goToFullScreenNext = () => {
    setFullScreenIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1) return
    touchRef.current.startX = e.touches[0].clientX
    touchRef.current.deltaX = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const currentX = e.touches[0].clientX
    touchRef.current.deltaX = currentX - touchRef.current.startX
    if (Math.abs(touchRef.current.deltaX) > 10 && scrollerRef.current) {
      e.preventDefault()
      scrollerRef.current.scrollLeft -= touchRef.current.deltaX
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const endX = e.changedTouches[0].clientX
    const diff = touchRef.current.startX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextImage()
      } else {
        goToPreviousImage()
      }
    } else if (scrollerRef.current && mainItemWidth > 0) {
      const scrollLeft = scrollerRef.current.scrollLeft
      const index = Math.round(scrollLeft / mainItemWidth)
      const boundedIndex = Math.min(Math.max(index, 0), galleryImages.length - 1)
      scrollerRef.current.scrollTo({ left: boundedIndex * mainItemWidth, behavior: 'smooth' })
      setCurrentImageIndex(boundedIndex)
    }
    touchRef.current.startX = 0
    touchRef.current.deltaX = 0
  }

  const handleFullScreenTouchStart = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1) return
    touchRef.current.startX = e.touches[0].clientX
    touchRef.current.deltaX = 0
  }

  const handleFullScreenTouchMove = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const currentX = e.touches[0].clientX
    touchRef.current.deltaX = currentX - touchRef.current.startX
    if (Math.abs(touchRef.current.deltaX) > 50) {
      e.preventDefault()
    }
  }

  const handleFullScreenTouchEnd = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const endX = e.changedTouches[0].clientX
    const diff = touchRef.current.startX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToFullScreenNext()
      } else {
        goToFullScreenPrevious()
      }
    }
    touchRef.current.startX = 0
    touchRef.current.deltaX = 0
  }

  useEffect(() => {
    if (isFullScreenGallery) {
      modalRef.current?.focus()
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullScreenGallery(false)
        } else if (e.key === 'ArrowLeft') {
          goToFullScreenPrevious()
        } else if (e.key === 'ArrowRight') {
          goToFullScreenNext()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullScreenGallery, fullScreenIndex])

  return (
    <>
      <div
        ref={mainGalleryRef}
        className="relative w-full rounded-lg bg-gray-50 group cursor-pointer h-80 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Scroller wrapper */}
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto md:overflow-hidden snap-x snap-mandatory scrollbar-hide h-full"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex h-fit w-full md:w-max">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-[400px] h-80 snap-center flex items-center justify-center relative rounded-lg border border-gray-200 overflow-hidden"
                onClick={(e) => {
                  if (isMobile && !(e.target as Element)?.closest('button')) {
                    setIsFullScreenGallery(true)
                    setFullScreenIndex(index)
                  }
                }}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${productName} ${index + 1}`}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                />
                {compareAtPrice && index === 0 && <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs z-10">Sale</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* Fixed overlays for counter and gallery fullscreen button - does not slide with swipe */}
        {galleryImages.length > 1 && (
          <div className="absolute inset-0 z-20 flex justify-between items-end pb-2 px-2 pointer-events-none">
            {/* Image counter - fixed position, updates with index */}
            <Badge
              variant="secondary"
              className="bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full pointer-events-auto"
            >
              {currentImageIndex + 1} / {galleryImages.length}
            </Badge>

            {/* Gallery fullscreen button - overlaid on top */}
            {!isFullScreenGallery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFullScreenGallery(true)
                  setFullScreenIndex(currentImageIndex)
                }}
                className="h-8 w-8 p-0 bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white opacity-50 hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-auto"
                aria-label="Enter fullscreen gallery"
                title="Open fullscreen gallery"
              >
                <MaximizeIcon />
              </Button>
            )}
          </div>
        )}

        {/* Navigation arrows - only show if more than one image */}
        {galleryImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousImage}
              className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextImage}
              className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <ChevronRightIcon />
            </Button>
          </>
        )}

      </div>

      {/* Thumbnail navigation - only show if more than one image */}
      {galleryImages.length > 1 && (
        <div
          ref={thumbRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide h-fit"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onScroll={(e) => {
            e.currentTarget.style.setProperty('webkit-overflow-scrolling', 'touch')
          }}
        >
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200",
                currentImageIndex === index
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${productName} ${index + 1}`}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen mobile gallery modal */}
      {isFullScreenGallery && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image gallery`}
          onClick={() => setIsFullScreenGallery(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsFullScreenGallery(false)
            }
          }}
          tabIndex={-1}
        >
          <div
            ref={modalRef}
            className="relative w-full h-fit max-h-[90vh] max-w-6xl flex items-center justify-center p-4"
            onClick={(e) => {
              const target = e.target as Element
              if (target === e.currentTarget || (!(target as Element)?.closest('button') && target.tagName !== 'IMG')) {
                setIsFullScreenGallery(false)
              }
            }}
            onTouchStart={handleFullScreenTouchStart}
            onTouchMove={handleFullScreenTouchMove}
            onTouchEnd={handleFullScreenTouchEnd}
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                setIsFullScreenGallery(false)
              }}
            >
              <XIcon />
            </Button>

            <div className="flex items-center justify-center h-fit max-h-[90vh] rounded-lg overflow-hidden">
              <Image
                src={galleryImages[fullScreenIndex] || "/placeholder.svg"}
                alt={`${productName} full screen ${fullScreenIndex + 1}`}
                width={1200}
                height={1200}
                className="block max-w-full max-h-[85vh] object-cover mx-auto rounded-lg"
                sizes="90vw"
              />
            </div>

            {galleryImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToFullScreenPrevious()
                  }}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-white/20 hover:bg-white/30 text-white z-10"
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToFullScreenNext()
                  }}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-white/20 hover:bg-white/30 text-white z-10"
                >
                  <ChevronRightIcon />
                </Button>
              </>
            )}

            {galleryImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full z-20 sm:bottom-10 sm:px-4 sm:py-1.5 sm:text-base">
                {fullScreenIndex + 1} / {galleryImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}