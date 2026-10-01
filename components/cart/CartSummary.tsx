"use client";

import { useRouter } from "next/navigation";

interface CartSummaryProps {
  totalItems: number;
  total: number;
  onClearCart: () => void;
}

export default function CartSummary({
  totalItems,
  total,
  onClearCart,
}: CartSummaryProps) {
  const router = useRouter();

  function handleCheckout() {
    router.push("/checkout");
  }

  return (
    <div className="h-fit rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Order Summary
        </h2>

        <button
          type="button"
          onClick={onClearCart}
          className="text-sm text-red-500 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="mt-6 flex justify-between">
        <span>
          Items
        </span>

        <span>
          {totalItems}
        </span>
      </div>

      <div className="mt-3 flex justify-between text-lg font-bold">
        <span>
          Total
        </span>

        <span>
          ₹{total.toLocaleString()}
        </span>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        className="mt-6 w-full rounded-md bg-black px-4 py-3 text-white transition hover:bg-gray-800"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}