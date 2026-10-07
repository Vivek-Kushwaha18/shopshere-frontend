// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { Minus, Plus, Trash2 } from "lucide-react";

// import type {
//   CartItem as CartItemType,
//   CartVariantOptionValue,
// } from "@/services/cart";

// interface CartItemProps {
//   item: CartItemType;
//   onUpdateQuantity: (
//     itemId: number,
//     quantity: number
//   ) => void;
//   onRemove: (itemId: number) => void;
// }

// function getImageUrl(
//   imageUrl: string | null
// ): string | null {
//   if (!imageUrl) {
//     return null;
//   }

//   return imageUrl;
// }

// function getSelectedOptions(
//   optionValues: CartVariantOptionValue[]
// ): CartVariantOptionValue[] {
//   return [...optionValues].sort(
//     (a, b) => a.option_group_id - b.option_group_id
//   );
// }

// export default function CartItem({
//   item,
//   onUpdateQuantity,
//   onRemove,
// }: CartItemProps) {
//   const variant = item.variant;

//   const selectedOptions = variant
//     ? getSelectedOptions(variant.option_values)
//     : [];

//   const variantPrimaryImage =
//     variant?.images?.find(
//       (image) => image.is_primary
//     )?.image_url ??
//     variant?.images?.[0]?.image_url ??
//     null;

//   const imageUrl =
//     getImageUrl(variantPrimaryImage) ??
//     getImageUrl(item.product.image_url);

//   const price =
//     variant?.price ?? item.product.price;

//   const originalPrice =
//     variant?.original_price ??
//     item.product.original_price;

//   const stock =
//     variant?.stock ?? item.product.stock;

//   const productUrl =
//     `/products/${item.product.slug}`;

//   return (
//     <div className="rounded-lg border bg-white p-4">
//       <div className="flex gap-4">

//         {/* PRODUCT IMAGE */}

//         <Link
//           href={productUrl}
//           className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md border bg-gray-50"
//         >
//           {imageUrl ? (
//             <Image
//               src={imageUrl}
//               alt={item.product.name}
//               fill
//               sizes="112px"
//               className="object-contain"
//             />
//           ) : (
//             <div className="flex h-full items-center justify-center text-sm text-gray-400">
//               No Image
//             </div>
//           )}
//         </Link>

//         {/* PRODUCT DETAILS */}

//         <div className="min-w-0 flex-1">

//           <Link
//             href={productUrl}
//             className="line-clamp-2 text-lg font-semibold hover:underline"
//           >
//             {item.product.name}
//           </Link>

//           {/* SELECTED VARIANT OPTIONS */}

//           {selectedOptions.length > 0 && (
//             <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
//               {selectedOptions.map(
//                 (optionValue) => (
//                   <p
//                     key={optionValue.id}
//                     className="text-sm text-gray-600"
//                   >
//                     <span className="font-medium text-gray-800">
//                       {optionValue.option_group_name}:
//                     </span>{" "}
//                     {optionValue.value}
//                   </p>
//                 )
//               )}
//             </div>
//           )}

//           {/* SKU */}

//           {variant?.sku && (
//             <p className="mt-1 text-xs text-gray-500">
//               SKU: {variant.sku}
//             </p>
//           )}

//           {/* PRICE */}

//           <div className="mt-3 flex items-center gap-2">
//             <span className="text-lg font-bold">
//               ₹{price.toLocaleString("en-IN")}
//             </span>

//             {originalPrice &&
//               originalPrice > price && (
//                 <span className="text-sm text-gray-400 line-through">
//                   ₹
//                   {originalPrice.toLocaleString(
//                     "en-IN"
//                   )}
//                 </span>
//               )}
//           </div>

//           {/* STOCK */}

//           <p
//             className={`mt-1 text-sm ${
//               stock > 0
//                 ? "text-green-600"
//                 : "text-red-600"
//             }`}
//           >
//             {stock > 0
//               ? `${stock} available`
//               : "Out of stock"}
//           </p>

//           {/* QUANTITY + REMOVE */}

//           <div className="mt-4 flex flex-wrap items-center gap-4">

//             <div className="flex items-center rounded-md border">

//               <button
//                 type="button"
//                 onClick={() =>
//                   onUpdateQuantity(
//                     item.id,
//                     item.quantity - 1
//                   )
//                 }
//                 disabled={
//                   item.quantity <= 1
//                 }
//                 className="flex h-9 w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
//                 aria-label="Decrease quantity"
//               >
//                 <Minus className="h-4 w-4" />
//               </button>

//               <span className="flex h-9 min-w-10 items-center justify-center border-x px-3 text-sm font-medium">
//                 {item.quantity}
//               </span>

//               <button
//                 type="button"
//                 onClick={() =>
//                   onUpdateQuantity(
//                     item.id,
//                     item.quantity + 1
//                   )
//                 }
//                 disabled={
//                   item.quantity >= stock
//                 }
//                 className="flex h-9 w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
//                 aria-label="Increase quantity"
//               >
//                 <Plus className="h-4 w-4" />
//               </button>

//             </div>

//             <button
//               type="button"
//               onClick={() =>
//                 onRemove(item.id)
//               }
//               className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
//             >
//               <Trash2 className="h-4 w-4" />
//               Remove
//             </button>

//           </div>
//         </div>
//       </div>

//       {/* ITEM TOTAL */}

//       <div className="mt-4 flex items-center justify-between border-t pt-4">
//         <span className="text-sm text-gray-500">
//           Item total
//         </span>

//         <span className="text-lg font-bold">
//           ₹{item.item_total.toLocaleString("en-IN")}
//         </span>
//       </div>
//     </div>
//   );
// }