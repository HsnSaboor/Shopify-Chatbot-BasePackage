;(() => {
  // Configuration
  const CHATBOT_CONFIG = {
    apiUrl: window.CHATBOT_API_URL || "https://shopify-ai-chatbot-v2.vercel.app",
    debug: false,
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

  function sendShopifyDataToIframe() {
    const iframe = document.querySelector("#shopify-ai-chatbot iframe")
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

        const iframe = document.querySelector("#shopify-ai-chatbot iframe")
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
        const iframe = document.querySelector("#shopify-ai-chatbot iframe")
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

  function initializeHelper() {
    log("Initializing Shopify helper...")
    setupMessageListener()
    log("Shopify helper initialized successfully")
  }

  window.ShopifyAIChatbot = {
    extractShopifyData,
    updateShopifyData: () => {
      sendShopifyDataToIframe()
    },
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeHelper)
  } else {
    initializeHelper()
  }
})()
