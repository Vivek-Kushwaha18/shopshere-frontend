"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "@/services/cart";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  busy?: boolean;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  busy = false,
}: CartItemProps) {
  const router = useRouter();
  const [buying, setBuying] = useState(false);
  const product = item.product;

  function handleBuyNow() {
    setBuying(true);
    router.push(`/checkout?buyNow=${encodeURIComponent(String(item.id))}`);
  }

  const price = Number(item.variant?.price ?? product.price ?? 0);
  const total = Number(item.item_total ?? price * item.quantity);
  const stock = Number(item.variant?.stock ?? product.stock ?? 0);

  return (
    <article className="bg-white">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 sm:h-36 sm:w-32">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-sm text-gray-400">No Image</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-gray-800 sm:text-lg">
            {product.name}
          </h2>

          <p className="mt-2 text-xl font-bold text-gray-900">
            ₹{price.toLocaleString("en-IN")}
          </p>

          {item.variant?.option_values?.length ? (
            <p className="mt-1 text-sm text-gray-500">
              Options: {item.variant.option_values.map((option) => option.value).join(" • ")}
            </p>
          ) : null}

          <p className="mt-1 text-sm text-gray-500">
            {stock > 0 ? `${stock} available` : "Out of stock"}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600">Quantity</span>

            <div className="flex items-center gap-3 rounded-full border border-gray-300 p-1">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={busy || item.quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-40"
              >
                <Minus size={15} />
              </button>

              <span className="min-w-5 text-center text-sm font-semibold">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={busy || item.quantity >= stock}
                aria-label="Increase quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 size={16} />
          REMOVE
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={buying || busy || stock < item.quantity || stock <= 0}
          className="inline-flex items-center gap-2 rounded-md bg-[#fb641b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e85b16] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag size={16} />
          {buying ? "Please wait..." : "BUY THIS NOW"}
        </button>

        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500">Item total</p>
          <p className="text-lg font-bold text-gray-900">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </article>
  );
}
