"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [search, setSearch] =
    useState("");

  const router = useRouter();

  function handleSearch(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!search.trim()) {
      return;
    }

    router.push(
      `/products?search=${encodeURIComponent(
        search
      )}`
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-1 max-w-2xl"
    >
      <input
        type="text"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Search for products, brands and more"
        className="w-full rounded-l-md border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        className="rounded-r-md bg-yellow-400 px-5 font-semibold text-gray-900 hover:bg-yellow-500"
      >
        Search
      </button>
    </form>
  );
}