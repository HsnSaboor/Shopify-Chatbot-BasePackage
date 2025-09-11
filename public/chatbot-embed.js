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
        width: 400px;
        height: 600px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 120px);
        pointer-events: auto;
        z-index: 9997;
      `

      container.innerHTML = `
        <iframe 
          src="${CHATBOT_CONFIG.apiUrl}/chatbot?shopifyData=${encodeURIComponent(JSON.stringify(extractShopifyData()))}"
          style="width: 100%; height: 100%; border: none; border-radius: 12px; background: transparent;"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
        </iframe>
      `
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
    reload: () => {
      const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
      if (iframe) {
        iframe.src = iframe.src
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
