;(() => {
  // Configuration
  const CHATBOT_CONFIG = {
    apiUrl: window.CHATBOT_API_URL || "https://shopify-ai-chatbot-v2.vercel.app/chatbot",
    containerId: "shopify-ai-chatbot",
    storageKey: "shopify_chatbot_state",
    autoReopenDelay: 1000,
    debug: false,
    embedMode: window.CHATBOT_EMBED_MODE || "iframe", // "iframe" or "direct"
  }

  function log(...args) {
    if (CHATBOT_CONFIG.debug) {
      console.log("[Shopify AI Chatbot]", ...args)
    }
  }

  function extractShopifyData() {
    if (window.SHOPIFY_STORE_DATA) {
      return window.SHOPIFY_STORE_DATA
    }

    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      if (key && value) {
        acc[key] = decodeURIComponent(value)
      }
      return acc
    }, {})

    return {
      userId: cookies._shopify_y || null,
      sessionId: cookies._shopify_s || null,
      cartToken: cookies.cart || null,
      currency: cookies.currency || "USD",
      country: cookies.country || null,
      localization: cookies.localization || null,
      shopDomain: window.Shopify?.shop || window.location.hostname,
      customerHash: cookies._shopify_sa_p || null,
      customerToken: cookies._shopify_sa_t || null,
      trackingConsent: cookies._tracking_consent || null,
      theme: cookies.theme || null,
      cartData: null,
    }
  }

  function createChatbotContainer() {
    const existing = document.getElementById(CHATBOT_CONFIG.containerId)
    if (existing) {
      existing.remove()
    }

    const container = document.createElement("div")
    container.id = CHATBOT_CONFIG.containerId

    if (CHATBOT_CONFIG.embedMode === "direct") {
      container.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9997;
        background: transparent;
      `

      const script = document.createElement("script")
      script.type = "module"
      script.innerHTML = `
        import('${CHATBOT_CONFIG.apiUrl}/chatbot-widget-embed.js').then(module => {
          const shopifyData = ${JSON.stringify(extractShopifyData())};
          module.initChatbot(shopifyData);
        }).catch(console.error);
      `
      container.appendChild(script)
    } else {
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        pointer-events: none;
        z-index: 9997;
      `

      container.innerHTML = `
        <div id="chatbot-iframe-widget" style="
          position: absolute;
          bottom: 0;
          right: 0;
          width: 400px;
          height: 600px;
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 120px);
          background: transparent;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: none;
          pointer-events: auto;
          z-index: 9999;
          transform-origin: bottom right;
        ">
          <iframe 
            src="${CHATBOT_CONFIG.apiUrl}/chatbot?shopifyData=${encodeURIComponent(JSON.stringify(extractShopifyData()))}&hideToggle=true"
            style="width: 100%; height: 100%; border: none; border-radius: 12px; background: transparent;"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
          </iframe>
        </div>
        <button id="chatbot-toggle-btn" style="
          position: absolute;
          bottom: 0;
          right: 0;
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
          pointer-events: auto;
          z-index: 10000;
          transition: all 0.3s ease;
        ">
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </button>
      `

      const toggleBtn = container.querySelector("#chatbot-toggle-btn")
      const widget = container.querySelector("#chatbot-iframe-widget")

      toggleBtn.addEventListener("click", () => {
        const isVisible = widget.style.display !== "none"
        if (isVisible) {
          widget.style.transform = "scale(0.8) translateY(20px)"
          widget.style.opacity = "0"
          setTimeout(() => {
            widget.style.display = "none"
            widget.style.transform = ""
            widget.style.opacity = ""
          }, 200)
        } else {
          widget.style.display = "block"
          widget.style.transform = "scale(0.8) translateY(20px)"
          widget.style.opacity = "0"
          setTimeout(() => {
            widget.style.transform = "scale(1)"
            widget.style.opacity = "1"
          }, 10)
        }

        toggleBtn.innerHTML = isVisible
          ? '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
          : '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      })
    }

    document.body.appendChild(container)
    log(`Chatbot container created in ${CHATBOT_CONFIG.embedMode} mode`)
    return container
  }

  function setupMessageListener() {
    if (CHATBOT_CONFIG.embedMode === "iframe") {
      window.addEventListener("message", (event) => {
        if (event.origin !== CHATBOT_CONFIG.apiUrl) return

        const { type, data } = event.data

        switch (type) {
          case "ADD_TO_CART":
            handleAddToCart(data)
            break
          case "NAVIGATE_TO_PRODUCT":
            if (data.url) window.location.href = data.url
            break
        }
      })
    }
  }

  function handleAddToCart(data) {
    const { variantId, quantity = 1 } = data
    if (!variantId) return

    fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: Number.parseInt(variantId), quantity }],
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        log("Successfully added to cart:", result)
        const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: "ADD_TO_CART_SUCCESS", data: result }, "*")
        }
      })
      .catch((error) => {
        log("Failed to add to cart:", error)
        const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: "ADD_TO_CART_ERROR", error: error.message }, "*")
        }
      })
  }

  function initializeChatbot() {
    log("Initializing chatbot...")
    createChatbotContainer()
    setupMessageListener()
    log("Chatbot initialized successfully")
  }

  window.ShopifyAIChatbot = {
    open: () => {
      if (CHATBOT_CONFIG.embedMode === "iframe") {
        const widget = document.querySelector("#chatbot-iframe-widget")
        const toggleBtn = document.querySelector("#chatbot-toggle-btn")
        if (widget && toggleBtn) {
          widget.style.display = "block"
          toggleBtn.innerHTML =
            '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
        }
      }
    },
    close: () => {
      if (CHATBOT_CONFIG.embedMode === "iframe") {
        const widget = document.querySelector("#chatbot-iframe-widget")
        const toggleBtn = document.querySelector("#chatbot-toggle-btn")
        if (widget && toggleBtn) {
          widget.style.display = "none"
          toggleBtn.innerHTML =
            '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
        }
      }
    },
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChatbot)
  } else {
    initializeChatbot()
  }
})()
