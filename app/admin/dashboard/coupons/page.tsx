"use client";

import { FormEvent, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";

import {
  Coupon,
  CouponPayload,
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
  updateCouponStatus,
} from "@/services/coupons";

const emptyForm: CouponPayload = {
  code: "",
  discount_type: "percentage",
  discount_value: 0,
  minimum_order_amount: 0,
  maximum_discount: null,
  start_date: "",
  expiry_date: "",
  usage_limit: null,
  is_active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] =
    useState<Coupon | null>(null);

  const [form, setForm] =
    useState<CouponPayload>(emptyForm);

  async function loadCoupons() {
    try {
      setLoading(true);

      const data = await getCoupons();

      setCoupons(data);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to load coupons.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function openCreateForm() {
    setEditingCoupon(null);
    setForm({
      ...emptyForm,
      start_date: getCurrentDateTime(),
      expiry_date: "",
    });
    setShowForm(true);
  }

  function openEditForm(coupon: Coupon) {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_amount:
        coupon.minimum_order_amount,
      maximum_discount:
        coupon.maximum_discount,
      start_date: formatDateForInput(
        coupon.start_date
      ),
      expiry_date: formatDateForInput(
        coupon.expiry_date
      ),
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingCoupon(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof CouponPayload,
    value: string | number | boolean | null
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.code.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Coupon code required",
        text: "Please enter a coupon code.",
      });
      return;
    }

    if (form.discount_value <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid discount",
        text: "Discount value must be greater than 0.",
      });
      return;
    }

    if (
      form.discount_type === "percentage" &&
      form.discount_value > 100
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid percentage",
        text: "Percentage discount cannot exceed 100.",
      });
      return;
    }

    if (!form.start_date || !form.expiry_date) {
      await Swal.fire({
        icon: "warning",
        title: "Dates required",
        text: "Please select start and expiry dates.",
      });
      return;
    }

    if (
      new Date(form.start_date) >=
      new Date(form.expiry_date)
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid dates",
        text: "Expiry date must be after the start date.",
      });
      return;
    }

    try {
      setSaving(true);

      const payload: CouponPayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        start_date: new Date(
          form.start_date
        ).toISOString(),
        expiry_date: new Date(
          form.expiry_date
        ).toISOString(),
      };

      if (editingCoupon) {
        await updateCoupon(
          editingCoupon.id,
          payload
        );

        await Swal.fire({
          icon: "success",
          title: "Coupon updated",
          text: "Coupon has been updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createCoupon(payload);

        await Swal.fire({
          icon: "success",
          title: "Coupon created",
          text: "Coupon has been created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      closeForm();
      await loadCoupons();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save coupon.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    coupon: Coupon
  ) {
    const newStatus = !coupon.is_active;

    try {
      await updateCouponStatus(
        coupon.id,
        newStatus
      );

      setCoupons((previous) =>
        previous.map((item) =>
          item.id === coupon.id
            ? {
                ...item,
                is_active: newStatus,
              }
            : item
        )
      );

      await Swal.fire({
        icon: "success",
        title: newStatus
          ? "Coupon enabled"
          : "Coupon disabled",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update coupon status.",
      });
    }
  }

  async function handleDelete(coupon: Coupon) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete coupon?",
      text: `Are you sure you want to delete ${coupon.code}?`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteCoupon(coupon.id);

      setCoupons((previous) =>
        previous.filter(
          (item) => item.id !== coupon.id
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Coupon deleted successfully.",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to delete coupon.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Coupons
          </h1>

          <p className="text-sm text-gray-500">
            Create and manage discount coupons.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-gray-500">
            Loading coupons...
          </p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-gray-500">
            No coupons found.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Create your first coupon
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  Code
                </th>

                <th className="px-4 py-3 text-left">
                  Discount
                </th>

                <th className="px-4 py-3 text-left">
                  Minimum Order
                </th>

                <th className="px-4 py-3 text-left">
                  Validity
                </th>

                <th className="px-4 py-3 text-left">
                  Usage
                </th>

                <th className="px-4 py-3 text-left">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b last:border-b-0"
                >
                  <td className="px-4 py-4 font-semibold">
                    {coupon.code}
                  </td>

                  <td className="px-4 py-4">
                    {coupon.discount_type ===
                    "percentage"
                      ? `${coupon.discount_value}%`
                      : `₹${coupon.discount_value}`}
                  </td>

                  <td className="px-4 py-4">
                    ₹
                    {coupon.minimum_order_amount.toFixed(
                      2
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div>
                      {formatDate(
                        coupon.start_date
                      )}
                    </div>

                    <div className="text-gray-500">
                      to{" "}
                      {formatDate(
                        coupon.expiry_date
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {coupon.used_count}
                    {" / "}
                    {coupon.usage_limit ??
                      "Unlimited"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        coupon.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {coupon.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(coupon)
                        }
                        className="rounded-lg border p-2 hover:bg-gray-50"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            coupon
                          )
                        }
                        className="rounded-lg border p-2 hover:bg-gray-50"
                        title={
                          coupon.is_active
                            ? "Disable"
                            : "Enable"
                        }
                      >
                        <Power size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(coupon)
                        }
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editingCoupon
                  ? "Edit Coupon"
                  : "Create Coupon"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Coupon Code
                </label>

                <input
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    updateField(
                      "code",
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="SAVE20"
                  className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Discount Type
                  </label>

                  <select
                    value={form.discount_type}
                    onChange={(event) =>
                      updateField(
                        "discount_type",
                        event.target.value as
                          | "percentage"
                          | "fixed"
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                  >
                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Discount Value
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(event) =>
                      updateField(
                        "discount_value",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Minimum Order Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.minimum_order_amount
                    }
                    onChange={(event) =>
                      updateField(
                        "minimum_order_amount",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Maximum Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.maximum_discount ?? ""
                    }
                    onChange={(event) =>
                      updateField(
                        "maximum_discount",
                        event.target.value === ""
                          ? null
                          : Number(
                              event.target.value
                            )
                      )
                    }
                    placeholder="Optional"
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Start Date
                  </label>

                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(event) =>
                      updateField(
                        "start_date",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Expiry Date
                  </label>

                  <input
                    type="datetime-local"
                    value={form.expiry_date}
                    onChange={(event) =>
                      updateField(
                        "expiry_date",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Usage Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.usage_limit ?? ""}
                  onChange={(event) =>
                    updateField(
                      "usage_limit",
                      event.target.value === ""
                        ? null
                        : Number(
                            event.target.value
                          )
                    )
                  }
                  placeholder="Leave empty for unlimited"
                  className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateField(
                      "is_active",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                Active coupon
              </label>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCoupon
                      ? "Update Coupon"
                      : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getCurrentDateTime() {
  const date = new Date();

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16);
}

function formatDateForInput(
  value: string
) {
  const date = new Date(value);

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}