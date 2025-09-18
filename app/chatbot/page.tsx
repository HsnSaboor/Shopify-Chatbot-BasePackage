"use client"

import { Suspense } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { useSearchParams } from "next/navigation"

function ChatbotContent() {
  const searchParams = useSearchParams()

  return (
    <div className="bg-transparent overflow-hidden">
      <ChatbotWidget />
    </div>
  )
}

export default function ChatbotPage() {
  return (
    <Suspense fallback={<div />}>
      <ChatbotContent />
    </Suspense>
  )
}
