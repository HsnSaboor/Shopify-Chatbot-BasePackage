"use client"

import { useState, useEffect } from "react"
import type { Message } from "@/components/chatbot-widget/types"
import { ChatStateService } from "@/lib/chat-state"

interface UseChatbotStateProps {
  isPreview?: boolean
  mockMessages?: Message[]
}

export function useChatbotState({ isPreview = false, mockMessages = [] }: UseChatbotStateProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = ChatStateService.loadState();
    return saved?.isOpen ?? false;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (isPreview && mockMessages.length > 0) {
      return mockMessages
        .map((msg) => {
          if (!msg) return undefined
          return {
            ...msg,
            type: msg.role === "user" ? "user" : "bot",
          } as Message
        })
        .filter((msg): msg is Message => msg !== undefined)
    }
    return [
      {
        id: "1",
        type: "bot",
        content: "__AI_FIRST_REPLY_PLACEHOLDER__",
        timestamp: new Date(),
      },
    ]
  })

  // Load saved state on mount (early effect for messages)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isPreview) return

    const savedState = ChatStateService.loadState()
    if (savedState && savedState.messages && Array.isArray(savedState.messages)) {
      const messagesWithDates = savedState.messages.map((msg: any) => {
        if (!msg) return msg
        return {
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }
      })

      setMessages(messagesWithDates)
    }

    // Auto-reopen only if should (respects manuallyClosed) and onboarded
    if (ChatStateService.shouldAutoReopen() && localStorage.getItem('chatbotOnboarded') === 'true') {
      setTimeout(() => setIsOpen(true), 500)
    }
  }, [isPreview])

  // Save state on messages or isOpen change
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isPreview) return

    const state = {
      messages,
      isOpen,
      lastActivity: Date.now(),
      ...(() => {
        const existingState = ChatStateService.loadState()
        return existingState?.manuallyClosed !== undefined ? { manuallyClosed: existingState.manuallyClosed } : {}
      })()
    }
    ChatStateService.saveState(state)
  }, [messages, isOpen, isPreview])

  // Save state on beforeunload and visibilitychange
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isPreview) return

    const handleBeforeUnload = () => {
      const state = {
        messages,
        isOpen,
        lastActivity: Date.now(),
        ...(() => {
          const existingState = ChatStateService.loadState()
          return existingState?.manuallyClosed !== undefined ? { manuallyClosed: existingState.manuallyClosed } : {}
        })()
      }
      ChatStateService.saveState(state)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const state = {
          messages,
          isOpen,
          lastActivity: Date.now(),
          ...(() => {
            const existingState = ChatStateService.loadState()
            return existingState?.manuallyClosed !== undefined ? { manuallyClosed: existingState.manuallyClosed } : {}
          })()
        }
        ChatStateService.saveState(state)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [messages, isOpen, isPreview])

  return {
    messages,
    setMessages,
    isOpen,
    setIsOpen,
  }
}