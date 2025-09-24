"use client"

import dynamic from 'next/dynamic'
import { ChatbotWidgetProps } from '@/components/chatbot-widget/types'

const DynamicChatbotWidget = dynamic<ChatbotWidgetProps>(
  () => import('@/components/chatbot-widget').then((mod) => mod.ChatbotWidget),
  { ssr: false }
)
import { useSearchParams } from "next/navigation"

export default function ChatbotWidgetPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  if (mode === "direct") {
    return (
      <div className="w-full h-screen p-0 m-0 overflow-hidden bg-transparent">
        <DynamicChatbotWidget hideToggle={true} />
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-transparent p-0 m-0 overflow-hidden">
      <DynamicChatbotWidget hideToggle={true} />
    </div>
  )
}
