
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Package,
  Plus,
  Pencil,
  CreditCard,
  Tag,
  X,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ShoppingBag,
  ChevronRight,
  LoaderCircle,
  QrCode,
  Wallet,
  LockKeyhole,
  Gift,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  getCart,
  removeCartItem,
  updateCartItem,
  type CartData,
  type CartItem,
} from "@/services/cart";
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
  createSavedCardPaymentIntent,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getSavedCards,
  createRazorpayQr,
  getRazorpayQrStatus,
  type SavedCard,
  type RazorpayQrResponse,
} from "@/services/payments";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const BLUE = "#2874F0";
const BUY_NOW_STORAGE_KEY = "shopsphere-buy-now-checkout";
const CHECKOUT_IDEMPOTENCY_STORAGE_KEY = "shopsphere-checkout-idempotency";

function getCheckoutIdempotencyKey(signature: string): string {
  const stored = sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as {
        signature?: string;
        key?: string;
      };

      if (
        parsed.signature === signature &&
        typeof parsed.key === "string" &&
        parsed.key.length > 0
      ) {
        return parsed.key;
      }
    } catch {
      sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
    }
  }

  const key = crypto.randomUUID();
  sessionStorage.setItem(
    CHECKOUT_IDEMPOTENCY_STORAGE_KEY,
    JSON.stringify({ signature, key })
  );
  return key;
}

function clearCheckoutIdempotencyKey(): void {
  sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
}

