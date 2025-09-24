"use client"

import { Suspense, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { ChatbotWidgetProps } from "@/components/chatbot-widget/types"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const DynamicChatbotWidget = dynamic<ChatbotWidgetProps & { embedded?: boolean }>(
  () => import("@/components/chatbot-widget").then((mod) => mod.ChatbotWidget),
  { ssr: false }
)

function ChatbotContent() {
  const searchParams = useSearchParams()

  const embedded = searchParams.get('embedded') === 'true' || (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('embedded') === 'true' || window.self !== window.top));

  const containerClass = cn(
    embedded
      ? "bg-transparent relative h-full w-full overflow-hidden"
      : "relative h-[100dvh]"
  )

  return (
    <div className={containerClass}>
      <DynamicChatbotWidget embedded={embedded} />
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
