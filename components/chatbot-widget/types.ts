export interface Message {
  id: string
  role?: "user" | "assistant"
  type?: "user" | "bot"
  content: string
  timestamp: Date
  cards?: ProductCardData[]
  products?: any[]
  order?: Order
  event_type?: string
}

export interface Order {
  id: string;
  order_number: number;
  created_at: string;
  fulfillment_status: string | null;
  tracking: {
    carrier: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
  };
  items: Array<{
    product_id: string;
    title: string;
    price: string;
    variant_id: string;
    quantity: number;
  }>;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  shipping_address: {
    name: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  payment_method: string;
}

export interface ProductCardData {
  id: string
  variantId: string
  name: string
  image: string
  price: string
  url: string
  variants: Array<{
    size: string
    color: string
    variantId: string
  }>
}

export interface ChatResponse {
  message: string
  event_type: string
  product_id?: string
  product_name?: string
  order_id?: string
  cards?: ProductCardData[]
  order?: Order
}

export interface ChatbotWidgetProps {
  isPreview?: boolean
  mockMessages?: Message[]
  onMockInteraction?: (action: string, data: any) => void
  hideToggle?: boolean
}