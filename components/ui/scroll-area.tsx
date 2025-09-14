"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  showScrollbar?: boolean
  showScrollToBottom?: boolean
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, showScrollbar = true, showScrollToBottom = false, ...props }, ref) => {
  const [showButton, setShowButton] = React.useState(false)
  const viewportRef = React.useRef<HTMLDivElement>(null)

  const handleScroll = React.useCallback(() => {
    if (!viewportRef.current || !showScrollToBottom) return
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    setShowButton(!isAtBottom)
  }, [showScrollToBottom])

  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth"
      })
      setShowButton(false)
    }
  }

  React.useEffect(() => {
    if (!viewportRef.current || !showScrollToBottom) return
    
    const viewport = viewportRef.current
    viewport.addEventListener("scroll", handleScroll)
    handleScroll() // Initial check
    
    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(handleScroll)
    resizeObserver.observe(viewport)
    
    return () => {
      viewport.removeEventListener("scroll", handleScroll)
      resizeObserver.disconnect()
    }
  }, [handleScroll, showScrollToBottom])

  return (
    <ScrollAreaPrimitive.Root 
      ref={ref} 
      className={cn("relative overflow-hidden", className)} 
      {...props}
    >
      <ScrollAreaPrimitive.Viewport 
        ref={viewportRef}
        className={cn(
          "h-full w-full rounded-[inherit]",
          !showScrollbar && "scrollbar-none"
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {showScrollbar && <ScrollBar />}
      <ScrollAreaPrimitive.Corner />
      
      {showScrollToBottom && showButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 h-8 w-8 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:scale-110"
          aria-label="Scroll to bottom"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="mx-auto"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </ScrollAreaPrimitive.Root>
  )
})
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
