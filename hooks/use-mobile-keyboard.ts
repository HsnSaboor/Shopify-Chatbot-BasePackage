import { useEffect, useState } from 'react'

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    // Set initial viewport height
    setViewportHeight(window.innerHeight)
    
    // For mobile browsers that support the VisualViewport API
    const visualViewport = window.visualViewport
    if (visualViewport) {
      const handleViewportChange = () => {
        // With interactive-widget=resizes-content, dvh should now properly resize
        const viewportHeight = visualViewport.height
        const screenWidth = visualViewport.width
        const screenHeight = window.screen.height
        
        // Update viewport height state
        setViewportHeight(viewportHeight)
        
        // Calculate if keyboard is likely open based on height difference
        // Using a more conservative threshold since dvh now accounts for keyboard
        const heightRatio = viewportHeight / screenHeight
        const keyboardOpen = heightRatio < 0.65 // More conservative threshold
        
        setIsKeyboardOpen(keyboardOpen)
        
        // Calculate keyboard height more accurately
        if (keyboardOpen) {
          const kbHeight = screenHeight - viewportHeight
          setKeyboardHeight(Math.max(0, kbHeight))
        } else {
          setKeyboardHeight(0)
        }
      }
      
      // Initial check
      handleViewportChange()
      
      // Listen for changes
      visualViewport.addEventListener('resize', handleViewportChange)
      
      return () => {
        visualViewport.removeEventListener('resize', handleViewportChange)
      }
    } else {
      // Fallback for browsers that don't support VisualViewport
      // Use orientation change and focus events
      let initialHeight = window.innerHeight
      
      const handleResize = () => {
        const currentHeight = window.innerHeight
        setViewportHeight(currentHeight)
        
        // Calculate keyboard height based on height difference
        const heightDiff = initialHeight - currentHeight
        
        // If height difference is significant, keyboard is likely open
        if (heightDiff > 100) {
          setIsKeyboardOpen(true)
          setKeyboardHeight(heightDiff)
        } else {
          setIsKeyboardOpen(false)
          setKeyboardHeight(0)
        }
      }
      
      const handleOrientationChange = () => {
        setTimeout(() => {
          initialHeight = window.innerHeight
          handleResize()
        }, 500)
      }
      
      // Initial setup
      initialHeight = window.innerHeight
      handleResize()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleOrientationChange)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleOrientationChange)
      }
    }
  }, [])
  
  return { isKeyboardOpen, keyboardHeight, viewportHeight }
}