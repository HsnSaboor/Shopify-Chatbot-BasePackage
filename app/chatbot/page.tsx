"use client"

import { Suspense } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { useSearchParams } from "next/navigation"

function ChatbotContent() {
  const searchParams = useSearchParams()
  const embedded = searchParams.get("embedded") === "true"

  return (
    <div className="bg-transparent overflow-hidden h-[100dvh] relative">
      <ChatbotWidget embedded={embedded} />
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
