export function initChatbot(shopifyData) {
  // Check if already initialized
  if (document.getElementById("direct-chatbot-widget")) {
    return
  }

  // Create container for direct widget
  const container = document.createElement("div")
  container.id = "direct-chatbot-widget"
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 9999;
    pointer-events: auto;
  `

  const widgetHTML = `
    <div id="chatbot-widget-container" style="
      position: relative;
      transition: all 0.3s ease;
    ">
      <!-- Toggle Button -->
      <button id="chatbot-toggle" style="
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #007cba;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 124, 186, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        transition: all 0.3s ease;
      ">
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
        </svg>
      </button>

      <!-- Chat Window -->
      <div id="chatbot-window" style="
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 400px;
        height: 600px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 10000;
      ">
        <iframe 
          src="${window.CHATBOT_API_URL}/chatbot?mode=embedded&shopifyData=${encodeURIComponent(JSON.stringify(shopifyData))}"
          style="width: 100%; height: 100%; border: none; border-radius: 12px;"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
        </iframe>
      </div>
    </div>
  `

  container.innerHTML = widgetHTML
  document.body.appendChild(container)

  const toggleButton = container.querySelector("#chatbot-toggle")
  const chatWindow = container.querySelector("#chatbot-window")
  let isOpen = false

  toggleButton.addEventListener("click", () => {
    isOpen = !isOpen
    if (isOpen) {
      chatWindow.style.display = "flex"
      toggleButton.style.display = "none"
    } else {
      chatWindow.style.display = "none"
      toggleButton.style.display = "flex"
    }
  })

  // Listen for close messages from iframe
  window.addEventListener("message", (event) => {
    if (event.data.type === "CLOSE_CHATBOT") {
      isOpen = false
      chatWindow.style.display = "none"
      toggleButton.style.display = "flex"
    }
  })

  window.addEventListener("message", (event) => {
    if (event.data.type === "ADD_TO_CART") {
      // Forward to parent window for handling
      window.parent.postMessage(event.data, "*")
    }
  })
}
