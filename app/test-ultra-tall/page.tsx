"use client"

import { ChatbotWidget } from "@/components/chatbot-widget"

export default function TestUltraTallPage() {
  return (
    <div className="w-full h-screen bg-gray-100 p-0 m-0 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
        <h1 className="text-xl font-bold">Ultra-Tall Screen Test</h1>
        <p className="text-sm text-gray-600">Simulating 21:9 aspect ratio mobile device</p>
      </div>
      
      <div className="w-full h-full flex items-center justify-center">
        <div 
          className="bg-white rounded-lg shadow-xl p-8 text-center"
          style={{ 
            width: '300px', 
            height: '800px', 
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <h2 className="text-2xl font-bold mb-4">Testing Chat Widget</h2>
          <p className="text-gray-600 mb-6">This simulates the chat widget on an ultra-tall screen</p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm">Screen dimensions:</p>
            <p className="font-mono text-xs">300px × 800px</p>
            <p className="text-xs text-gray-500">(Simulating 21:9 aspect ratio)</p>
          </div>
          
          <p className="text-sm text-gray-500">
            Check if the chat widget properly fits without overflow
          </p>
        </div>
      </div>
      
      {/* Chat widget will appear as floating button */}
      <ChatbotWidget hideToggle={false} />
    </div>
  )
}