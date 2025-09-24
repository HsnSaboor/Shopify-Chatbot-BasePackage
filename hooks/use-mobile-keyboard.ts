// DEPRECATED: This hook has been replaced by direct VirtualKeyboard API integration in components/chatbot-widget.tsx
// The implementation below is preserved for reference but should not be used.

import { useEffect, useState } from 'react'

export function useMobileKeyboard() {
  // Deprecated - returns default values
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  
  // Implementation commented out - use VirtualKeyboard API instead
  /*
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    // Set initial viewport height using dynamic viewport units for better mobile support
    const updateViewportHeight = () => {
      // Prefer dynamic viewport height (dvh) for modern browsers
      if (window.innerHeight && 'visualViewport' in window) {
        const vh = window.visualViewport?.height || window.innerHeight;
        setViewportHeight(vh);
      } else {
        // Fallback: adjust for safe areas on iOS
        const dh = window.innerHeight * window.devicePixelRatio;
        const safeArea = window.innerHeight - (window.screen.availHeight || window.screen.height);
        setViewportHeight(window.innerHeight - safeArea);
      }
    };
    
    updateViewportHeight();
    
    // For mobile browsers that support the VisualViewport API
    const visualViewport = window.visualViewport
    if (visualViewport) {
      const handleViewportChange = () => {
        const viewportHeight = visualViewport.height || window.innerHeight;
        const screenHeight = window.screen.height;
        
        // Update viewport height state with dynamic adjustment
        setViewportHeight(viewportHeight);
        
        // Improved keyboard detection: use offset from full screen height
        const fullHeight = Math.max(screenHeight, window.innerHeight);
        const heightRatio = viewportHeight / fullHeight;
        const keyboardOpen = heightRatio < 0.75; // Less aggressive threshold
        
        setIsKeyboardOpen(keyboardOpen);
        
        // Calculate keyboard height
        if (keyboardOpen) {
          const kbHeight = fullHeight - viewportHeight;
          setKeyboardHeight(Math.max(0, kbHeight));
        } else {
          setKeyboardHeight(0);
        }
      }
      
      // Initial check
      handleViewportChange()
      
      // Listen for changes
      visualViewport.addEventListener('resize', handleViewportChange);
      visualViewport.addEventListener('scroll', handleViewportChange);
      
      return () => {
        visualViewport.removeEventListener('resize', handleViewportChange);
        visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    } else {
      // Enhanced fallback
      let initialHeight = window.innerHeight;
      
      const handleResize = () => {
        const currentHeight = window.innerHeight;
        updateViewportHeight();
        
        const heightDiff = initialHeight - currentHeight;
        
        if (heightDiff > 150) { // Increased threshold for better accuracy
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDiff);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }
      
      const handleOrientationChange = () => {
        setTimeout(() => {
          initialHeight = window.innerHeight;
          handleResize();
        }, 300); // Reduced delay
      }
      
      // Initial setup
      initialHeight = window.innerHeight;
      handleResize();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('focus', handleResize);
      window.addEventListener('blur', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('focus', handleResize);
        window.removeEventListener('blur', handleResize);
      }
    }
  }, [])
  */
  
  return { isKeyboardOpen, keyboardHeight, viewportHeight }
}