type CheckoutPaymentOption = "stripe" | "razorpay" | "cod";
type RazorpayPaymentOption =
  | "upi"
  | "upi_qr"
  | "card"
  | "netbanking"
  | "wallet";

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
      modal?: { ondismiss?: () => void };
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      theme?: { color?: string };
      config?: {
        display?: {
          blocks?: {
            shopsphere?: {
              name: string;
              instruments: { method: string }[];
            };
          };
          sequence?: string[];
          preferences?: { show_default_blocks?: boolean };
        };
      };
    }) => {
      open: () => void;
      on: (
        event: string,
        callback: (response: {
          error?: { description?: string };
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

    const scriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
    const existingScript =
      document.querySelector<HTMLScriptElement>(
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
      if (window.Razorpay) resolve(true);
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
  clientSecret,
  selectedSavedCardId,
}: {
  onSuccess: () => Promise<void>;
  onCancel: () => Promise<void>;
  processing: boolean;
  clientSecret: string;
  selectedSavedCardId: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [paymentError, setPaymentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const paymentSubmitInProgress = useRef(false);

  async function handlePayment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !stripe ||
      (!selectedSavedCardId && !elements) ||
      paymentSubmitInProgress.current ||
      submitting ||
      processing
    ) {
      return;
    }

    paymentSubmitInProgress.current = true;
    setPaymentError("");
    setSubmitting(true);

    try {
      let paymentIntent;

      if (selectedSavedCardId) {
        const result = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: selectedSavedCardId }
        );

        if (result.error) {
          setPaymentError(
            result.error.message ||
              "Saved-card payment failed. Please try again."
          );
          return;
        }

        paymentIntent = result.paymentIntent;
      } else {
        const result = await stripe.confirmPayment({
          elements: elements!,
          redirect: "if_required",
        });

        if (result.error) {
          setPaymentError(
            result.error.message ||
              "Payment failed. Please try again."
          );
          return;
        }

        paymentIntent = result.paymentIntent;
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
      paymentSubmitInProgress.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handlePayment} className="space-y-5">
      {selectedSavedCardId ? (
        <div className="border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-[#2874F0]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Saved card selected
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Your payment will use your selected saved card.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white p-4 sm:p-6">
          <PaymentElement />
        </div>
      )}

      {paymentError && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {paymentError}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void onCancel()}
          disabled={processing || submitting}
          className="w-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={!stripe || processing || submitting}
          className="flex flex-1 items-center justify-center gap-2 bg-[#2874F0] px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
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

function SectionHeading({
  number,
  title,
  completed,
}: {
  number: string;
  title: string;
  completed?: boolean;
}) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 bg-white px-4 sm:px-6">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#f1f3f6] text-xs font-bold text-[#2874F0]">
        {completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          number
        )}
      </span>
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
        {title}
      </h2>
      {completed && (
        <span className="ml-auto text-xs font-semibold text-green-600">
          Completed
        </span>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();

  const initialLoadStarted = useRef(false);
  const orderSubmissionInProgress = useRef(false);
  const addressSaveInProgress = useRef(false);
  const couponValidationInProgress = useRef(false);
  const razorpayPaymentInProgress = useRef(false);
  const razorpayQrCreationInProgress = useRef(false);
  const qrStatusCheckInProgress = useRef(false);
  const paymentSuccessInProgress = useRef(false);

  const [cart, setCart] = useState<CartData | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<
    "all" | "cart-item" | "product" | null
  >(null);
  const [selectedCartItemId, setSelectedCartItemId] = useState<number | null>(
    null
  );
  const [buyNowProductItems, setBuyNowProductItems] = useState<CartItem[]>([]);
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
    useState<CheckoutPaymentOption>("razorpay");
  const [razorpayMethod, setRazorpayMethod] =
    useState<RazorpayPaymentOption>("upi_qr");

  const [razorpayQr, setRazorpayQr] =
    useState<RazorpayQrResponse | null>(null);
  const [qrOrderId, setQrOrderId] = useState<number | null>(null);
  const [qrChecking, setQrChecking] = useState(false);
  const [qrError, setQrError] = useState("");

  const [saveCard, setSaveCard] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);
  const [selectedSavedCardId, setSelectedSavedCardId] =
    useState<string | null>(null);

  const [addressForm, setAddressForm] =
    useState<AddressCreateData>({ ...emptyAddressForm });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResponse | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      setLoadingCart(true);
      setCart(await getCart());
    } catch (error) {
      console.error("Failed to load cart:", error);
      await Swal.fire({
        icon: "error",
        title: "Unable to Load Cart",
        text: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoadingCart(false);
    }
  }, []);

  const loadAddresses = useCallback(async () => {
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
        text: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;

    const query = new URLSearchParams(window.location.search);
    const cartItemId = Number(query.get("buyNow"));
    if (Number.isInteger(cartItemId) && cartItemId > 0) {
      setCheckoutMode("cart-item");
      setSelectedCartItemId(cartItemId);
    } else if (query.get("mode") === "buy-now") {
      try {
        const savedCheckout = sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
        const items = savedCheckout
          ? (JSON.parse(savedCheckout) as { items?: CartItem[] }).items
          : null;

        if (items?.length) {
          setBuyNowProductItems(items);
        }
        setCheckoutMode("product");
      } catch (error) {
        console.error("Unable to restore Buy Now product:", error);
        setCheckoutMode("product");
      }
    } else {
      setCheckoutMode("all");
      sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
    }

    void loadCart();
    void loadAddresses();
  }, [loadCart, loadAddresses]);

  useEffect(() => {
    if (paymentMethod !== "stripe") return;

    let active = true;

    async function loadCards() {
      try {
        setLoadingSavedCards(true);
        const cards = await getSavedCards();

        if (active) {
          setSavedCards(cards);
        }
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

  const checkoutItems = useMemo(() => {
    if (checkoutMode === "product") return buyNowProductItems;
    if (!cart || checkoutMode === null) return [];
    if (checkoutMode === "cart-item") {
      return cart.items.filter((item) => item.id === selectedCartItemId);
    }
    return cart.items;
  }, [buyNowProductItems, cart, checkoutMode, selectedCartItemId]);

  const checkoutItemCount = useMemo(
    () => checkoutItems.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [checkoutItems]
  );

  const subtotal = useMemo(
    () =>
      checkoutItems.reduce(
        (total, item) =>
          total + Number(item.item_total ?? Number(item.product.price || 0) * item.quantity),
        0
      ),
    [checkoutItems]
  );

  const discountAmount = appliedCoupon?.discount_amount ?? 0;
  const finalAmount = Math.max(subtotal - discountAmount, 0);

  const removePurchasedCartItems = useCallback(async (): Promise<boolean> => {
    const cartItemsToUpdate =
      checkoutMode === "product"
        ? checkoutItems.flatMap((purchasedItem) =>
            (cart?.items ?? [])
              .filter(
                (cartItem) =>
                  cartItem.product_id === purchasedItem.product_id &&
                  cartItem.variant_id === purchasedItem.variant_id
              )
              .map((cartItem) => ({
                itemId: cartItem.id,
                remainingQuantity:
                  cartItem.quantity - purchasedItem.quantity,
              }))
          )
        : checkoutItems
            .filter((item) => item.id > 0)
            .map((item) => ({
              itemId: item.id,
              remainingQuantity: 0,
            }));
    const failedIds: number[] = [];

    for (const item of cartItemsToUpdate) {
      try {
        if (item.remainingQuantity > 0) {
          await updateCartItem(item.itemId, item.remainingQuantity);
        } else {
          await removeCartItem(item.itemId);
        }
      } catch (error) {
        failedIds.push(item.itemId);
        console.error(
          `Unable to update purchased cart item ${item.itemId}:`,
          error
        );
      }
    }

    try {
      sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
    } catch (error) {
      console.error("Unable to clear selected checkout item state:", error);
    }
    if (failedIds.length > 0) {
      console.error("Some purchased items could not be removed from cart:", failedIds);
      return false;
    }
    return true;
  }, [cart, checkoutItems, checkoutMode]);

  function handleAddressChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;
    setAddressForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleCreateAddress(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (addressSaveInProgress.current) return;

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

    addressSaveInProgress.current = true;

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

      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses);
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
        text: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      addressSaveInProgress.current = false;
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
    if (couponValidationInProgress.current || couponLoading) return;

    if (!cart || !couponCode.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Enter Coupon Code",
        text: "Please enter a coupon code.",
      });
      return;
    }

    couponValidationInProgress.current = true;

    try {
      setCouponLoading(true);
      const coupon = await validateCoupon(couponCode.trim(), subtotal);
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
        text: error instanceof Error ? error.message : "Unable to apply coupon.",
      });
    } finally {
      couponValidationInProgress.current = false;
      setCouponLoading(false);
    }
  }

  async function handleRazorpayPayment(
    orderId: number,
    method: "upi" | "card" | "netbanking" | "wallet"
  ) {
    if (razorpayPaymentInProgress.current || razorpayProcessing) return;

    razorpayPaymentInProgress.current = true;
    setRazorpayProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay Checkout. Check your internet connection and try again."
        );
      }

      const RazorpayCheckout = window.Razorpay;
      const razorpayOrder = await createRazorpayOrder({ order_id: orderId });

      await new Promise<void>((resolve, reject) => {
        let completed = false;
        let verificationStarted = false;

        function finish(error?: Error) {
          if (completed) return;
          completed = true;
          if (error) reject(error);
          else resolve();
        }

        const selectedMethodLabel =
          method === "netbanking"
            ? "Net Banking"
            : method === "wallet"
              ? "Wallet"
              : method === "card"
                ? "Card"
                : "UPI";

        const checkout = new RazorpayCheckout({
          key: razorpayOrder.key_id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "ShopSphere",
          description: `${selectedMethodLabel} payment for Order #${orderId}`,
          order_id: razorpayOrder.razorpay_order_id,
          theme: { color: BLUE },
          config: {
            display: {
              blocks: {
                shopsphere: {
                  name: selectedMethodLabel,
                  instruments: [{ method }],
                },
              },
              sequence: ["block.shopsphere"],
              preferences: { show_default_blocks: false },
            },
          },
          handler: async (result) => {
            if (verificationStarted || completed) return;
            verificationStarted = true;

            try {
              const verification = await verifyRazorpayPayment({
                order_id: orderId,
                razorpay_order_id: result.razorpay_order_id,
                razorpay_payment_id: result.razorpay_payment_id,
                razorpay_signature: result.razorpay_signature,
              });

              if (
                (verification as { verified?: boolean }).verified !== true
              ) {
                throw new Error(
                  "Payment has not been verified. Check My Orders before trying again."
                );
              }

              clearCheckoutIdempotencyKey();
              await removePurchasedCartItems();

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
                  "Razorpay Checkout was closed. Check My Orders before trying again."
                )
              );
            },
          },
        });

        checkout.on("payment.failed", (result) => {
          finish(
            new Error(
              result.error?.description || "Razorpay payment failed."
            )
          );
        });

        checkout.open();
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Payment Not Confirmed",
        text: error instanceof Error ? error.message : "Check My Orders before trying again.",
      });
    } finally {
      razorpayPaymentInProgress.current = false;
      setRazorpayProcessing(false);
    }
  }

  async function handleRazorpayQrPayment(orderId: number) {
    if (razorpayQrCreationInProgress.current) return;

    razorpayQrCreationInProgress.current = true;
    setQrError("");
    setRazorpayQr(null);
    setQrOrderId(null);

    try {
      const qr = await createRazorpayQr({ order_id: orderId });

      if (!qr.image_url) {
        throw new Error(
          "Razorpay did not return a QR image. Check My Orders before starting another payment."
        );
      }

      setRazorpayQr(qr);
      setQrOrderId(orderId);
    } catch (error) {
      setQrError(
        error instanceof Error ? error.message : "Unable to create the UPI QR code."
      );
      throw error;
    } finally {
      razorpayQrCreationInProgress.current = false;
    }
  }

  useEffect(() => {
    if (!razorpayQr || qrOrderId === null) return;

    let active = true;
    let finished = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function checkQrPayment() {
      if (
        !active ||
        qrStatusCheckInProgress.current ||
        finished ||
        qrOrderId === null
      ) {
        return;
      }

      qrStatusCheckInProgress.current = true;

      try {
        const result = await getRazorpayQrStatus({ order_id: qrOrderId });

        if (
          active &&
          result.verified === true &&
          result.payment_status === "paid"
        ) {
          finished = true;
          if (timer) clearInterval(timer);

          clearCheckoutIdempotencyKey();
          await removePurchasedCartItems();

          if (!active) return;

          await Swal.fire({
            icon: "success",
            title: "Payment Successful",
            text: `Your order #${qrOrderId} has been confirmed.`,
            confirmButtonText: "View Orders",
          });

          if (active) router.push("/orders");
        }
      } catch (error) {
        console.error("Unable to check Razorpay QR payment status:", error);
      } finally {
        qrStatusCheckInProgress.current = false;
      }
    }

    setQrChecking(true);
    void checkQrPayment();
    timer = setInterval(() => void checkQrPayment(), 3000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      setQrChecking(false);
    };
  }, [razorpayQr, qrOrderId, router, removePurchasedCartItems]);

  async function handleSubmit() {
    if (
      orderSubmissionInProgress.current ||
      placingOrder ||
      paymentProcessing ||
      razorpayProcessing
    ) {
      return;
    }

    if (!cart || checkoutMode === null || checkoutItems.length === 0) {
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
        text: "Please select a delivery address before placing your order.",
      });
      return;
    }

    orderSubmissionInProgress.current = true;

    // Keep one attempt ID for refreshes/retries of this checkout URL, but use a
    // new attempt ID whenever the customer starts a new checkout from the cart
    // or product page. Checkout entry points should add ?attempt=<UUID>.
    const checkoutQuery = new URLSearchParams(window.location.search);
    let checkoutAttemptId = checkoutQuery.get("attempt");

    if (!checkoutAttemptId) {
      const attemptStorageKey = "shopsphere-current-checkout-attempt";
      checkoutAttemptId = sessionStorage.getItem(attemptStorageKey);

      if (!checkoutAttemptId) {
        checkoutAttemptId = crypto.randomUUID();
        sessionStorage.setItem(attemptStorageKey, checkoutAttemptId);
      }
    } else {
      sessionStorage.setItem(
        "shopsphere-current-checkout-attempt",
        checkoutAttemptId
      );
    }

    const checkoutSignature = JSON.stringify({
      checkoutAttemptId,
      checkoutMode,
      items: checkoutItems
        .map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
        }))
        .sort((a, b) =>
          `${a.product_id}:${a.variant_id ?? ""}`.localeCompare(
            `${b.product_id}:${b.variant_id ?? ""}`
          )
        ),
      shipping_address: createShippingAddress(selectedAddress),
      coupon_code: appliedCoupon?.code?.trim().toUpperCase() ?? null,
    });

    try {
      setPlacingOrder(true);
      const idempotencyKey = getCheckoutIdempotencyKey(checkoutSignature);

      const orderPaymentMethod: PaymentMethod =
        paymentMethod === "stripe"
          ? "stripe"
          : paymentMethod === "cod"
            ? "cod"
            : "razorpay";

      const orderData = {
        shipping_address: createShippingAddress(selectedAddress),
        items: checkoutItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        coupon_code: appliedCoupon?.code,
        payment_method: orderPaymentMethod,
      };

      let order = await createOrder({
        ...orderData,
        idempotency_key: idempotencyKey,
      });

      // Never try to collect payment for an order that has already been cancelled.
      // If a stale idempotency key resolves to a cancelled order, rotate the key
      // and make one fresh order-creation request instead.
      const normalizedOrderStatus = String(order.status ?? "")
        .trim()
        .toLowerCase();

      if (
        normalizedOrderStatus === "cancelled" ||
        normalizedOrderStatus === "canceled"
      ) {
        clearCheckoutIdempotencyKey();
        const freshIdempotencyKey = getCheckoutIdempotencyKey(checkoutSignature);

        order = await createOrder({
          ...orderData,
          idempotency_key: freshIdempotencyKey,
        });

        const retryOrderStatus = String(order.status ?? "")
          .trim()
          .toLowerCase();

        if (
          retryOrderStatus === "cancelled" ||
          retryOrderStatus === "canceled"
        ) {
          throw new Error(
            "The previous order is cancelled and a new order could not be created. Please check My Orders before trying again."
          );
        }
      }

      if (paymentMethod === "cod") {
        clearCheckoutIdempotencyKey();
        await removePurchasedCartItems();

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
        if (razorpayMethod === "upi_qr") {
          await handleRazorpayQrPayment(order.id);
        } else {
          await handleRazorpayPayment(order.id, razorpayMethod);
        }
        return;
      }

      const payment = selectedSavedCardId
        ? await createSavedCardPaymentIntent({
            order_id: order.id,
            payment_method_id: selectedSavedCardId,
          })
        : await createPaymentIntent({
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
      orderSubmissionInProgress.current = false;
      setPlacingOrder(false);
    }
  }

  async function handlePaymentSuccess() {
    if (paymentOrderId === null || paymentSuccessInProgress.current) return;

    paymentSuccessInProgress.current = true;
    const orderId = paymentOrderId;
    setPaymentProcessing(true);

    try {
      const order = await getOrder(orderId);

      if (order.payment_status !== "paid") {
        await Swal.fire({
          icon: "info",
          title: "Payment Confirmation Pending",
          text:
            "Your payment has not been confirmed yet. Your cart has been preserved. Please check My Orders before attempting another payment.",
          confirmButtonText: "View Orders",
        });

        router.push("/orders");
        return;
      }

      clearCheckoutIdempotencyKey();
      await removePurchasedCartItems();

      await Swal.fire({
        icon: "success",
        title: "Payment Successful",
        text: `Your order #${orderId} has been confirmed.`,
        confirmButtonText: "View Orders",
      });

      router.push("/orders");
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      await Swal.fire({
        icon: "warning",
        title: "Payment Status Could Not Be Verified",
        text:
          "We could not verify your payment status. Please check My Orders before attempting another payment. Your cart has been preserved.",
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
        // The next purchase must receive a fresh key after successful cancellation.
        clearCheckoutIdempotencyKey();
      }

      setPaymentClientSecret(null);
      setPaymentOrderId(null);
      setSelectedSavedCardId(null);
      paymentSuccessInProgress.current = false;

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
        text: error instanceof Error ? error.message : "Check My Orders before trying again.",
      });
    } finally {
      setPaymentProcessing(false);
    }
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
    checkoutItems.length === 0 ||
    selectedAddressId === null ||
    showNewAddressForm;

  const razorpayMethodLabel =
    razorpayMethod === "upi"
      ? "UPI"
      : razorpayMethod === "upi_qr"
        ? "UPI QR Code"
        : razorpayMethod === "card"
          ? "Cards"
          : razorpayMethod === "netbanking"
            ? "Net Banking"
            : "Wallets";

  const submitButtonLabel = placingOrder
    ? "Preparing Order..."
    : razorpayProcessing
      ? "Waiting for Payment..."
      : paymentMethod === "cod"
        ? "Place Order"
        : paymentMethod === "stripe"
          ? "Continue to Stripe"
          : razorpayMethod === "upi_qr"
            ? "Generate UPI QR"
            : `Continue to Razorpay ${razorpayMethodLabel}`;

  if (loadingCart) {
    return (
      <main className="min-h-screen bg-[#f1f3f6]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="bg-white p-12 text-center shadow-sm">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#2874F0]" />
            <p className="mt-4 text-sm text-gray-600">
              Loading your checkout...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (paymentClientSecret && paymentOrderId !== null) {
    return (
      <main className="min-h-screen bg-[#f1f3f6]">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="overflow-hidden bg-white shadow-sm">
            <div className="bg-[#2874F0] p-5 text-white sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
                ShopSphere Secure Payment
              </p>
              <h1 className="mt-2 text-2xl font-bold">
                Complete Your Payment
              </h1>
              <p className="mt-2 text-sm text-blue-100">
                Order #{paymentOrderId}
              </p>
            </div>

            <div className="p-5 sm:p-7">
              <Elements
                key={`${paymentOrderId}-${selectedSavedCardId ?? "new-card"}`}
                stripe={stripePromise}
                options={{
                  clientSecret: paymentClientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: BLUE,
                      borderRadius: "4px",
                    },
                  },
                }}
              >
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancelPayment}
                  processing={paymentProcessing}
                  clientSecret={paymentClientSecret}
                  selectedSavedCardId={selectedSavedCardId}
                />
              </Elements>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (razorpayQr && qrOrderId !== null) {
    return (
      <main className="min-h-screen bg-[#f1f3f6]">
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="overflow-hidden bg-white shadow-sm">
            <div className="bg-[#2874F0] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
                Secure UPI Payment
              </p>
              <h1 className="mt-2 text-2xl font-bold">Scan and Pay</h1>
              <p className="mt-2 text-sm text-blue-100">
                Order #{qrOrderId}
              </p>
            </div>

            <div className="p-5 text-center sm:p-7">
              <p className="text-sm leading-6 text-gray-600">
                Scan this QR code using your UPI app and complete the payment.
              </p>

              <div className="mx-auto mt-5 flex min-h-64 max-w-72 items-center justify-center border border-gray-200 p-4">
                {razorpayQr.image_url ? (
                  <img
                    src={razorpayQr.image_url}
                    alt="Razorpay UPI payment QR code"
                    className="h-56 w-56 object-contain"
                  />
                ) : (
                  <p className="text-sm text-red-600">
                    QR image is unavailable.
                  </p>
                )}
              </div>

              <p className="mt-5 text-2xl font-extrabold text-gray-900">
                ₹{(razorpayQr.amount / 100).toFixed(2)}
              </p>

              <div className="mt-5 bg-blue-50 p-4 text-left">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#2874F0]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {qrChecking
                    ? "Waiting for payment confirmation..."
                    : "Checking payment status..."}
                </p>
                <p className="mt-2 text-xs leading-5 text-gray-600">
                  Keep this page open while ShopSphere checks the payment status.
                </p>
              </div>

              {qrError && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {qrError}
                </p>
              )}

              <button
                type="button"
                onClick={() => router.push("/orders")}
                className="mt-5 w-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Check My Orders
              </button>

              <p className="mt-4 text-xs text-gray-500">
                Never share your UPI PIN with anyone.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || checkoutItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f1f3f6]">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center bg-blue-50">
              <ShoppingBag className="h-10 w-10 text-[#2874F0]" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              {(checkoutMode === "cart-item" || checkoutMode === "product") &&
              checkoutMode !== null &&
              cart?.items.length
                ? "Selected Item Is No Longer Available"
                : "Your Cart Is Empty"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {(checkoutMode === "cart-item" || checkoutMode === "product") &&
              checkoutMode !== null &&
              cart?.items.length
                ? "Please return to your cart and choose an available item to purchase."
                : "Your next favourite purchase is waiting for you."}
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center gap-2 bg-[#2874F0] px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Continue Shopping
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f3f6] pb-24">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#2874F0]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/cart" className="hover:text-[#2874F0]">Cart</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-gray-800">Checkout</span>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-3">
            <div className="overflow-hidden bg-white shadow-sm">
              <SectionHeading
                number="1"
                title="Delivery Address"
                completed={Boolean(selectedAddress)}
              />

              <div className="border-t border-gray-100 p-4 sm:p-5">
                {loadingAddresses ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading saved addresses...
                  </div>
                ) : (
                  <>
                    {addresses.length === 0 && !showNewAddressForm && (
                      <p className="text-sm text-gray-500">
                        Add a delivery address to continue.
                      </p>
                    )}

                    <div className="space-y-3">
                      {addresses.map((address) => {
                        const isSelected = selectedAddressId === address.id;

                        return (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() => setSelectedAddressId(address.id)}
                            disabled={placingOrder}
                            className={`w-full border p-3 text-left transition sm:p-4 ${
                              isSelected
                                ? "border-[#2874F0] bg-[#f5f9ff]"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-[#2874F0]"
                                    : "border-gray-400"
                                }`}
                              >
                                {isSelected && (
                                  <span className="h-2 w-2 rounded-full bg-[#2874F0]" />
                                )}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900">
                                    {address.full_name}
                                  </span>
                                  <span className="bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                                    {address.address_type}
                                  </span>
                                  {address.is_default && (
                                    <span className="bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 break-words text-sm leading-5 text-gray-600">
                                  {address.address_line}, {address.city},{" "}
                                  {address.state} - {address.postal_code}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Phone: {address.phone}
                                </p>
                              </div>

                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2874F0]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {addresses.length > 0 && (
                      <Link
                        href="/addresses"
                        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#2874F0] hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Manage saved addresses
                      </Link>
                    )}

                    {!showNewAddressForm && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(true)}
                        className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-[#2874F0] px-4 py-3 text-sm font-semibold text-[#2874F0] hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4" />
                        Add a New Address
                      </button>
                    )}

                    {showNewAddressForm && (
                      <div className="mt-4 border border-gray-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">
                              Add Delivery Address
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                              Enter the complete delivery details.
                            </p>
                          </div>

                          {addresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewAddressForm(false);
                                setAddressForm({ ...emptyAddressForm });
                              }}
                              aria-label="Close address form"
                              className="p-2 text-gray-500 hover:bg-gray-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <form onSubmit={handleCreateAddress} className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label htmlFor="full_name" className="mb-1 block text-xs font-semibold text-gray-700">
                                Full Name
                              </label>
                              <input
                                id="full_name"
                                name="full_name"
                                value={addressForm.full_name}
                                onChange={handleAddressChange}
                                required
                                minLength={2}
                                placeholder="Full name"
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#2874F0]"
                              />
                            </div>
                            <div>
                              <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-gray-700">
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
                                placeholder="Phone number"
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#2874F0]"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="address_line" className="mb-1 block text-xs font-semibold text-gray-700">
                              House No., Building, Street, Area
                            </label>
                            <textarea
                              id="address_line"
                              name="address_line"
                              value={addressForm.address_line}
                              onChange={handleAddressChange}
                              required
                              minLength={5}
                              rows={2}
                              placeholder="Complete address"
                              className="w-full resize-y border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#2874F0]"
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label htmlFor="city" className="mb-1 block text-xs font-semibold text-gray-700">
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
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#2874F0]"
                              />
                            </div>
                            <div>
                              <label htmlFor="state" className="mb-1 block text-xs font-semibold text-gray-700">
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
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#2874F0]"
                              />
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label htmlFor="postal_code" className="mb-1 block text-xs font-semibold text-gray-700">
                                PIN Code
                              </label>
                              <input
                                id="postal_code"
                                name="postal_code"
                                value={addressForm.postal_code}
                                onChange={handleAddressChange}
                                required
                                minLength={3}
                                placeholder="PIN code"
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#2874F0]"
                              />
                            </div>
                            <div>
                              <label htmlFor="address_type" className="mb-1 block text-xs font-semibold text-gray-700">
                                Address Type
                              </label>
                              <select
                                id="address_type"
                                name="address_type"
                                value={addressForm.address_type}
                                onChange={handleAddressChange}
                                className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2874F0]"
                              >
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-gray-600">
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

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="submit"
                              disabled={savingAddress || addressSaveInProgress.current}
                              className="flex flex-1 items-center justify-center gap-2 bg-[#2874F0] px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {savingAddress && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              )}
                              {savingAddress ? "Saving..." : "Save Address"}
                            </button>

                            {addresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewAddressForm(false);
                                  setAddressForm({ ...emptyAddressForm });
                                }}
                                className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
            <div className="overflow-hidden bg-white shadow-sm">
              <SectionHeading number="2" title="Payment Options" />
              <div className="border-t border-gray-100">
                {/* Stripe */}
                <div className={`border-b border-gray-100 ${paymentMethod === "stripe" ? "bg-[#f5f9ff]" : "bg-white"}`}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    disabled={placingOrder || paymentProcessing || razorpayProcessing}
                    aria-pressed={paymentMethod === "stripe"}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-50 disabled:opacity-60 sm:px-6"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${paymentMethod === "stripe" ? "border-[#2874F0]" : "border-gray-400"}`}>
                      {paymentMethod === "stripe" && <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" />}
                    </span>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${paymentMethod === "stripe" ? "bg-blue-100 text-[#2874F0]" : "bg-gray-100 text-gray-600"}`}>
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">Stripe</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        Secure online payment with your card.
                      </span>
                    </span>
                    {paymentMethod === "stripe" && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2874F0]" />}
                  </button>

                  {paymentMethod === "stripe" && (
                    <div className="border-t border-blue-100 px-4 py-4 sm:px-6 sm:pl-[88px]">
                      <label className="flex items-start gap-3 text-xs">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(event) => setSaveCard(event.target.checked)}
                          disabled={placingOrder || selectedSavedCardId !== null}
                          className="mt-0.5 h-4 w-4 accent-[#2874F0]"
                        />
                        <span>
                          <span className="font-semibold text-gray-800">
                            Save my card for future payments
                          </span>
                          <span className="mt-1 block text-gray-500">
                            Save your card securely for your next purchase.
                          </span>
                        </span>
                      </label>

                      <div className="mt-4 border-t border-blue-100 pt-4">
                        <p className="text-xs font-bold text-gray-800">Saved Cards</p>

                        {loadingSavedCards ? (
                          <p className="mt-2 text-xs text-gray-500">Loading saved cards...</p>
                        ) : savedCards.length === 0 ? (
                          <p className="mt-2 text-xs text-gray-500">No saved cards found.</p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {savedCards.map((card) => {
                              const cardId = String(card.id);
                              const selected = selectedSavedCardId === cardId;

                              return (
                                <button
                                  key={cardId}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSavedCardId(selected ? null : cardId);
                                    setSaveCard(false);
                                  }}
                                  disabled={placingOrder || paymentProcessing}
                                  aria-pressed={selected}
                                  className={`flex w-full items-center gap-3 border p-3 text-left transition disabled:opacity-60 ${
                                    selected
                                      ? "border-[#2874F0] bg-white ring-1 ring-[#2874F0]"
                                      : "border-gray-200 bg-white hover:border-blue-300"
                                  }`}
                                >
                                  <CreditCard className="h-5 w-5 shrink-0 text-gray-500" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-semibold capitalize text-gray-800">
                                      {card.brand} ending in {card.last4}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-gray-500">
                                      Expires {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                                    </span>
                                  </span>
                                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#2874F0]" : "border-gray-300"}`}>
                                    {selected && <span className="h-2 w-2 rounded-full bg-[#2874F0]" />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {selectedSavedCardId && (
                          <button
                            type="button"
                            onClick={() => setSelectedSavedCardId(null)}
                            disabled={placingOrder || paymentProcessing}
                            className="mt-3 text-xs font-semibold text-[#2874F0] hover:underline disabled:opacity-60"
                          >
                            Use a new card instead
                          </button>
                        )}

                        <p className="mt-3 text-[11px] leading-5 text-gray-500">
                          Select a saved card to use it, or leave all cards unselected to enter new card details.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Razorpay */}
                <div className={`border-b border-gray-100 ${paymentMethod === "razorpay" ? "bg-[#f5f9ff]" : "bg-white"}`}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("razorpay")}
                    disabled={placingOrder || paymentProcessing || razorpayProcessing}
                    aria-pressed={paymentMethod === "razorpay"}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-50 disabled:opacity-60 sm:px-6"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${paymentMethod === "razorpay" ? "border-[#2874F0]" : "border-gray-400"}`}>
                      {paymentMethod === "razorpay" && <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" />}
                    </span>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${paymentMethod === "razorpay" ? "bg-blue-100 text-[#2874F0]" : "bg-gray-100 text-gray-600"}`}>
                      <Wallet className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">Razorpay</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        UPI, QR Code, Cards, Net Banking, and Wallets.
                      </span>
                    </span>
                    {paymentMethod === "razorpay" && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2874F0]" />}
                  </button>

                  {paymentMethod === "razorpay" && (
                    <div className="border-t border-blue-100 px-4 py-4 sm:px-6 sm:pl-[88px]">
                      <p className="mb-3 text-xs font-bold text-gray-800">
                        Choose a Razorpay payment method
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {([
                          
                          { id: "upi_qr", title: "UPI QR Code", description: "Scan a QR code to pay", icon: QrCode },
                          { id: "card", title: "Credit / Debit Cards", description: "Pay with a card", icon: CreditCard },
                          { id: "netbanking", title: "Net Banking", description: "Pay through your bank", icon: ShieldCheck },
                          { id: "wallet", title: "Wallets", description: "Use an available wallet", icon: Wallet },
                        ] as const).map((option) => {
                          const Icon = option.icon;
                          const selected = razorpayMethod === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setRazorpayMethod(option.id)}
                              disabled={placingOrder || paymentProcessing || razorpayProcessing}
                              aria-pressed={selected}
                              className={`flex items-start gap-3 border p-3 text-left transition disabled:opacity-60 ${selected ? "border-[#2874F0] bg-white ring-1 ring-[#2874F0]" : "border-gray-200 bg-white hover:border-blue-300"}`}
                            >
                              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center ${selected ? "bg-blue-50 text-[#2874F0]" : "bg-gray-100 text-gray-600"}`}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold text-gray-900">{option.title}</span>
                                <span className="mt-1 block text-[11px] leading-4 text-gray-500">{option.description}</span>
                              </span>
                              <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#2874F0]" : "border-gray-300"}`}>
                                {selected && <span className="h-2 w-2 rounded-full bg-[#2874F0]" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {razorpayMethod === "upi_qr" ? (
                        <div className="mt-3 flex items-start gap-2 bg-blue-50 p-3">
                          <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-[#2874F0]" />
                          <p className="text-xs leading-5 text-gray-600">
                            A QR code will be generated after you continue. Scan it with your UPI app and keep this page open while payment is verified.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-start gap-2 bg-blue-50 p-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2874F0]" />
                          <p className="text-xs leading-5 text-gray-600">
                            Razorpay Checkout will open for {razorpayMethodLabel}. Available payment instruments depend on your Razorpay account and checkout configuration.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cash on Delivery */}
                <div className={`border-b border-gray-100 ${paymentMethod === "cod" ? "bg-[#f5f9ff]" : "bg-white"}`}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    disabled={placingOrder || paymentProcessing || razorpayProcessing}
                    aria-pressed={paymentMethod === "cod"}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-50 disabled:opacity-60 sm:px-6"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${paymentMethod === "cod" ? "border-[#2874F0]" : "border-gray-400"}`}>
                      {paymentMethod === "cod" && <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" />}
                    </span>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${paymentMethod === "cod" ? "bg-blue-100 text-[#2874F0]" : "bg-gray-100 text-gray-600"}`}>
                      <Truck className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">Cash on Delivery</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        Pay when your order is delivered.
                      </span>
                    </span>
                    {paymentMethod === "cod" && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2874F0]" />}
                  </button>
                  {paymentMethod === "cod" && (
                    <div className="border-t border-blue-100 px-4 py-3 sm:px-6 sm:pl-[88px]">
                      <p className="text-xs leading-5 text-gray-600">
                        Place your order now and pay when it arrives.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <p className="text-[11px] leading-5 text-gray-500">
                    Never share your card PIN or UPI PIN. Payments are processed through your selected payment provider.
                  </p>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div className="overflow-hidden bg-white shadow-sm">
              <SectionHeading number="3" title={`Order Summary (${checkoutItemCount} items)`} />
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {checkoutItems.map((item) => {
                  const variantImage =
                    item.variant?.images?.find((image) => image.is_primary)?.image_url ??
                    item.variant?.images?.[0]?.image_url ??
                    null;
                  const productImage = variantImage ?? item.product.image_url;
                  const itemPrice = item.variant?.price ?? item.product.price;
                  const variantOptions = item.variant?.option_values
                    ?.map((option) => option.value)
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <div key={item.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                      <div className="flex h-24 w-20 shrink-0 items-center justify-center border border-gray-100 bg-gray-50 sm:h-28 sm:w-24">
                        {productImage ? (
                          <img src={productImage} alt={item.product.name} className="h-full w-full object-contain p-1" />
                        ) : (
                          <Package className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
                          {item.product.name}
                        </p>
                        {variantOptions && (
                          <p className="mt-2 text-xs text-gray-500">
                            Options: <span className="font-semibold text-gray-700">{variantOptions}</span>
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="mt-2 text-sm font-bold text-gray-900">
                          ₹{itemPrice.toFixed(2)} <span className="font-normal text-gray-500">each</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Item total: ₹{item.item_total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
                <Link href="/cart" className="inline-flex items-center gap-2 text-xs font-semibold text-[#2874F0] hover:underline">
                  <Pencil className="h-3.5 w-3.5" />
                  Change items or quantities in cart
                </Link>
              </div>
            </div>
          </section>

          {/* Price details */}
          <aside className="min-w-0 lg:sticky lg:top-20">
            <div className="overflow-hidden bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Price Details</h2>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-600">Price ({checkoutItemCount} items)</span>
                  <span className="tabular-nums text-gray-800">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600">Coupon discount</span>
                    <span className="font-semibold tabular-nums text-green-600">−₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-gray-900">Total Payable</span>
                    <span className="text-lg font-extrabold tabular-nums text-gray-900">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
                {appliedCoupon && (
                  <div className="flex items-start gap-2 border border-green-200 bg-green-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <div>
                      <p className="text-xs font-bold text-green-800">Coupon applied successfully</p>
                      <p className="mt-1 text-xs text-green-700">You saved ₹{discountAmount.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div className="border-t border-gray-100 p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setShowCouponForm((value) => !value)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-50 text-[#2874F0]">
                    <Tag className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800">Apply Coupon</span>
                    <span className="mt-1 block text-xs text-gray-500">Save more on your order</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition ${showCouponForm ? "rotate-180" : ""}`} />
                </button>

                {appliedCoupon ? (
                  <div className="mt-3 border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-green-800">{appliedCoupon.code}</p>
                        <p className="mt-1 text-xs text-green-700">
                          Saving ₹{appliedCoupon.discount_amount.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        disabled={couponLoading || placingOrder}
                        className="flex shrink-0 items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : showCouponForm ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleApplyCoupon();
                    }}
                    className="mt-3 space-y-2"
                  >
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      disabled={couponLoading || placingOrder}
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-[#2874F0]"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || placingOrder || !couponCode.trim()}
                      className="w-full border border-[#2874F0] bg-white px-4 py-2.5 text-sm font-bold text-[#2874F0] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {couponLoading ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Applying...
                        </span>
                      ) : "Apply Coupon"}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCouponForm(true)}
                    className="mt-3 w-full border border-gray-200 px-3 py-2.5 text-xs font-semibold text-[#2874F0] hover:bg-blue-50"
                  >
                    Enter Coupon Code
                  </button>
                )}
              </div>

              {/* Selected address */}
              <div className="border-t border-gray-100 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Delivering To</p>
                  <MapPin className="h-4 w-4 text-[#2874F0]" />
                </div>
                {selectedAddress ? (
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedAddress.full_name}</p>
                    <p className="mt-1 break-words text-xs leading-5 text-gray-600">
                      {selectedAddress.address_line}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{selectedAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Select a delivery address to continue.</p>
                )}
                <Link href="/addresses" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2874F0] hover:underline">
                  Change Address <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Place order */}
              <div className="border-t border-gray-100 p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitDisabled || orderSubmissionInProgress.current}
                  className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#fb641b] px-4 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#e85a15] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder || razorpayProcessing ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : paymentMethod === "cod" ? (
                    <Truck className="h-4 w-4" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" />
                  )}
                  {submitButtonLabel}
                </button>
                <p className="mt-3 text-center text-[11px] leading-5 text-gray-500">
                  By continuing, you agree to complete your order using the selected payment method.
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3 bg-white p-4 shadow-sm">
                <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Safe and Secure Payments</p>
                  <p className="mt-1 text-[11px] leading-5 text-gray-500">
                    Payment processing is handled by your selected payment provider.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border border-blue-100 bg-white p-4">
                <Gift className="h-5 w-5 shrink-0 text-[#2874F0]" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Offers and Savings</p>
                  <p className="mt-1 text-[11px] leading-5 text-gray-500">
                    Apply a valid ShopSphere coupon to see your available discount reflected in the total.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-gray-200 py-5 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Secure payments
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-gray-500" />
            Delivery information
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-4 w-4 text-gray-500" />
            Protected checkout
          </span>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
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
            disabled={submitDisabled || orderSubmissionInProgress.current}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#fb641b] px-3 py-3 text-sm font-bold uppercase text-white hover:bg-[#e85a15] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {placingOrder || razorpayProcessing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : paymentMethod === "cod" ? (
              <Truck className="h-4 w-4" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            {placingOrder
              ? "Preparing..."
              : razorpayProcessing
                ? "Processing..."
                : paymentMethod === "cod"
                  ? "Place Order"
                  : paymentMethod === "stripe"
                    ? "Continue to Stripe"
                    : razorpayMethod === "upi_qr"
                      ? "Generate QR"
                      : `Razorpay: ${razorpayMethodLabel}`}
          </button>
        </div>
      </div>
    </main>
  );
}
