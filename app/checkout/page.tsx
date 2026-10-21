
"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Package,
  Plus,
  Pencil,
  CreditCard,
  Banknote,
  Tag,
  X,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ShoppingBag,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { getCart, clearCart, type CartData } from "@/services/cart";
import {
  createOrder,
  getOrder,
  cancelOrder,
  type PaymentMethod,
} from "@/services/orders";
import {
  getAddresses,
  createAddress,
  type Address,
  type AddressCreateData,
} from "@/services/addresses";
import {
  validateCoupon,
  type CouponValidationResponse,
} from "@/services/coupons";
import {
  createPaymentIntent,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getSavedCards,
  type SavedCard,
} from "@/services/payments";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const BLUE = "#2874F0";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void | Promise<void>;
      modal?: {
        ondismiss?: () => void;
      };
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      theme?: {
        color?: string;
      };
      config?: {
        display?: {
          blocks?: {
            shopsphere?: {
              name: string;
              instruments: {
                method: string;
              }[];
            };
          };
          sequence?: string[];
          preferences?: {
            show_default_blocks?: boolean;
          };
        };
      };
    }) => {
      open: () => void;
      on: (
        event: string,
        callback: (response: {
          error?: {
            description?: string;
          };
        }) => void
      ) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const scriptUrl =
      "https://checkout.razorpay.com/v1/checkout.js";

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

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

function PaymentForm({
  onSuccess,
  onCancel,
  processing,
}: {
  onSuccess: () => Promise<void>;
  onCancel: () => Promise<void>;
  processing: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [paymentError, setPaymentError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePayment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!stripe || !elements || submitting || processing) return;

    setPaymentError("");
    setSubmitting(true);

    try {
      const { error, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });

      if (error) {
        setPaymentError(
          error.message || "Payment failed. Please try again."
        );
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await onSuccess();
        return;
      }

      if (paymentIntent?.status === "processing") {
        setPaymentError(
          "Payment is processing. Check My Orders before trying again."
        );
        return;
      }

      setPaymentError(
        "Payment has not completed. Please check your payment details."
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to process payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handlePayment} className="mt-5 space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <PaymentElement />
      </div>

      {paymentError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {paymentError}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void onCancel()}
          disabled={processing || submitting}
          className="w-full rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={!stripe || !elements || processing || submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2874F0] px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {processing || submitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            "Pay Now"
          )}
        </button>
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        Your payment is processed securely by Stripe.
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [razorpayProcessing, setRazorpayProcessing] = useState(false);

  const [paymentClientSecret, setPaymentClientSecret] =
    useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] =
    useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("stripe");

  const [saveCard, setSaveCard] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);

  const [addressForm, setAddressForm] =
    useState<AddressCreateData>({ ...emptyAddressForm });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResponse | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  async function loadCart() {
    try {
      setLoadingCart(true);
      setCart(await getCart());
    } catch (error) {
      console.error("Failed to load cart:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to Load Cart",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setLoadingCart(false);
    }
  }

  async function loadAddresses() {
    try {
      setLoadingAddresses(true);

      const data = await getAddresses();
      setAddresses(data);

      if (data.length === 0) {
        setSelectedAddressId(null);
        setShowNewAddressForm(true);
      } else {
        const defaultAddress = data.find(
          (address) => address.is_default
        );

        setSelectedAddressId(defaultAddress?.id ?? data[0].id);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to Load Addresses",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setLoadingAddresses(false);
    }
  }

  useEffect(() => {
    void loadCart();
    void loadAddresses();
  }, []);

  useEffect(() => {
    if (paymentMethod !== "stripe") return;

    let active = true;

    async function loadCards() {
      try {
        setLoadingSavedCards(true);
        const cards = await getSavedCards();

        if (active) setSavedCards(cards);
      } catch (error) {
        console.error("Unable to load saved cards:", error);

        if (active) setSavedCards([]);
      } finally {
        if (active) setLoadingSavedCards(false);
      }
    }

    void loadCards();

    return () => {
      active = false;
    };
  }, [paymentMethod]);

  function handleAddressChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCreateAddress(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      addressForm.full_name.trim().length < 2 ||
      addressForm.phone.trim().length < 5 ||
      addressForm.address_line.trim().length < 5 ||
      addressForm.city.trim().length < 2 ||
      addressForm.state.trim().length < 2 ||
      addressForm.postal_code.trim().length < 3
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Check Your Address",
        text: "Please complete all address fields correctly.",
      });

      return;
    }

    try {
      setSavingAddress(true);

      const newAddress = await createAddress({
        full_name: addressForm.full_name.trim(),
        phone: addressForm.phone.trim(),
        address_line: addressForm.address_line.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postal_code: addressForm.postal_code.trim(),
        address_type: addressForm.address_type.trim(),
        is_default: addressForm.is_default,
      });

      await loadAddresses();

      setSelectedAddressId(newAddress.id);
      setShowNewAddressForm(false);
      setAddressForm({ ...emptyAddressForm });

      await Swal.fire({
        icon: "success",
        title: "Address Saved",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to save address:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to Save Address",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setSavingAddress(false);
    }
  }

  function createShippingAddress(address: Address): string {
    return [
      `Name: ${address.full_name}`,
      `Phone: ${address.phone}`,
      `Address: ${address.address_line}`,
      `City: ${address.city}`,
      `State: ${address.state}`,
      `Postal Code: ${address.postal_code}`,
    ].join("\n");
  }

  async function handleApplyCoupon() {
    if (!cart || !couponCode.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Enter Coupon Code",
        text: "Please enter a coupon code.",
      });

      return;
    }

    try {
      setCouponLoading(true);

      const coupon = await validateCoupon(
        couponCode.trim(),
        cart.total
      );

      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);

      await Swal.fire({
        icon: "success",
        title: "Coupon Applied",
        text: `You saved ₹${coupon.discount_amount.toFixed(2)}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      setAppliedCoupon(null);

      await Swal.fire({
        icon: "error",
        title: "Invalid Coupon",
        text:
          error instanceof Error
            ? error.message
            : "Unable to apply coupon.",
      });
    } finally {
      setCouponLoading(false);
    }
  }

  const subtotal = cart?.total ?? 0;
  const discountAmount = appliedCoupon?.discount_amount ?? 0;
  const finalAmount = Math.max(subtotal - discountAmount, 0);

  async function handleRazorpayPayment(orderId: number) {
    if (razorpayProcessing) return;

    setRazorpayProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay checkout. Check your internet connection and try again."
        );
      }

      const RazorpayCheckout = window.Razorpay;

      const razorpayOrder = await createRazorpayOrder({
        order_id: orderId,
      });

      await new Promise<void>((resolve, reject) => {
        let completed = false;

        function finish(error?: Error) {
          if (completed) return;
          completed = true;

          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }

        const checkout = new RazorpayCheckout({
          key: razorpayOrder.key_id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "ShopSphere",
          description: `Order #${orderId}`,
          order_id: razorpayOrder.razorpay_order_id,

          theme: {
            color: BLUE,
          },

          config: {
            display: {
              blocks: {
                shopsphere: {
                  name: "Pay Your Way",
                  instruments: [
                    { method: "upi" },
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                  ],
                },
              },
              sequence: ["block.shopsphere"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },

          handler: async (result) => {
            try {
              const verification = await verifyRazorpayPayment({
                order_id: orderId,
                razorpay_order_id: result.razorpay_order_id,
                razorpay_payment_id: result.razorpay_payment_id,
                razorpay_signature: result.razorpay_signature,
              });

              if (
                (verification as unknown as {
                  verified?: boolean;
                }).verified !== true
              ) {
                throw new Error(
                  "Payment has not been verified. Check My Orders before trying again."
                );
              }

              try {
                await clearCart();
              } catch (error) {
                console.error(
                  "Unable to clear cart after payment:",
                  error
                );
              }

              await Swal.fire({
                icon: "success",
                title: "Payment Successful",
                text: `Your order #${orderId} has been confirmed.`,
                confirmButtonText: "View Orders",
              });

              router.push("/orders");
              finish();
            } catch (error) {
              finish(
                error instanceof Error
                  ? error
                  : new Error("Unable to verify Razorpay payment.")
              );
            }
          },

          modal: {
            ondismiss: () => {
              finish(
                new Error(
                  "Razorpay checkout was closed. Check My Orders before trying again."
                )
              );
            },
          },
        });

        checkout.on("payment.failed", (result) => {
          finish(
            new Error(
              result.error?.description ||
                "Razorpay payment failed."
            )
          );
        });

        checkout.open();
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Payment Not Confirmed",
        text:
          error instanceof Error
            ? error.message
            : "Check My Orders before trying again.",
      });
    } finally {
      setRazorpayProcessing(false);
    }
  }

  async function handleSubmit() {
    if (
      placingOrder ||
      paymentProcessing ||
      razorpayProcessing
    ) {
      return;
    }

    if (!cart || cart.items.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Your Cart Is Empty",
        text: "Please add products before checkout.",
      });

      return;
    }

    const selectedAddress = addresses.find(
      (address) => address.id === selectedAddressId
    );

    if (!selectedAddress) {
      await Swal.fire({
        icon: "warning",
        title: "Select a Delivery Address",
        text:
          "Please select a delivery address before placing your order.",
      });

      return;
    }

    try {
      setPlacingOrder(true);

      const order = await createOrder({
        shipping_address: createShippingAddress(selectedAddress),
        items: cart.items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        coupon_code: appliedCoupon?.code,
        payment_method: paymentMethod,
      });

      if (paymentMethod === "cod") {
        try {
          await clearCart();
        } catch (error) {
          console.error("Unable to clear cart:", error);
        }

        await Swal.fire({
          icon: "success",
          title: "Order Placed Successfully",
          text: `Your order #${order.id} has been placed with Cash on Delivery.`,
          confirmButtonText: "View Orders",
        });

        router.push("/orders");
        return;
      }

      if (paymentMethod === "razorpay") {
        await handleRazorpayPayment(order.id);
        return;
      }

      const payment = await createPaymentIntent({
        order_id: order.id,
        save_card: saveCard,
      });

      setPaymentOrderId(order.id);
      setPaymentClientSecret(payment.client_secret);
    } catch (error) {
      console.error("Checkout failed:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to Continue",
        text:
          error instanceof Error
            ? error.message
            : "Check My Orders before retrying if an order may already have been created.",
      });
    } finally {
      setPlacingOrder(false);
    }
  }

  async function handlePaymentSuccess() {
    if (paymentOrderId === null || paymentProcessing) return;

    const orderId = paymentOrderId;
    setPaymentProcessing(true);

    try {
      let confirmed = false;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        try {
          const order = await getOrder(orderId);

          if (order.payment_status === "paid") {
            confirmed = true;
            break;
          }
        } catch (error) {
          console.error("Unable to verify payment:", error);
        }

        if (attempt < 19) {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, 1500)
          );
        }
      }

      if (!confirmed) {
        await Swal.fire({
          icon: "info",
          title: "Payment Confirmation Pending",
          text:
            "ShopSphere has not confirmed your payment yet. Your cart has been preserved. Check My Orders before trying again.",
          confirmButtonText: "View Orders",
        });

        router.push("/orders");
        return;
      }

      try {
        await clearCart();
      } catch (error) {
        console.error("Unable to clear cart after payment:", error);
      }

      await Swal.fire({
        icon: "success",
        title: "Payment Successful",
        text: `Your order #${orderId} has been confirmed.`,
        confirmButtonText: "View Orders",
      });

      router.push("/orders");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleCancelPayment() {
    if (paymentProcessing) return;

    setPaymentProcessing(true);

    try {
      if (paymentOrderId !== null) {
        await cancelOrder(paymentOrderId);
      }

      setPaymentClientSecret(null);
      setPaymentOrderId(null);

      await Swal.fire({
        icon: "info",
        title: "Payment Screen Closed",
        text:
          "Your cart has been preserved. Check My Orders before starting another payment.",
      });
    } catch (error) {
      console.error("Unable to cancel order:", error);

      await Swal.fire({
        icon: "warning",
        title: "Unable to Cancel Order",
        text:
          error instanceof Error
            ? error.message
            : "Check My Orders before trying again.",
      });
    } finally {
      setPaymentProcessing(false);
    }
  }

  if (loadingCart) {
    return (
      <main className="min-h-screen bg-[#f1f3f6] px-4 py-16">
        <div className="mx-auto max-w-7xl rounded-xl bg-white p-12 text-center shadow-sm">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#2874F0]" />
          <p className="mt-4 text-sm text-gray-600">
            Loading your checkout...
          </p>
        </div>
      </main>
    );
  }

  if (paymentClientSecret && paymentOrderId !== null) {
    return (
      <main className="min-h-screen bg-[#f1f3f6] px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/cart"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#2874F0] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-[#2874F0] p-5 text-white sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
                ShopSphere Secure Payment
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Complete Your Payment
              </h1>
              <p className="mt-2 text-sm text-blue-100">
                Order #{paymentOrderId}
              </p>
            </div>

            <div className="p-5 sm:p-7">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: paymentClientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: BLUE,
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancelPayment}
                  processing={paymentProcessing}
                />
              </Elements>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-[#f1f3f6] px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <ShoppingBag className="h-10 w-10 text-[#2874F0]" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Your Cart Is Empty
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Your next favourite purchase is waiting for you.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#2874F0] px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Continue Shopping
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId
  );

  const submitDisabled =
    placingOrder ||
    paymentProcessing ||
    razorpayProcessing ||
    couponLoading ||
    loadingAddresses ||
    addresses.length === 0 ||
    selectedAddressId === null ||
    showNewAddressForm;

  return (
    <main className="min-h-screen bg-[#f1f3f6] pb-28 sm:pb-12">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
          <section className="min-w-0 space-y-6 lg:col-span-2">
            {/* Delivery address */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2874F0]">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Delivery Address
                    </h2>
                    <p className="text-xs text-gray-500">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                {addresses.length > 0 && !showNewAddressForm && (
                  <span className="hidden rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 sm:inline-block">
                    {addresses.length} saved
                  </span>
                )}
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                {loadingAddresses ? (
                  <div className="flex items-center gap-2 py-5 text-sm text-gray-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading saved addresses...
                  </div>
                ) : (
                  <>
                    {addresses.length === 0 && !showNewAddressForm && (
                      <p className="text-sm text-gray-500">
                        You have no saved delivery addresses. Add one
                        to continue.
                      </p>
                    )}

                    {addresses.map((address) => {
                      const isSelected =
                        selectedAddressId === address.id;

                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() =>
                            setSelectedAddressId(address.id)
                          }
                          disabled={placingOrder}
                          className={`w-full rounded-xl border p-4 text-left transition sm:p-5 ${
                            isSelected
                              ? "border-[#2874F0] bg-blue-50/60 ring-1 ring-[#2874F0]"
                              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-[#2874F0]"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" />
                              )}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-gray-900">
                                  {address.full_name}
                                </p>

                                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                                  {address.address_type}
                                </span>

                                {address.is_default && (
                                  <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                                    Default
                                  </span>
                                )}

                                {isSelected && (
                                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    Selected
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                                {address.address_line}, {address.city},{" "}
                                {address.state} - {address.postal_code}
                              </p>

                              <p className="mt-1 text-sm text-gray-600">
                                Phone:{" "}
                                <span className="font-semibold text-gray-800">
                                  {address.phone}
                                </span>
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {addresses.length > 0 && (
                      <Link
                        href="/addresses"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#2874F0] hover:underline"
                      >
                        <Pencil className="h-4 w-4" />
                        Manage saved addresses
                      </Link>
                    )}

                    {!showNewAddressForm && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#2874F0] bg-blue-50/50 px-4 py-3 text-sm font-bold text-[#2874F0] transition hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4" />
                        Add a New Delivery Address
                      </button>
                    )}

                    {showNewAddressForm && (
                      <div className="rounded-xl border border-blue-100 bg-gray-50 p-4 sm:p-5">
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              Add Delivery Address
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                              Enter the address where you want your
                              order delivered.
                            </p>
                          </div>

                          {addresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewAddressForm(false);
                                setAddressForm({ ...emptyAddressForm });
                              }}
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                              aria-label="Close address form"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        <form
                          onSubmit={handleCreateAddress}
                          className="space-y-4"
                        >
                          <div>
                            <label
                              htmlFor="full_name"
                              className="mb-1.5 block text-sm font-semibold text-gray-700"
                            >
                              Full Name
                            </label>
                            <input
                              id="full_name"
                              name="full_name"
                              value={addressForm.full_name}
                              onChange={handleAddressChange}
                              required
                              minLength={2}
                              placeholder="Enter full name"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="phone"
                              className="mb-1.5 block text-sm font-semibold text-gray-700"
                            >
                              Phone Number
                            </label>
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={addressForm.phone}
                              onChange={handleAddressChange}
                              required
                              minLength={5}
                              placeholder="Enter phone number"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="address_line"
                              className="mb-1.5 block text-sm font-semibold text-gray-700"
                            >
                              House No., Building, Street, Area
                            </label>
                            <textarea
                              id="address_line"
                              name="address_line"
                              value={addressForm.address_line}
                              onChange={handleAddressChange}
                              required
                              minLength={5}
                              rows={3}
                              placeholder="Enter complete address"
                              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="city"
                                className="mb-1.5 block text-sm font-semibold text-gray-700"
                              >
                                City
                              </label>
                              <input
                                id="city"
                                name="city"
                                value={addressForm.city}
                                onChange={handleAddressChange}
                                required
                                minLength={2}
                                placeholder="City"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="state"
                                className="mb-1.5 block text-sm font-semibold text-gray-700"
                              >
                                State
                              </label>
                              <input
                                id="state"
                                name="state"
                                value={addressForm.state}
                                onChange={handleAddressChange}
                                required
                                minLength={2}
                                placeholder="State"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="postal_code"
                              className="mb-1.5 block text-sm font-semibold text-gray-700"
                            >
                              PIN Code
                            </label>
                            <input
                              id="postal_code"
                              name="postal_code"
                              value={addressForm.postal_code}
                              onChange={handleAddressChange}
                              required
                              minLength={3}
                              placeholder="Enter PIN code"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="address_type"
                              className="mb-1.5 block text-sm font-semibold text-gray-700"
                            >
                              Address Type
                            </label>
                            <select
                              id="address_type"
                              name="address_type"
                              value={addressForm.address_type}
                              onChange={handleAddressChange}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="Home">Home</option>
                              <option value="Work">Work</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <label className="flex items-center gap-3 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={addressForm.is_default}
                              onChange={(event) =>
                                setAddressForm((previous) => ({
                                  ...previous,
                                  is_default: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 accent-[#2874F0]"
                            />
                            Make this my default address
                          </label>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                              type="submit"
                              disabled={savingAddress}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2874F0] px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {savingAddress && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              )}
                              {savingAddress
                                ? "Saving Address..."
                                : "Save Address"}
                            </button>

                            {addresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewAddressForm(false);
                                  setAddressForm({ ...emptyAddressForm });
                                }}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment options */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2874F0]">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Payment Options
                    </h2>
                    <p className="text-xs text-gray-500">
                      Choose your preferred payment method.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("razorpay")}
                  disabled={placingOrder || razorpayProcessing}
                  className={`w-full rounded-xl border p-4 text-left transition sm:p-5 ${
                    paymentMethod === "razorpay"
                      ? "border-[#2874F0] bg-blue-50/70 ring-1 ring-[#2874F0]"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        paymentMethod === "razorpay"
                          ? "bg-blue-100 text-[#2874F0]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">
                          UPI & Online Payments
                        </p>
                        <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                          Recommended
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-5 text-gray-500">
                        Pay through Razorpay using available payment
                        methods.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          "UPI",
                          "Credit/Debit Card",
                          "Net Banking",
                          "Wallets",
                        ].map((method) => (
                          <span
                            key={method}
                            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === "razorpay"
                          ? "border-[#2874F0]"
                          : "border-gray-300"
                      }`}
                    >
                      {paymentMethod === "razorpay" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" />
                      )}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  disabled={placingOrder || razorpayProcessing}
                  className={`w-full rounded-xl border p-4 text-left transition sm:p-5 ${
                    paymentMethod === "stripe"
                      ? "border-[#2874F0] bg-blue-50/70 ring-1 ring-[#2874F0]"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        paymentMethod === "stripe"
                          ? "bg-blue-100 text-[#2874F0]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900">
                        Credit / Debit Card
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Secure card payment using Stripe.
                      </p>
                    </div>

                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === "stripe"
                          ? "border-[#2874F0]"
                          : "border-gray-300"
                      }`}
                    >
                      {paymentMethod === "stripe" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" />
                      )}
                    </span>
                  </div>
                </button>

                {paymentMethod === "stripe" && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:ml-14">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(event) =>
                          setSaveCard(event.target.checked)
                        }
                        disabled={placingOrder}
                        className="mt-1 h-4 w-4 accent-[#2874F0]"
                      />
                      <span>
                        <span className="font-semibold text-gray-800">
                          Save my card for future payments
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-gray-500">
                          Your card details are handled securely by
                          Stripe.
                        </span>
                      </span>
                    </label>

                    <div className="mt-4 border-t border-blue-100 pt-4">
                      <p className="text-sm font-bold text-gray-800">
                        Saved Cards
                      </p>

                      {loadingSavedCards ? (
                        <p className="mt-2 text-sm text-gray-500">
                          Loading saved cards...
                        </p>
                      ) : savedCards.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-500">
                          No saved cards found.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {savedCards.map((card) => (
                            <div
                              key={card.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="text-sm font-semibold capitalize text-gray-800">
                                    {card.brand} ending in {card.last4}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Expires{" "}
                                    {String(card.exp_month).padStart(2, "0")}
                                    /{card.exp_year}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="mt-3 text-xs leading-5 text-gray-500">
                        Saved cards are shown for reference. Selecting
                        a saved card for direct payment is not yet
                        supported by the current backend.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  disabled={placingOrder || razorpayProcessing}
                  className={`w-full rounded-xl border p-4 text-left transition sm:p-5 ${
                    paymentMethod === "cod"
                      ? "border-[#2874F0] bg-blue-50/70 ring-1 ring-[#2874F0]"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        paymentMethod === "cod"
                          ? "bg-blue-100 text-[#2874F0]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900">
                        Cash on Delivery
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Pay when your order arrives.
                      </p>
                    </div>

                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === "cod"
                          ? "border-[#2874F0]"
                          : "border-gray-300"
                      }`}
                    >
                      {paymentMethod === "cod" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" />
                      )}
                    </span>
                  </div>
                </button>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="flex items-start gap-2 text-xs leading-5 text-gray-500">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    Never share your card PIN or UPI PIN with anyone.
                    Payments are handled by the selected payment
                    provider.
                  </p>
                </div>
              </div>
            </div>

            {/* Order review */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2874F0]">
                    <Package className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Review Your Order
                    </h2>
                    <p className="text-xs text-gray-500">
                      Check products, sizes, options, and quantities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.items.map((item) => {
                  const variantImage =
                    item.variant?.images?.find(
                      (image) => image.is_primary
                    )?.image_url ??
                    item.variant?.images?.[0]?.image_url ??
                    null;

                  const productImage =
                    variantImage ?? item.product.image_url;

                  const itemPrice =
                    item.variant?.price ?? item.product.price;

                  const variantOptions =
                    item.variant?.option_values
                      ?.map((option) => option.value)
                      .filter(Boolean)
                      .join(" • ");

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-4 sm:gap-5 sm:p-5"
                    >
                      <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 sm:h-28 sm:w-24">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={item.product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold leading-5 text-gray-900 sm:text-base">
                          {item.product.name}
                        </p>

                        {variantOptions ? (
                          <p className="mt-2 text-xs text-gray-600">
                            Size / Options:{" "}
                            <span className="font-semibold text-gray-800">
                              {variantOptions}
                            </span>
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-gray-500">
                            Product variant as selected in your cart
                          </p>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                          Quantity:{" "}
                          <span className="font-semibold text-gray-800">
                            {item.quantity}
                          </span>
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-800">
                          ₹{itemPrice.toFixed(2)}{" "}
                          <span className="font-normal text-gray-500">
                            each
                          </span>
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-900">
                          Item total: ₹{item.item_total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 bg-gray-50 p-4 sm:p-5">
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2874F0] hover:underline"
                >
                  <Pencil className="h-4 w-4" />
                  Review or change cart
                </Link>
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Size, color, and other options are displayed when
                  provided by your cart data. Use your cart to change
                  products or quantities.
                </p>
              </div>
            </div>
          </section>

          {/* Price summary */}
          <aside className="min-w-0 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5">
                <h2 className="text-lg font-extrabold text-gray-900">
                  Price Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {cart.total_items} item(s) in your order
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium tabular-nums text-gray-900">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-green-700">
                      Coupon discount
                    </span>
                    <span className="font-semibold tabular-nums text-green-700">
                      −₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-600">Delivery charges</span>
                  <span className="font-semibold text-green-700">
                    FREE
                  </span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-gray-900">
                      Total Payable
                    </span>
                    <span className="text-xl font-extrabold tabular-nums text-gray-900">
                      ₹{finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <div>
                      <p className="text-sm font-bold text-green-800">
                        You saved ₹{discountAmount.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-green-700">
                        Coupon {appliedCoupon.code} applied
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div className="border-t border-gray-100 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#2874F0]" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Apply Coupon
                  </h3>
                </div>

                {appliedCoupon ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-green-800">
                          {appliedCoupon.code}
                        </p>
                        <p className="mt-1 text-xs text-green-700">
                          Saving ₹
                          {appliedCoupon.discount_amount.toFixed(2)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        disabled={couponLoading || placingOrder}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-green-300 bg-white px-2 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100 disabled:opacity-60"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleApplyCoupon();
                    }}
                    className="space-y-2"
                  >
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) =>
                        setCouponCode(event.target.value.toUpperCase())
                      }
                      placeholder="Enter coupon code"
                      disabled={couponLoading || placingOrder}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm uppercase outline-none focus:border-[#2874F0] focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="submit"
                      disabled={
                        couponLoading ||
                        placingOrder ||
                        !couponCode.trim()
                      }
                      className="w-full rounded-lg border border-[#2874F0] bg-white px-4 py-2.5 text-sm font-bold text-[#2874F0] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {couponLoading ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Applying Coupon...
                        </span>
                      ) : (
                        "Apply Coupon"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Delivery address summary */}
              <div className="border-t border-gray-100 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Delivering to
                </p>

                {selectedAddress ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2874F0]" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {selectedAddress.full_name}
                      </p>
                      <p className="mt-1 break-words text-xs leading-5 text-gray-600">
                        {selectedAddress.address_line},{" "}
                        {selectedAddress.city},{" "}
                        {selectedAddress.state}{" "}
                        {selectedAddress.postal_code}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedAddress.phone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Select a delivery address to continue.
                  </p>
                )}
              </div>

              {/* Selected payment summary */}
              <div className="border-t border-gray-100 bg-gray-50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Selected payment
                </p>

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#2874F0] shadow-sm">
                    {paymentMethod === "cod" ? (
                      <Banknote className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : paymentMethod === "razorpay"
                          ? "UPI / Online Payment"
                          : "Credit / Debit Card"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {paymentMethod === "cod"
                        ? "Pay upon delivery"
                        : paymentMethod === "razorpay"
                          ? "Processed through Razorpay"
                          : "Processed through Stripe"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden p-5 pt-0 lg:block">
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitDisabled}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2874F0] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder || razorpayProcessing ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : paymentMethod === "cod" ? (
                    <Truck className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}

                  {placingOrder
                    ? "Preparing Order..."
                    : razorpayProcessing
                      ? "Waiting for Payment..."
                      : paymentMethod === "cod"
                        ? "Place Order"
                        : "Continue to Payment"}
                </button>

                <p className="mt-3 text-center text-[11px] leading-5 text-gray-500">
                  By continuing, you agree to complete your order
                  using the selected payment method.
                </p>
              </div>
            </div>

            <div className="mt-4 hidden items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 lg:flex">
              <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Safe and Secure Shopping
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your checkout uses your selected payment provider
                  and ShopSphere order services.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-gray-500">Total Payable</p>
            <p className="truncate text-lg font-extrabold text-gray-900">
              ₹{finalAmount.toFixed(2)}
            </p>
            {appliedCoupon && (
              <p className="truncate text-[10px] font-semibold text-green-700">
                You save ₹{discountAmount.toFixed(2)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitDisabled}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2874F0] px-3 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {placingOrder || razorpayProcessing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}

            {placingOrder
              ? "Preparing..."
              : razorpayProcessing
                ? "Processing..."
                : paymentMethod === "cod"
                  ? "Place Order"
                  : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
