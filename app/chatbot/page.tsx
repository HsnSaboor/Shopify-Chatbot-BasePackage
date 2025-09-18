"use client"

import { useState, useEffect } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"

export default function ChatbotPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render the chatbot on the server side to avoid hydration issues
  if (!isClient) {
    return (
      <div className="w-full h-screen bg-transparent p-0 m-0 overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-transparent p-0 m-0 overflow-hidden">
      <ChatbotWidget hideToggle={true} />
    </div>
  )
}