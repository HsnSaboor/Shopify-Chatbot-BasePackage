export function initChatbot(shopifyData) {
  // Create chatbot widget container
  const container = document.createElement("div")
  container.id = "direct-chatbot-widget"
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 9999;
    pointer-events: auto;
  `

  // Load React component (this would need to be implemented based on your build system)
  // For now, create a simple iframe to the chatbot page
  container.innerHTML = `
    <iframe 
      src="${window.CHATBOT_API_URL}/chatbot?mode=direct&shopifyData=${encodeURIComponent(JSON.stringify(shopifyData))}"
      style="
        width: 70px; 
        height: 70px; 
        border: none; 
        background: transparent;
        transition: all 0.3s ease;
      "
      id="direct-chatbot-iframe"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
    </iframe>
  `

  document.body.appendChild(container)

  // Listen for resize messages from the chatbot
  window.addEventListener("message", (event) => {
    if (event.origin !== window.CHATBOT_API_URL) return

    if (event.data.type === "CHATBOT_RESIZE") {
      const iframe = document.getElementById("direct-chatbot-iframe")
      if (iframe) {
        iframe.style.width = event.data.width + "px"
        iframe.style.height = event.data.height + "px"
      }
    }
  })
}
