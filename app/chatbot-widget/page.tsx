"use client"

import { ChatbotWidget } from "@/components/chatbot-widget"
import { useSearchParams } from "next/navigation"

export default function ChatbotWidgetPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  if (mode === "direct") {
    return <ChatbotWidget />
  }

  return (
    <div className="w-full h-screen bg-transparent">
      <ChatbotWidget />
    </div>
  )
}
