export interface ChatState {
  messages: any[]
  isOpen: boolean
  lastActivity: number
  manuallyClosed?: boolean // <-- Add this property
}

export class ChatStateService {
  private static readonly STORAGE_KEY = "shopify_chatbot_state"
  private static readonly PARENT_STORAGE_KEY = "shopify_chatbot_parent_state"
  private static readonly EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 hours

  static saveState(state: ChatState, isEmbedded = false): void {
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
      console.log("ChatState save: Serialized size:", jsonString.length, "bytes; Messages count:", serializedMessages.length);
      localStorage.setItem(this.STORAGE_KEY, jsonString);

      if (isEmbedded) {
        this.syncToParent(stateWithTimestamp);
      }
    } catch (error) {
      console.error("Failed to save chat state:", error);
      console.log("ChatState save error details:", { stateKeys: Object.keys(state), messagesLength: state.messages?.length || 0 });
      // Save partial state without messages if serialization fails
      try {
        const partialState = {
          messages: [],
          isOpen: state.isOpen,
          manuallyClosed: state.manuallyClosed ?? false,
          lastActivity: Date.now(),
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(partialState));
        if (isEmbedded) {
          this.syncToParent(partialState);
        }
      } catch (partialError) {
        console.error("Failed to save partial chat state:", partialError);
      }
    }
  }

  static loadState(isEmbedded = false): ChatState | null {
    // Only run on client-side
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const parsed: any = JSON.parse(stored);
      console.log("ChatState load: Raw parsed keys:", Object.keys(parsed), "; Messages count:", parsed.messages?.length || 0);

      // Check if state has expired
      if (Date.now() - parsed.lastActivity > this.EXPIRY_TIME) {
        console.log("ChatState expired, clearing.");
        this.clearState(isEmbedded)
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
        console.warn("Invalid messages detected, resetting messages array. Discarded:", messages.length - validMessages.length);
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

      console.log("ChatState loaded successfully: isOpen:", state.isOpen, "; Messages:", state.messages.length);
      return state;
    } catch (error) {
      console.warn("Failed to parse chat state, skipping load without clearing:", error);
      console.log("ChatState load error details:", { storedLength: stored?.length || 0, errorMessage: (error as Error).message });
      // Do not clearState on parse error to avoid losing other potential state
      return null;
    }
  }

  static clearState(isEmbedded = false): void {
    // Only run on client-side
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      if (isEmbedded && window.parent !== window) {
        window.parent.postMessage({
          type: 'CHAT_STATE_CLEAR'
        }, '*');
      }
    } catch (error) {
      console.error("Failed to clear chat state:", error)
    }
  }

  static syncToParent(state: ChatState, targetOrigin: string = '*'): void {
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }
    const serializedState = {
      ...state,
      messages: this.serializeMessages(state.messages),
      lastActivity: Date.now(),
    };
    window.parent.postMessage({
      type: 'CHAT_STATE_SAVE',
      state: serializedState
    }, targetOrigin);
  }

  static requestStateFromParent(targetOrigin: string = '*'): void {
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }
    window.parent.postMessage({
      type: 'CHAT_STATE_REQUEST'
    }, targetOrigin);
  }

  static handleMessage(event: MessageEvent, onStateUpdate?: (state: ChatState | null) => void): void {
    if (event.data.type === 'CHAT_STATE_RESPONSE') {
      const { state: rawState } = event.data;
      if (rawState && onStateUpdate) {
        try {
          const parsed: any = JSON.parse(rawState);
          let messages: any[] = [];
          if (parsed.messages && Array.isArray(parsed.messages)) {
            messages = parsed.messages.map((msg: any) => this.deserializeMessage(msg)).filter(Boolean);
          }
          const chatState: ChatState = {
            messages,
            isOpen: typeof parsed.isOpen === 'boolean' ? parsed.isOpen : false,
            lastActivity: typeof parsed.lastActivity === 'number' ? parsed.lastActivity : Date.now(),
            manuallyClosed: typeof parsed.manuallyClosed === 'boolean' ? parsed.manuallyClosed : false,
          };
          onStateUpdate(chatState);
        } catch (error) {
          console.error('Failed to parse parent state:', error);
          if (onStateUpdate) onStateUpdate(null);
        }
      }
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

    // Serialize rest (e.g., data with products/cards) using plain data serialization
    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined) return;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        serialized[key] = value;
      } else if (Array.isArray(value)) {
        serialized[key] = value.map(v => ChatStateService.serializeData(v));
      } else if (value && typeof value === 'object') {
        serialized[key] = ChatStateService.serializeData(value);
      } else {
        console.warn("ChatState serializeMessage: Skipping non-serializable value for key", key, "type:", typeof value);
      }
    });

    return serialized;
  }

  private static deserializeMessage(msg: any): any {
    if (!msg || typeof msg !== 'object') return null;

    const { id, type, content, timestamp, ...rest } = msg;
    const deserializedRest: any = {};
    Object.entries(rest).forEach(([key, value]) => {
      deserializedRest[key] = ChatStateService.deserializeData(value);
    });
    return {
      id: typeof id === 'string' ? id : '',
      type: typeof type === 'string' ? type : 'bot',
      content: typeof content === 'string' ? content : '',
      timestamp: typeof timestamp === 'string' ? new Date(timestamp) : (timestamp instanceof Date ? timestamp : new Date()),
      ...deserializedRest,
    };
  }

  static shouldAutoReopen(): boolean {
    const state = this.loadState()
    
    // Always check !manuallyClosed regardless of timeout
    return !!state && state.isOpen === true && !state.manuallyClosed
  }

  private static serializeData(data: any, depth: number = 0, maxDepth: number = 10): any {
    if (depth > maxDepth) {
      console.warn("ChatState serializeData: Max recursion depth exceeded at depth", depth, "for data:", data);
      return null;
    }
    if (data === null || typeof data !== 'object') {
      if (typeof data === 'function') {
        console.warn("ChatState serializeData: Encountered function, skipping:", data);
        return undefined;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item, index) => {
        const serialized = ChatStateService.serializeData(item, depth + 1, maxDepth);
        if (serialized === undefined) console.warn("ChatState serializeData: Skipped array item at index", index);
        return serialized;
      }).filter(Boolean);
    }

    const obj: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const serializedValue = ChatStateService.serializeData(value, depth + 1, maxDepth);
        if (serializedValue !== undefined) {
          obj[key] = serializedValue;
        } else {
          console.warn("ChatState serializeData: Skipped property", key, "due to serialization issue");
        }
      }
    }
    return obj;
  }

  private static deserializeData(data: any): any {
    if (data === null || typeof data !== 'object') {
      if (typeof data === 'string') {
        const potentialDate = new Date(data);
        if (!isNaN(potentialDate.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(data)) {
          return potentialDate;
        }
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => ChatStateService.deserializeData(item));
    }

    const obj: any = {};
    for (const [key, value] of Object.entries(data)) {
      const deserialized = ChatStateService.deserializeData(value);
      if (deserialized !== undefined) {
        obj[key] = deserialized;
      } else {
        console.warn("ChatState deserializeData: Skipped invalid deserialization for key", key);
      }
    }
    return obj;
  }
}
