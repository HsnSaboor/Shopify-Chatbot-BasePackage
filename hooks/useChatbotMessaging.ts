"use client"

import { useEffect } from "react"
import type { Message } from "@/components/chatbot-widget/types"
import { ChatStateService } from "@/lib/chat-state"

interface UseChatbotMessagingProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]
  isPreview: boolean
  hideToggle: boolean
  isMobile: boolean
  isFullscreen: boolean
  clearChatHistory: () => void
}

export function useChatbotMessaging({
  isOpen,
  setIsOpen,
  messages,
  isPreview,
  hideToggle,
  isMobile,
  isFullscreen,
  clearChatHistory,
}: UseChatbotMessagingProps) {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data

      switch (type) {
        case "REOPEN_CHATBOT":
        case "OPEN_CHATBOT":
        case "OPEN_CHAT":
          setIsOpen(true)
          break

        case "CLOSE_CHATBOT":
        case "CLOSE_CHAT":
          setIsOpen(false)
          break
          
        case "TOGGLE_CHAT":
          setIsOpen(!isOpen)
          break

        case "CLEAR_HISTORY":
          clearChatHistory()
          break
          
        case "EXTERNAL_CONTROL_ACTIVE":
          // External script is managing the iframe - this is normal
          console.log('External control active for chatbot iframe')
          break
      }
    }

    window.addEventListener("message", handleMessage)

    // Notify parent that chatbot is ready
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CHATBOT_READY",
          timestamp: Date.now(),
        },
        "*",
      )
    }

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [isPreview, setIsOpen, clearChatHistory])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CHATBOT_STATE_CHANGED",
          data: { isOpen, messageCount: messages.length },
        },
        "*",
      )
    }
  }, [isOpen, messages.length, isPreview])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    if (window.parent !== window) {
      let height = isOpen || hideToggle ? "100dvh" : "70px";
      let width = isOpen || hideToggle ? (isMobile ? "100vw" : "500px") : "70px";
      
      if (isFullscreen && !isMobile && (isOpen || hideToggle)) {
        width = "100vw";
        height = "100vh";
      }
      
      window.parent.postMessage(
        {
          type: "CHATBOT_RESIZE",
          data: {
            isOpen: isOpen || hideToggle,
            isFullscreen: isFullscreen && !isMobile,
            width,
            height,
          },
        },
        "*",
      )
    }
  }, [isOpen, hideToggle, isPreview, isMobile, isFullscreen])
}