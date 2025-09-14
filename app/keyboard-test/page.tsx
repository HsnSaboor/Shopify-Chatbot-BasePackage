"use client"

import { useState, useEffect } from 'react'

export default function KeyboardTest() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return
    }
    
    const visualViewport = window.visualViewport
    
    const handleViewportChange = () => {
      const viewportHeight = visualViewport.height
      const screenHeight = window.screen.height
      const heightRatio = viewportHeight / screenHeight
      
      const keyboardOpen = heightRatio < 0.75
      
      setIsKeyboardOpen(keyboardOpen)
      
      if (keyboardOpen) {
        const kbHeight = screenHeight - viewportHeight
        setKeyboardHeight(kbHeight)
      } else {
        setKeyboardHeight(0)
      }
    }
    
    handleViewportChange()
    visualViewport.addEventListener('resize', handleViewportChange)
    
    return () => {
      visualViewport.removeEventListener('resize', handleViewportChange)
    }
  }, [])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Keyboard Detection Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4">
          <p className="text-lg">
            Keyboard Status: <span className={`font-bold ${isKeyboardOpen ? 'text-red-500' : 'text-green-500'}`}>
              {isKeyboardOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </p>
          <p className="text-lg">Keyboard Height: <span className="font-bold">{keyboardHeight}px</span></p>
        </div>
        
        <input
          type="text"
          placeholder="Tap here to test keyboard detection"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <textarea
          placeholder="Or tap here for textarea test"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4 h-24"
        />
      </div>
      
      <div className="mt-8 text-center text-gray-600">
        <p>Focus on the input fields above to test keyboard detection.</p>
        <p>Works best on mobile devices or mobile simulators.</p>
      </div>
    </div>
  )
}