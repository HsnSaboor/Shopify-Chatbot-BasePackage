export interface ChatState {
  messages: any[]
  isOpen: boolean
  lastActivity: number
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
      
      const stateWithTimestamp = {
        ...state,
        lastActivity: Date.now(),
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateWithTimestamp))
    } catch (error) {
      console.error("Failed to save chat state:", error)
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

      const state: ChatState = JSON.parse(stored)

      // Check if state has expired
      if (Date.now() - state.lastActivity > this.EXPIRY_TIME) {
        this.clearState()
        return null
      }

      // Ensure messages is always an array
      if (!state.messages || !Array.isArray(state.messages)) {
        state.messages = []
      }

      // Ensure required properties exist
      if (typeof state.isOpen !== 'boolean') {
        state.isOpen = false
      }

      if (typeof state.lastActivity !== 'number') {
        state.lastActivity = Date.now()
      }

      return state
    } catch (error) {
      console.error("Failed to load chat state:", error)
      this.clearState()
      return null
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

  static shouldAutoReopen(): boolean {
    const state = this.loadState()
    return state?.isOpen === true
  }
}
