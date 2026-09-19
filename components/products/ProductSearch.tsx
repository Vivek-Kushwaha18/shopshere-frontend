"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProductSearchProps {
  onSearch?: (value: string) => void;
}

export default function ProductSearch({
  onSearch,
}: ProductSearchProps) {
  const [search, setSearch] = useState("");

  function handleChange(value: string) {
    setSearch(value);
    onSearch?.(value);
  }

  function clearSearch() {
    setSearch("");
    onSearch?.("");
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={search}
        onChange={(event) =>
          handleChange(event.target.value)
        }
        placeholder="Search products..."
        className="h-12 pl-10 pr-12"
      />

      {search && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4" />

          <span className="sr-only">
            Clear search
          </span>
        </Button>
      )}
    </div>
  );
}