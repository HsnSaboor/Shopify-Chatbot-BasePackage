"use client"

import { Suspense } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"

export default function ChatbotPage() {
  return (
    <div className="h-screen w-full bg-transparent overflow-hidden">
      <Suspense fallback={<div />}>
        <ChatbotWidget />
      </Suspense>
    </div>
  )
}
