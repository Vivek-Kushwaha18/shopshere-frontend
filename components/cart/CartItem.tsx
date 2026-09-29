"use client";

import type { CartItem as CartItemType } from "@/services/cart";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (
    itemId: number,
    quantity: number
  ) => void;
  onRemove: (itemId: number) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const product = item.product;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex gap-4">
        {/* PRODUCT IMAGE */}

        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}

        <div className="flex flex-1 flex-col">
          <h2 className="font-semibold text-gray-900">
            {product.name}
          </h2>

          <p className="mt-1 text-lg font-bold text-gray-900">
            ₹
            {product.price.toLocaleString(
              "en-IN"
            )}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Stock: {product.stock}
          </p>

          {/* QUANTITY */}

          <div className="mt-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(
                  item.id,
                  item.quantity - 1
                )
              }
              disabled={item.quantity <= 1}
              className="h-8 w-8 rounded border hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              -
            </button>

            <span className="min-w-8 text-center font-medium">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(
                  item.id,
                  item.quantity + 1
                )
              }
              disabled={
                item.quantity >= product.stock
              }
              className="h-8 w-8 rounded border hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Increase quantity"
            >
              +
            </button>

            <button
              type="button"
              onClick={() =>
                onRemove(item.id)
              }
              className="ml-4 text-sm text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* ITEM TOTAL */}

      <div className="mt-4 border-t pt-3 text-right font-semibold text-gray-900">
        Item Total: ₹
        {item.item_total.toLocaleString(
          "en-IN"
        )}
      </div>
    </div>
  );
}