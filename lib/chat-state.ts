export interface ChatState {
  messages: any[]
  isOpen: boolean
  lastActivity: number
  manuallyClosed?: boolean // <-- Add this property
}

export class ChatStateService {
  private static readonly STORAGE_KEY = "shopify_chatbot_state"
  private static readonly EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 hours

  static saveState(state: ChatState): void {
    try {
      // Only run on client-side
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const serializedMessages = this.serializeMessages(state.messages);
      const stateWithTimestamp = {
        ...state,
        messages: serializedMessages,
        lastActivity: Date.now(),
      }
      const jsonString = JSON.stringify(stateWithTimestamp);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
    } catch (error) {
      console.error("Failed to save chat state:", error);
      // Save partial state without messages if serialization fails
      try {
        const partialState = {
          messages: [],
          isOpen: state.isOpen,
          manuallyClosed: state.manuallyClosed ?? false,
          lastActivity: Date.now(),
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(partialState));
      } catch (partialError) {
        console.error("Failed to save partial chat state:", partialError);
      }
    }
  }

  static loadState(): ChatState | null {
    // Only run on client-side
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const parsed: any = JSON.parse(stored);

      // Check if state has expired
      if (Date.now() - parsed.lastActivity > this.EXPIRY_TIME) {
        this.clearState()
        return null
      }

      // Validate and reconstruct messages
      let messages: any[] = [];
      if (parsed.messages && Array.isArray(parsed.messages)) {
        messages = parsed.messages.map((msg: any) => this.deserializeMessage(msg)).filter(Boolean);
      }

      // Validate message structure
      const validMessages = messages.filter(msg =>
        typeof msg.id === 'string' &&
        typeof msg.type === 'string' &&
        typeof msg.content === 'string' &&
        (typeof msg.timestamp === 'string' || msg.timestamp instanceof Date)
      );

      if (validMessages.length !== messages.length) {
        console.warn("Invalid messages detected, resetting messages array");
        messages = [];
      } else {
        messages = validMessages;
      }

      // Ensure required properties exist, preserve others
      const state: ChatState = {
        messages,
        isOpen: typeof parsed.isOpen === 'boolean' ? parsed.isOpen : false,
        lastActivity: typeof parsed.lastActivity === 'number' ? parsed.lastActivity : Date.now(),
        manuallyClosed: typeof parsed.manuallyClosed === 'boolean' ? parsed.manuallyClosed : false,
      };

      return state;
    } catch (error) {
      console.warn("Failed to parse chat state, skipping load without clearing:", error);
      // Do not clearState on parse error to avoid losing other potential state
      return null;
    }
  }

  static clearState(): void {
    // Only run on client-side
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear chat state:", error)
    }
  }

  private static serializeMessages(messages: any[]): any[] {
    return messages.map(msg => this.serializeMessage(msg)).filter(Boolean);
  }

  private static serializeMessage(msg: any): any {
    if (!msg || typeof msg !== 'object') return null;

    const { id, type, content, timestamp, ...rest } = msg;
    const serialized: any = {
      id: typeof id === 'string' ? id : '',
      type: typeof type === 'string' ? type : 'bot',
      content: typeof content === 'string' ? content : '',
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : (typeof timestamp === 'string' ? timestamp : new Date().toISOString()),
    };

    // Serialize rest (e.g., data with products/cards) to primitives
    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        serialized[key] = value;
      } else if (Array.isArray(value)) {
        serialized[key] = value.map(this.serializeMessage);
      } else if (value && typeof value === 'object') {
        // For products/cards: extract serializable parts
        if ('id' in value) {
          const typedValue = value as { id: string | number; title?: string; price?: number; imageUrl?: string; src?: string };
          serialized[key] = {
            id: String(typedValue.id),
            title: typedValue.title || '',
            price: typedValue.price || 0,
            imageUrl: typedValue.imageUrl || typedValue.src || '',
          };
        }
        // Add more specific handling if needed for other complex objects
      }
    });

    return serialized;
  }

  private static deserializeMessage(msg: any): any {
    if (!msg || typeof msg !== 'object') return null;

    const { id, type, content, timestamp, ...rest } = msg;
    return {
      id: typeof id === 'string' ? id : '',
      type: typeof type === 'string' ? type : 'bot',
      content: typeof content === 'string' ? content : '',
      timestamp: typeof timestamp === 'string' ? new Date(timestamp) : (timestamp instanceof Date ? timestamp : new Date()),
      ...rest, // Reattach serialized primitives/objects
    };
  }

  static shouldAutoReopen(): boolean {
    const state = this.loadState()
    
    // Always check !manuallyClosed regardless of timeout
    return !!state && state.isOpen === true && !state.manuallyClosed
  }
}
