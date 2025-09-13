"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface OrderCardProps {
  order: {
    id: string;
    order_number: number;
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
      address1: string;
      address2: string;
      city: string;
      province: string;
      zip: string;
      country: string;
    };
    payment_method: string;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  console.log("[OrderCard] Rendering with order:", order);
  return (
    <Card className="w-full max-w-md mx-auto md:max-w-sm hover:shadow-lg transition-all duration-200 border-gray-400 border-width-2px">
      <CardHeader className="p-3">
        <CardTitle className="flex justify-between items-center text-base md:text-lg">
          <span>Order #{order.order_number}</span>
          <Badge variant="default">{order.payment_method}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Items</h4>
          <ul className="space-y-1">
            {order.items.map((item) => (
              <li key={item.variant_id} className="flex justify-between text-sm">
                <span className="flex-1 pr-2">{item.title} (x{item.quantity})</span>
                <span className="font-medium">${item.price}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Customer</h4>
          <p className="text-sm">{order.customer.name}</p>
          {order.customer.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
          {order.customer.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
        </div>
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Shipping Address</h4>
          <address className="text-sm not-italic">
            <p>{order.shipping_address.address1}</p>
            {order.shipping_address.address2 && <p>{order.shipping_address.address2}</p>}
            <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.zip}</p>
            <p>{order.shipping_address.country}</p>
          </address>
        </div>
      </CardContent>
    </Card>
  )
}
