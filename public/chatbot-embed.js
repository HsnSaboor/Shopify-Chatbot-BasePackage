;(() => {
  // Configuration
  const CHATBOT_CONFIG = {
    apiUrl: window.CHATBOT_API_URL || "https://your-domain.com",
    containerId: "shopify-ai-chatbot",
    storageKey: "shopify_chatbot_state",
    autoReopenDelay: 1000, // 1 second delay after page load
    debug: false,
    embedMode: window.CHATBOT_EMBED_MODE || "iframe", // "iframe" or "direct"
  }

  // Utility functions
  function log(...args) {
    if (CHATBOT_CONFIG.debug) {
      console.log("[Shopify AI Chatbot]", ...args)
    }
  }

  function extractShopifyData() {
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      if (key && value) {
        acc[key] = decodeURIComponent(value)
      }
      return acc
    }, {})

    // Extract Shopify-specific data
    const shopifyData = {
      userId: cookies._shopify_y || null, // Primary user identifier
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
      // Extract cart data if available
      cartData: null,
    }

    // Try to get current cart data
    if (window.fetch) {
      fetch("/cart.js")
        .then((response) => response.json())
        .then((cart) => {
          shopifyData.cartData = {
            itemCount: cart.item_count,
            totalPrice: cart.total_price,
            currency: cart.currency,
            items:
              cart.items?.map((item) => ({
                id: item.id,
                productId: item.product_id,
                variantId: item.variant_id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
              })) || [],
          }
          log("Cart data extracted:", shopifyData.cartData)
        })
        .catch((error) => log("Failed to fetch cart data:", error))
    }

    log("Shopify data extracted:", shopifyData)
    return shopifyData
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(CHATBOT_CONFIG.storageKey)
      if (!stored) return null

      const state = JSON.parse(stored)
      const expiry = 24 * 60 * 60 * 1000 // 24 hours

      if (Date.now() - state.lastActivity > expiry) {
        localStorage.removeItem(CHATBOT_CONFIG.storageKey)
        return null
      }

      return state
    } catch (error) {
      log("Failed to load state:", error)
      return null
    }
  }

  function shouldAutoReopen() {
    const state = loadState()
    return state && state.isOpen === true
  }

  function createChatbotContainer() {
    // Remove existing container if it exists
    const existing = document.getElementById(CHATBOT_CONFIG.containerId)
    if (existing) {
      existing.remove()
    }

    // Create new container with minimal footprint
    const container = document.createElement("div")
    container.id = CHATBOT_CONFIG.containerId
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 0;
      height: 0;
      pointer-events: none;
      z-index: 9997;
    `

    if (CHATBOT_CONFIG.embedMode === "direct") {
      container.innerHTML = `
        <div id="chatbot-direct-widget" style="
          position: absolute;
          bottom: 0;
          right: 0;
          width: 0;
          height: 0;
          background: transparent;
          display: block;
          pointer-events: none;
          z-index: 9999;
        ">
          <iframe 
            src="${CHATBOT_CONFIG.apiUrl}/chatbot-widget?mode=direct&shopifyData=${encodeURIComponent(JSON.stringify(extractShopifyData()))}"
            style="width: 0; height: 0; border: none; pointer-events: auto;"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
          </iframe>
        </div>
      `
    } else {
      container.innerHTML = `
        <div id="chatbot-iframe-widget" style="
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 400px;
          height: 600px;
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 120px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: none;
          pointer-events: auto;
          z-index: 9999;
        ">
          <iframe 
            src="${CHATBOT_CONFIG.apiUrl}/chatbot-widget?shopifyData=${encodeURIComponent(JSON.stringify(extractShopifyData()))}"
            style="width: 100%; height: 100%; border: none; border-radius: 12px;"
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
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </button>
      `

      // Add toggle functionality for iframe mode
      const toggleBtn = container.querySelector("#chatbot-toggle-btn")
      const widget = container.querySelector("#chatbot-iframe-widget")

      toggleBtn.addEventListener("click", () => {
        const isVisible = widget.style.display !== "none"
        widget.style.display = isVisible ? "none" : "block"
        toggleBtn.innerHTML = isVisible
          ? '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
          : '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      })
    }

    document.body.appendChild(container)
    log(`Chatbot container created in ${CHATBOT_CONFIG.embedMode} mode`)
    return { container }
  }

  function handlePageNavigation() {
    log("Page navigation detected")

    // Check if chatbot should auto-reopen
    if (shouldAutoReopen()) {
      log("Auto-reopening chatbot after navigation")

      setTimeout(() => {
        // Send message to iframe to reopen chatbot
        const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
        if (iframe && iframe.contentWindow) {
          const shopifyData = extractShopifyData()
          iframe.contentWindow.postMessage(
            {
              type: "REOPEN_CHATBOT",
              shopifyData: shopifyData,
              timestamp: Date.now(),
            },
            "*",
          )
        }
      }, CHATBOT_CONFIG.autoReopenDelay)
    }
  }

  function setupMessageListener() {
    window.addEventListener("message", (event) => {
      // Verify origin for security
      if (event.origin !== CHATBOT_CONFIG.apiUrl) {
        return
      }

      const { type, data } = event.data

      switch (type) {
        case "CHATBOT_STATE_CHANGED":
          log("Chatbot state changed:", data)
          break

        case "ADD_TO_CART":
          log("Add to cart request:", data)
          // Handle Shopify cart integration
          handleAddToCart(data)
          break

        case "NAVIGATE_TO_PRODUCT":
          log("Navigate to product:", data)
          if (data.url) {
            window.location.href = data.url
          }
          break

        case "CHATBOT_READY":
          log("Chatbot is ready")
          handlePageNavigation()
          break

        case "REQUEST_SHOPIFY_DATA":
          const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "SHOPIFY_DATA_UPDATE",
                shopifyData: extractShopifyData(),
              },
              "*",
            )
          }
          break
      }
    })
  }

  function handleAddToCart(data) {
    const { variantId, quantity = 1 } = data

    if (!variantId) {
      log("No variant ID provided for add to cart")
      return
    }

    // Use Shopify's cart API
    fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: Number.parseInt(variantId),
            quantity: quantity,
          },
        ],
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        log("Successfully added to cart:", result)

        // Notify chatbot of success
        const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: "ADD_TO_CART_SUCCESS",
              data: result,
            },
            "*",
          )
        }
      })
      .catch((error) => {
        log("Failed to add to cart:", error)

        // Notify chatbot of error
        const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
        if (iframe && iframe.contentWindow) {
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

  function detectPageChange() {
    let currentUrl = window.location.href

    // Monitor for URL changes (for SPA navigation)
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href
        handlePageNavigation()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Also listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", handlePageNavigation)

    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = () => {
      originalPushState.apply(history, arguments)
      setTimeout(handlePageNavigation, 100)
    }

    history.replaceState = () => {
      originalReplaceState.apply(history, arguments)
      setTimeout(handlePageNavigation, 100)
    }
  }

  function initializeChatbot() {
    log("Initializing chatbot...")

    const shopifyData = extractShopifyData()
    log("Initial Shopify data:", shopifyData)

    // Create chatbot container
    createChatbotContainer()

    // Setup message communication
    setupMessageListener()

    // Setup page change detection
    detectPageChange()

    // Handle initial page load
    setTimeout(handlePageNavigation, CHATBOT_CONFIG.autoReopenDelay)

    log("Chatbot initialized successfully")
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChatbot)
  } else {
    initializeChatbot()
  }

  // Expose global API for manual control
  window.ShopifyAIChatbot = {
    open: () => {
      if (CHATBOT_CONFIG.embedMode === "direct") {
        const iframe = document.querySelector("#chatbot-direct-widget iframe")
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: "OPEN_CHATBOT",
            },
            "*",
          )
        }
      } else {
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
      if (CHATBOT_CONFIG.embedMode === "direct") {
        const iframe = document.querySelector("#chatbot-direct-widget iframe")
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: "CLOSE_CHATBOT",
            },
            "*",
          )
        }
      } else {
        const widget = document.querySelector("#chatbot-iframe-widget")
        const toggleBtn = document.querySelector("#chatbot-toggle-btn")
        if (widget && toggleBtn) {
          widget.style.display = "none"
          toggleBtn.innerHTML =
            '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
        }
      }
    },

    clearHistory: () => {
      localStorage.removeItem(CHATBOT_CONFIG.storageKey)
      const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "CLEAR_HISTORY",
          },
          "*",
        )
      }
    },

    setConfig: (config) => {
      Object.assign(CHATBOT_CONFIG, config)
    },

    getShopifyData: () => {
      return extractShopifyData()
    },

    refreshShopifyData: () => {
      const shopifyData = extractShopifyData()
      const iframe = document.querySelector(`#${CHATBOT_CONFIG.containerId} iframe`)
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "SHOPIFY_DATA_UPDATE",
            shopifyData: shopifyData,
          },
          "*",
        )
      }
      return shopifyData
    },
  }
})()
