import { useEffect, useState } from 'react'

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    // For mobile browsers that support the VisualViewport API
    const visualViewport = window.visualViewport
    if (visualViewport) {
      const handleViewportChange = () => {
        // Calculate if keyboard is likely open based on height difference
        const viewportHeight = visualViewport.height
        const screenHeight = window.screen.height
        const heightRatio = viewportHeight / screenHeight
        
        // Keyboard is likely open if viewport height is significantly reduced
        const keyboardOpen = heightRatio < 0.75
        
        setIsKeyboardOpen(keyboardOpen)
        
        // Calculate keyboard height
        if (keyboardOpen) {
          const kbHeight = screenHeight - viewportHeight
          setKeyboardHeight(kbHeight)
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
      
      const handleOrientationChange = () => {
        setTimeout(() => {
          initialHeight = window.innerHeight
        }, 500)
      }
      
      const handleFocus = () => {
        // When an input is focused, check if height changed significantly
        setTimeout(() => {
          const currentHeight = window.innerHeight
          const heightDiff = initialHeight - currentHeight
          
          // If height difference is significant, keyboard is likely open
          if (heightDiff > 100) {
            setIsKeyboardOpen(true)
            setKeyboardHeight(heightDiff)
          }
        }, 300)
      }
      
      const handleBlur = () => {
        // When input loses focus, keyboard is likely closed
        setIsKeyboardOpen(false)
        setKeyboardHeight(0)
      }
      
      window.addEventListener('orientationchange', handleOrientationChange)
      window.addEventListener('focusin', handleFocus)
      window.addEventListener('focusout', handleBlur)
      
      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange)
        window.removeEventListener('focusin', handleFocus)
        window.removeEventListener('focusout', handleBlur)
      }
    }
  }, [])
  
  return { isKeyboardOpen, keyboardHeight }
}