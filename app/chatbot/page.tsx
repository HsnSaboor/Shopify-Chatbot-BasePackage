"use client"

import { Suspense } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { useSearchParams } from "next/navigation"

function ChatbotContent() {
  const searchParams = useSearchParams()
  const hideToggle = searchParams.get("hideToggle") === "true"

  return (
    <div className="h-screen w-full bg-transparent overflow-hidden">
      <ChatbotWidget hideToggle={hideToggle} />
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
