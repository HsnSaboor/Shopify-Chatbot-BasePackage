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
      name: string;
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
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardHeader className="p-4">
        <CardTitle className="flex justify-between items-center">
          <span>Order #{order.order_number}</span>
          <Badge>{order.payment_method}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Items</h4>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.variant_id} className="flex justify-between text-sm">
                <span>{item.title} (x{item.quantity})</span>
                <span>${item.price}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Customer</h4>
          <p className="text-sm">{order.customer.name}</p>
          {order.customer.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
          {order.customer.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Shipping Address</h4>
          <p className="text-sm">{order.shipping_address.name}</p>
          <p className="text-sm">{order.shipping_address.address1}</p>
          {order.shipping_address.address2 && <p className="text-sm">{order.shipping_address.address2}</p>}
          <p className="text-sm">{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.zip}</p>
          <p className="text-sm">{order.shipping_address.country}</p>
        </div>
      </CardContent>
    </Card>
  )
}
