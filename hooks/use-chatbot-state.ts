"use client"

import { useState, useEffect, useRef } from "react"
import type { Message } from "@/components/chatbot-widget/types"
import { ChatStateService } from "@/lib/chat-state"

interface UseChatbotStateProps {
  isPreview?: boolean
  mockMessages?: Message[]
  isEmbedded?: boolean
}

export function useChatbotState({ isPreview = false, mockMessages = [], isEmbedded = false }: UseChatbotStateProps) {
  const initializedRef = useRef(false);

  const [isOpen, setIsOpen] = useState(() => {
    console.log("ChatbotState: Initializing isOpen");
    if (typeof window === 'undefined') {
      console.log("ChatbotState: SSR, default isOpen: false");
      return false;
    }
    const saved = ChatStateService.loadState();
    const initialOpen = saved?.isOpen ?? false;
    console.log("ChatbotState: Initial isOpen from load:", initialOpen);
    return initialOpen;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    console.log("ChatbotState: Initializing messages, isPreview:", isPreview, "mockMessages length:", mockMessages.length);
    if (isPreview && mockMessages.length > 0) {
      const processed = mockMessages
        .map((msg) => {
          if (!msg) return undefined;
          return {
            ...msg,
            type: msg.role === "user" ? "user" : "bot",
          } as Message;
        })
        .filter((msg): msg is Message => msg !== undefined);
      console.log("ChatbotState: Using mock messages, length:", processed.length);
      return processed as Message[];
    }
    console.log("ChatbotState: Init messages: length 0");
    return [];
  });

  // Load saved state on mount (early effect for messages)
  useEffect(() => {
    console.log("ChatbotState: Mount effect starting, isPreview:", isPreview, "isEmbedded:", isEmbedded, "window defined:", typeof window !== 'undefined');
    if (typeof window === 'undefined' || isPreview || initializedRef.current) {
      console.log("ChatbotState: Skipping load due to SSR, preview, or already initialized");
      return;
    }

    initializedRef.current = true;
    console.log("ChatbotState: Loading saved state...");
    const savedState = ChatStateService.loadState(isEmbedded);
    console.log("ChatbotState: Loaded state:", { hasMessages: !!savedState?.messages, messagesLength: savedState?.messages?.length || 0, isOpen: savedState?.isOpen });

    let newMessages: Message[] = [];
    if (savedState && savedState.messages && Array.isArray(savedState.messages) && savedState.messages.length > 0) {
      newMessages = savedState.messages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
      console.log("ChatbotState: Post-load set: length", newMessages.length);
      setMessages(newMessages);
      console.log("ChatbotState: setMessages called successfully");
    } else {
      newMessages = [
        {
          id: "1",
          type: "bot",
          content: "__AI_FIRST_REPLY_PLACEHOLDER__",
          timestamp: new Date(),
        },
      ];
      console.log("ChatbotState: Setting placeholder initial messages, length: 1");
      setMessages(newMessages);
    }

    if (savedState) {
      setIsOpen(savedState.isOpen ?? false);
    }

    // If embedded, request state from parent
    if (isEmbedded) {
      console.log("ChatbotState: Requesting state from parent");
      ChatStateService.requestStateFromParent();
    }

    // Auto-reopen only if should (respects manuallyClosed) and onboarded
    if (ChatStateService.shouldAutoReopen() && localStorage.getItem('chatbotOnboarded') === 'true') {
      console.log("ChatbotState: Auto-reopening chat");
      setTimeout(() => setIsOpen(true), 500);
    } else {
      console.log("ChatbotState: Not auto-reopening, shouldAutoReopen:", ChatStateService.shouldAutoReopen(), "onboarded:", localStorage.getItem('chatbotOnboarded'));
    }
  }, [isPreview, isEmbedded]);

  // Save state on messages or isOpen change
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isPreview) return

    const state = {
      messages,
      isOpen,
      lastActivity: Date.now(),
      ...(() => {
        const existingState = ChatStateService.loadState(isEmbedded)
        return existingState?.manuallyClosed !== undefined ? { manuallyClosed: existingState.manuallyClosed } : {}
      })()
    }
    ChatStateService.saveState(state, isEmbedded)
  }, [messages, isOpen, isPreview, isEmbedded])

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
          const existingState = ChatStateService.loadState(isEmbedded)
          return existingState?.manuallyClosed !== undefined ? { manuallyClosed: existingState.manuallyClosed } : {}
        })()
      }
      ChatStateService.saveState(state, isEmbedded)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const state = {
          messages,
          isOpen,
          lastActivity: Date.now(),
          ...(() => {
            const existingState = ChatStateService.loadState(isEmbedded)
            return existingState?.manuallyClosed !== undefined ? { manuallyClosed: existingState.manuallyClosed } : {}
          })()
        }
        ChatStateService.saveState(state, isEmbedded)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [messages, isOpen, isPreview, isEmbedded])

  // Listen for state messages from parent in embedded mode
  useEffect(() => {
    if (!isEmbedded || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      ChatStateService.handleMessage(event, (state) => {
        if (state) {
          const messagesWithDates = state.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          setMessages(messagesWithDates);
          setIsOpen(state.isOpen);
          console.log("ChatbotState: Updated from parent state, messages length:", messagesWithDates.length, "isOpen:", state.isOpen);
        }
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded]);

  return {
    messages,
    setMessages,
    isOpen,
    setIsOpen,
  }
}