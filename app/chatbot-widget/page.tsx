"use client"

import { ChatbotWidget } from "@/components/chatbot-widget"
import { useSearchParams } from "next/navigation"

export default function ChatbotWidgetPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  if (mode === "direct") {
    return (
      <div className="w-full h-screen p-0 m-0 overflow-hidden bg-transparent">
        <ChatbotWidget hideToggle={true} />
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-transparent p-0 m-0 overflow-hidden">
      <ChatbotWidget hideToggle={true} />
    </div>
  )
}
