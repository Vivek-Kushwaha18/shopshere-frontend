"use client";

import Link from "next/link";

export default function CartButtom() {
  return (
    <Link
      href="/cart"
      className="font-semibold text-white hover:text-yellow-300"
    >
      🛒 Cart
    </Link>
  );
}