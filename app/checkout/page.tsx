"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Package,
  Plus,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  getCart,
  clearCart,
  type CartData,
} from "@/services/cart";

import { createOrder } from "@/services/orders";

import {
  getAddresses,
  createAddress,
  type Address,
  type AddressCreateData,
} from "@/services/addresses";

const emptyAddressForm: AddressCreateData = {
  full_name: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  postal_code: "",
  address_type: "Home",
  is_default: false,
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] =
    useState<CartData | null>(null);

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [loadingCart, setLoadingCart] =
    useState(true);

  const [loadingAddresses, setLoadingAddresses] =
    useState(true);

  const [showNewAddressForm, setShowNewAddressForm] =
    useState(false);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [addressForm, setAddressForm] =
    useState<AddressCreateData>(
      emptyAddressForm
    );

  // =====================================================
  // LOAD CART
  // =====================================================

  async function loadCart() {
    try {
      setLoadingCart(true);

      const response = await getCart();

      setCart(response);
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load cart",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setLoadingCart(false);
    }
  }

  // =====================================================
  // LOAD ADDRESSES
  // =====================================================

  async function loadAddresses() {
    try {
      setLoadingAddresses(true);

      const data = await getAddresses();

      setAddresses(data);

      if (data.length === 0) {
        setSelectedAddressId(null);
        setShowNewAddressForm(true);
        return;
      }

      const defaultAddress = data.find(
        (address) => address.is_default
      );

      if (defaultAddress) {
        setSelectedAddressId(
          defaultAddress.id
        );
      } else {
        setSelectedAddressId(
          data[0].id
        );
      }
    } catch (error) {
      console.error(
        "Failed to load addresses:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load addresses",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setLoadingAddresses(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCart();
    loadAddresses();
  }, []);

  // =====================================================
  // ADDRESS FORM CHANGE
  // =====================================================

  function handleAddressChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) {
    const {
      name,
      value,
    } = event.target;

    setAddressForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }

  // =====================================================
  // CREATE NEW ADDRESS
  // =====================================================

  async function handleCreateAddress(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      addressForm.full_name.trim().length <
      2
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Name",
        text:
          "Please enter your full name.",
      });

      return;
    }

    if (
      addressForm.phone.trim().length <
      5
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Phone",
        text:
          "Please enter a valid phone number.",
      });

      return;
    }

    if (
      addressForm.address_line.trim()
        .length < 5
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Address",
        text:
          "Please enter your complete address.",
      });

      return;
    }

    if (
      addressForm.city.trim().length <
      2
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid City",
        text:
          "Please enter your city.",
      });

      return;
    }

    if (
      addressForm.state.trim().length <
      2
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid State",
        text:
          "Please enter your state.",
      });

      return;
    }

    if (
      addressForm.postal_code.trim()
        .length < 3
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Postal Code",
        text:
          "Please enter a valid postal code.",
      });

      return;
    }

    try {
      setSavingAddress(true);

      const data: AddressCreateData = {
        full_name:
          addressForm.full_name.trim(),

        phone:
          addressForm.phone.trim(),

        address_line:
          addressForm.address_line.trim(),

        city:
          addressForm.city.trim(),

        state:
          addressForm.state.trim(),

        postal_code:
          addressForm.postal_code.trim(),

        address_type:
          addressForm.address_type.trim(),

        is_default:
          addressForm.is_default,
      };

      const newAddress =
        await createAddress(data);

      /*
       * Refresh saved addresses.
       * The new address is selected explicitly
       * after the refresh.
       */
      await loadAddresses();

      setSelectedAddressId(
        newAddress.id
      );

      setShowNewAddressForm(false);

      setAddressForm({
        ...emptyAddressForm,
      });

      Swal.fire({
        icon: "success",
        title: "Address Saved",
        text:
          "Your delivery address has been saved.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Failed to create address:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to save address",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setSavingAddress(false);
    }
  }

  // =====================================================
  // CANCEL NEW ADDRESS
  // =====================================================

  function handleCancelNewAddress() {
    setShowNewAddressForm(false);

    setAddressForm({
      ...emptyAddressForm,
    });
  }

  // =====================================================
  // CREATE SHIPPING ADDRESS SNAPSHOT
  // =====================================================

  function createShippingAddress(
    address: Address
  ): string {
    return [
      `Name: ${address.full_name}`,
      `Phone: ${address.phone}`,
      `Address: ${address.address_line}`,
      `City: ${address.city}`,
      `State: ${address.state}`,
      `Postal Code: ${address.postal_code}`,
    ].join("\n");
  }

  // =====================================================
  // PLACE ORDER
  // =====================================================

  async function handleSubmit() {
    if (!cart || cart.items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Your cart is empty",
        text:
          "Please add products before placing an order.",
      });

      return;
    }

    const selectedAddress =
      addresses.find(
        (address) =>
          address.id ===
          selectedAddressId
      );

    if (!selectedAddress) {
      Swal.fire({
        icon: "warning",
        title: "Select a Delivery Address",
        text:
          "Please select a delivery address before placing your order.",
      });

      return;
    }

    try {
      setPlacingOrder(true);

      const shippingAddress =
        createShippingAddress(
          selectedAddress
        );

      const order =
        await createOrder({
          shipping_address:
            shippingAddress,

          items: cart.items.map(
            (item) => ({
              product_id:
                item.product_id,
              quantity:
                item.quantity,
            })
          ),
        });

      await clearCart();

      await Swal.fire({
        icon: "success",
        title:
          "Order Placed Successfully",
        text: `Your order #${order.id} has been placed successfully.`,
        confirmButtonText:
          "View Orders",
      });

      router.push("/orders");
    } catch (error) {
      console.error(
        "Failed to place order:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to place order",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong while placing your order.",
      });
    } finally {
      setPlacingOrder(false);
    }
  }

  // =====================================================
  // LOADING CART
  // =====================================================

  if (loadingCart) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">

        <div className="rounded-xl border bg-white p-10 text-center">

          <p className="text-gray-500">
            Loading checkout...
          </p>

        </div>

      </main>
    );
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (
    !cart ||
    cart.items.length === 0
  ) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">

        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">

          <h1 className="text-2xl font-bold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-gray-500">
            Add products to your cart before checkout.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Continue Shopping
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">

      {/* =================================================
          BACK TO CART
      ================================================= */}

      <Link
        href="/cart"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      {/* =================================================
          HEADING
      ================================================= */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">
          Checkout
        </h1>

        <p className="mt-2 text-gray-500">
          Select your delivery address and place your order.
        </p>

      </div>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* =================================================
            DELIVERY ADDRESS
        ================================================= */}

        <section className="lg:col-span-2">

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            {/* Header */}

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <MapPin className="h-5 w-5" />
              </div>

              <div>

                <h2 className="text-xl font-semibold text-gray-900">
                  Delivery Address
                </h2>

                <p className="text-sm text-gray-500">
                  Select where you want your order delivered.
                </p>

              </div>

            </div>

            {/* Loading */}

            {loadingAddresses ? (

              <div className="rounded-lg border bg-gray-50 p-6 text-center">

                <p className="text-sm text-gray-500">
                  Loading your addresses...
                </p>

              </div>

            ) : (

              <>

                {/* =================================================
                    SAVED ADDRESSES
                ================================================= */}

                {addresses.length > 0 && (

                  <div className="space-y-4">

                    {addresses.map(
                      (address) => {

                        const selected =
                          selectedAddressId ===
                          address.id;

                        return (
                          <button
                            key={
                              address.id
                            }
                            type="button"
                            onClick={() =>
                              setSelectedAddressId(
                                address.id
                              )
                            }
                            disabled={
                              placingOrder
                            }
                            className={`w-full rounded-xl border p-5 text-left transition ${
                              selected
                                ? "border-black bg-gray-50"
                                : "border-gray-200 hover:border-gray-400"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >

                            <div className="flex items-start gap-4">

                              {/* Radio */}

                              <div
                                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  selected
                                    ? "border-black"
                                    : "border-gray-400"
                                }`}
                              >

                                {selected && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-black" />
                                )}

                              </div>

                              {/* Details */}

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h3 className="font-semibold text-gray-900">
                                    {
                                      address.full_name
                                    }
                                  </h3>

                                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                    {
                                      address.address_type
                                    }
                                  </span>

                                  {address.is_default && (
                                    <span className="rounded-full bg-black px-2 py-1 text-xs font-medium text-white">
                                      Default
                                    </span>
                                  )}

                                </div>

                                <p className="mt-2 text-sm text-gray-600">
                                  {
                                    address.phone
                                  }
                                </p>

                                <p className="mt-2 text-sm leading-6 text-gray-600">

                                  {
                                    address.address_line
                                  }

                                  <br />

                                  {
                                    address.city
                                  }
                                  ,{" "}
                                  {
                                    address.state
                                  }

                                  <br />

                                  {
                                    address.postal_code
                                  }

                                </p>

                              </div>

                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                )}

                {/* =================================================
                    ADD NEW ADDRESS BUTTON
                ================================================= */}

                {!showNewAddressForm && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowNewAddressForm(
                        true
                      )
                    }
                    disabled={
                      placingOrder
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-400 px-4 py-3 font-medium text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <Plus className="h-4 w-4" />

                    Add New Address

                  </button>
                )}

                {/* =================================================
                    NEW ADDRESS FORM
                ================================================= */}

                {showNewAddressForm && (

                  <div className="mt-6 rounded-xl border bg-gray-50 p-5">

                    <div className="mb-5 flex items-center justify-between">

                      <div>

                        <h3 className="font-semibold text-gray-900">
                          Add New Address
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Save this address for future orders.
                        </p>

                      </div>

                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={
                            handleCancelNewAddress
                          }
                          disabled={
                            savingAddress
                          }
                          className="text-sm font-medium text-gray-600 hover:text-black"
                        >
                          Cancel
                        </button>
                      )}

                    </div>

                    <form
                      onSubmit={
                        handleCreateAddress
                      }
                      className="space-y-4"
                    >

                      {/* Full Name */}

                      <div>

                        <label
                          htmlFor="new-full-name"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Full Name
                        </label>

                        <input
                          id="new-full-name"
                          name="full_name"
                          type="text"
                          value={
                            addressForm.full_name
                          }
                          onChange={
                            handleAddressChange
                          }
                          placeholder="Enter your full name"
                          required
                          disabled={
                            savingAddress
                          }
                          className="w-full rounded-lg border bg-white px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                        />

                      </div>

                      {/* Phone */}

                      <div>

                        <label
                          htmlFor="new-phone"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Phone Number
                        </label>

                        <input
                          id="new-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          value={
                            addressForm.phone
                          }
                          onChange={
                            handleAddressChange
                          }
                          placeholder="Enter your phone number"
                          required
                          disabled={
                            savingAddress
                          }
                          className="w-full rounded-lg border bg-white px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                        />

                      </div>

                      {/* Address */}

                      <div>

                        <label
                          htmlFor="new-address"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Address
                        </label>

                        <textarea
                          id="new-address"
                          name="address_line"
                          value={
                            addressForm.address_line
                          }
                          onChange={
                            handleAddressChange
                          }
                          placeholder="House number, street, area"
                          rows={4}
                          required
                          disabled={
                            savingAddress
                          }
                          className="w-full resize-none rounded-lg border bg-white px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                        />

                      </div>

                      {/* City + State */}

                      <div className="grid gap-4 sm:grid-cols-2">

                        <div>

                          <label
                            htmlFor="new-city"
                            className="mb-2 block text-sm font-medium text-gray-700"
                          >
                            City
                          </label>

                          <input
                            id="new-city"
                            name="city"
                            type="text"
                            value={
                              addressForm.city
                            }
                            onChange={
                              handleAddressChange
                            }
                            placeholder="Enter city"
                            required
                            disabled={
                              savingAddress
                            }
                            className="w-full rounded-lg border bg-white px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                          />

                        </div>

                        <div>

                          <label
                            htmlFor="new-state"
                            className="mb-2 block text-sm font-medium text-gray-700"
                          >
                            State
                          </label>

                          <input
                            id="new-state"
                            name="state"
                            type="text"
                            value={
                              addressForm.state
                            }
                            onChange={
                              handleAddressChange
                            }
                            placeholder="Enter state"
                            required
                            disabled={
                              savingAddress
                            }
                            className="w-full rounded-lg border bg-white px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                          />

                        </div>

                      </div>

                      {/* Postal Code */}

                      <div>

                        <label
                          htmlFor="new-postal-code"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Postal Code
                        </label>

                        <input
                          id="new-postal-code"
                          name="postal_code"
                          type="text"
                          inputMode="numeric"
                          value={
                            addressForm.postal_code
                          }
                          onChange={
                            handleAddressChange
                          }
                          placeholder="Enter postal code"
                          required
                          disabled={
                            savingAddress
                          }
                          className="w-full rounded-lg border bg-white px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                        />

                      </div>

                      {/* Address Type */}

                      <div>

                        <label
                          htmlFor="new-address-type"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Address Type
                        </label>

                        <select
                          id="new-address-type"
                          name="address_type"
                          value={
                            addressForm.address_type
                          }
                          onChange={
                            handleAddressChange
                          }
                          disabled={
                            savingAddress
                          }
                          className="w-full rounded-lg border bg-white px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                        >

                          <option value="Home">
                            Home
                          </option>

                          <option value="Work">
                            Work
                          </option>

                          <option value="Other">
                            Other
                          </option>

                        </select>

                      </div>

                      {/* Default */}

                      <label className="flex items-center gap-3 text-sm text-gray-700">

                        <input
                          type="checkbox"
                          checked={
                            addressForm.is_default
                          }
                          onChange={(
                            event
                          ) =>
                            setAddressForm(
                              (
                                previous
                              ) => ({
                                ...previous,
                                is_default:
                                  event
                                    .target
                                    .checked,
                              })
                            )
                          }
                          disabled={
                            savingAddress
                          }
                          className="h-4 w-4"
                        />

                        Make this my default address

                      </label>

                      {/* Save */}

                      <button
                        type="submit"
                        disabled={
                          savingAddress
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >

                        <Plus className="h-4 w-4" />

                        {savingAddress
                          ? "Saving Address..."
                          : "Save Address"}

                      </button>

                    </form>

                  </div>
                )}

              </>
            )}

            {/* =================================================
                MANAGE ADDRESSES
            ================================================= */}

            {addresses.length > 0 &&
              !showNewAddressForm && (

                <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 p-4">

                  <div>

                    <p className="text-sm font-medium text-gray-900">
                      Manage your saved addresses
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Edit, delete, or change your default address.
                    </p>

                  </div>

                  <Link
                    href="/addresses"
                    className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >

                    <Pencil className="h-4 w-4" />

                    Manage

                  </Link>

                </div>
              )}

            {/* =================================================
                PLACE ORDER
            ================================================= */}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                placingOrder ||
                loadingAddresses ||
                addresses.length === 0 ||
                selectedAddressId === null
              }
              className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {placingOrder
                ? "Placing Order..."
                : "Place Order"}

            </button>

          </div>

        </section>

        {/* =================================================
            ORDER SUMMARY
        ================================================= */}

        <aside>

          <div className="sticky top-6 rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center gap-3">

              <Package className="h-5 w-5 text-gray-700" />

              <h2 className="text-xl font-semibold text-gray-900">
                Order Summary
              </h2>

            </div>

            {/* Products */}

            <div className="space-y-4 border-b pb-5">

              {cart.items.map(
                (item) => (

                  <div
                    key={item.id}
                    className="flex items-center gap-3"
                  >

                    {item.product.image_url ? (

                      <img
                        src={
                          item.product
                            .image_url
                        }
                        alt={
                          item.product.name
                        }
                        className="h-14 w-14 shrink-0 rounded-md border object-cover"
                      />

                    ) : (

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                        No image
                      </div>

                    )}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-gray-900">
                        {
                          item.product
                            .name
                        }
                      </p>

                      <p className="text-xs text-gray-500">
                        Qty:{" "}
                        {
                          item.quantity
                        }
                      </p>

                      <p className="text-xs text-gray-500">
                        ₹
                        {item.product.price.toFixed(
                          2
                        )}{" "}
                        each
                      </p>

                    </div>

                    <p className="text-sm font-medium text-gray-900">
                      ₹
                      {item.item_total.toFixed(
                        2
                      )}
                    </p>

                  </div>

                )
              )}

            </div>

            {/* Totals */}

            <div className="space-y-4 border-b py-5">

              <div className="flex justify-between text-sm">

                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-medium text-gray-900">
                  {
                    cart.total_items
                  }
                </span>

              </div>

              <div className="flex justify-between text-sm">

                <span className="text-gray-500">
                  Shipping
                </span>

                <span className="font-medium text-gray-900">
                  Free
                </span>

              </div>

            </div>

            {/* Total */}

            <div className="flex justify-between pt-5">

              <span className="text-lg font-semibold">
                Total
              </span>

              <span className="text-lg font-bold">
                ₹
                {cart.total.toFixed(
                  2
                )}
              </span>

            </div>

            {/* Payment */}

            <div className="mt-5 rounded-lg bg-gray-50 p-3">

              <p className="text-xs text-gray-500">
                Payment
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                Payment not required
              </p>

            </div>

          </div>

        </aside>

      </div>

    </main>
  );
}