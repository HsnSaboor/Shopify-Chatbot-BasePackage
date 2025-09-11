;(() => {
  // Configuration
  const CHATBOT_CONFIG = {
    apiUrl: window.CHATBOT_API_URL || "https://shopify-ai-chatbot-v2.vercel.app",
    containerId: "shopify-ai-chatbot",
    debug: false,
    embedMode: window.CHATBOT_EMBED_MODE || "iframe", // "iframe" or "direct"
  }

  function log(...args) {
    if (CHATBOT_CONFIG.debug) {
      console.log("[Shopify AI Chatbot]", ...args)
    }
  }

  function extractShopifyData() {
    // Use provided store data or extract from cookies
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
    }
  }

  function createChatbotContainer() {
    // Remove existing container
    const existing = document.getElementById(CHATBOT_CONFIG.containerId)
    if (existing) {
      existing.remove()
    }

    const container = document.createElement("div")
    container.id = CHATBOT_CONFIG.containerId

    if (CHATBOT_CONFIG.embedMode === "iframe") {
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 70px;
        height: 70px;
        pointer-events: auto;
        z-index: 9999;
        transition: all 0.3s ease;
      `

      const shopifyData = extractShopifyData()
      const iframe = document.createElement("iframe")
      iframe.src = `${CHATBOT_CONFIG.apiUrl}/chatbot?shopifyData=${encodeURIComponent(JSON.stringify(shopifyData))}`
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 12px;
        background: transparent;
      `
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation")

      container.appendChild(iframe)
    } else {
      container.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        background: transparent;
      `

      // Load the chatbot widget directly
      const script = document.createElement("script")
      script.type = "module"
      script.innerHTML = `
        import('${CHATBOT_CONFIG.apiUrl}/chatbot-widget-embed.js').then(module => {
          const shopifyData = ${JSON.stringify(extractShopifyData())};
          module.initChatbot(shopifyData);
        }).catch(console.error);
      `
      container.appendChild(script)
    }

    document.body.appendChild(container)
    log(`Chatbot container created in ${CHATBOT_CONFIG.embedMode} mode`)
    return container
  }

  function setupMessageListener() {
    window.addEventListener("message", (event) => {
      const allowedOrigins = [CHATBOT_CONFIG.apiUrl.replace(/https?:\/\//, ""), "localhost:3000", "127.0.0.1:3000"]

      const eventOrigin = event.origin.replace(/https?:\/\//, "")
      if (!allowedOrigins.some((origin) => eventOrigin.includes(origin))) {
        console.log("[v0] Message from unauthorized origin:", event.origin)
        return
      }

      const { type, data } = event.data
      console.log("[v0] Received message:", type, data)

      switch (type) {
        case "CHATBOT_RESIZE":
          handleChatbotResize(data)
          break
        case "CHATBOT_STATE_CHANGED":
          handleChatbotResize({ isOpen: data.isOpen, width: data.isOpen ? 400 : 70, height: data.isOpen ? 600 : 70 })
          break
        case "ADD_TO_CART":
          handleAddToCart(data)
          break
        case "NAVIGATE_TO_PRODUCT":
          if (data.url) window.location.href = data.url
          break
        case "GET_SHOPIFY_DATA":
          sendShopifyDataToIframe()
          break
      }
    })
  }

  function handleChatbotResize(data) {
    const container = document.getElementById(CHATBOT_CONFIG.containerId)
    if (!container) return

    const { width, height, isOpen } = data

    if (CHATBOT_CONFIG.embedMode === "iframe") {
      if (isOpen) {
        container.style.width = "400px"
        container.style.height = "600px"
        container.style.maxWidth = "calc(100vw - 40px)"
        container.style.maxHeight = "calc(100vh - 120px)"
      } else {
        container.style.width = "70px"
        container.style.height = "70px"
      }

      console.log("[v0] Chatbot resized:", { isOpen, width, height })
    }
  }

  function sendShopifyDataToIframe() {
    const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "SHOPIFY_DATA_RESPONSE",
          data: extractShopifyData(),
        },
        "*",
      )
    }
  }

  function handleAddToCart(data) {
    const { variantId, quantity = 1 } = data
    if (!variantId) return

    fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        items: [{ id: Number.parseInt(variantId), quantity }],
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((result) => {
        log("Successfully added to cart:", result)

        const cartCountElements = document.querySelectorAll("[data-cart-count], .cart-count, #cart-count")
        cartCountElements.forEach((el) => {
          const currentCount = Number.parseInt(el.textContent) || 0
          el.textContent = currentCount + quantity
        })

        const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: "ADD_TO_CART_SUCCESS",
              data: result,
            },
            "*",
          )
        }

        if (window.Shopify && window.Shopify.onCartUpdate) {
          window.Shopify.onCartUpdate(result)
        }

        window.dispatchEvent(new CustomEvent("cart:updated", { detail: result }))
      })
      .catch((error) => {
        log("Failed to add to cart:", error)
        const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: "ADD_TO_CART_ERROR",
              error: error.message,
            },
            "*",
          )
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
      const container = document.getElementById(CHATBOT_CONFIG.containerId)
      if (container) {
        container.remove()
        initializeChatbot()
      }
    },
    toggle: () => {
      const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: "TOGGLE_CHATBOT" }, "*")
      }
    },
    updateShopifyData: () => {
      sendShopifyDataToIframe()
    },
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChatbot)
  } else {
    initializeChatbot()
  }
})()
