"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getSellerShipments,
  updateShipmentStatus,
  updateShipmentTrackingNumber,
  type Shipment,
} from "@/services/orders";

function getStatusClass(status: string) {
  switch (status) {
    case "processing":
      return "bg-yellow-100 text-yellow-800";

    case "shipped":
      return "bg-purple-100 text-purple-800";

    case "out_for_delivery":
      return "bg-orange-100 text-orange-800";

    case "delivered":
      return "bg-green-100 text-green-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default function SellerShipmentsPage() {
  const [shipments, setShipments] = useState<
    Shipment[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [
    trackingNumbers,
    setTrackingNumbers,
  ] = useState<Record<number, string>>({});

  const [
    savingTrackingId,
    setSavingTrackingId,
  ] = useState<number | null>(null);

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState<number | null>(null);

  async function loadShipments() {
    try {
      setLoading(true);

      const data = await getSellerShipments();

      setShipments(data);

      const trackingMap: Record<
        number,
        string
      > = {};

      data.forEach((shipment) => {
        trackingMap[shipment.id] =
          shipment.tracking_number || "";
      });

      setTrackingNumbers(trackingMap);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load shipments",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, []);

  async function handleSaveTrackingNumber(
    shipmentId: number
  ) {
    const trackingNumber =
      trackingNumbers[shipmentId]?.trim();

    if (!trackingNumber) {
      Swal.fire({
        icon: "warning",
        title: "Tracking number required",
        text: "Please enter a tracking number.",
      });

      return;
    }

    try {
      setSavingTrackingId(shipmentId);

      await updateShipmentTrackingNumber(
        shipmentId,
        trackingNumber
      );

      setShipments((currentShipments) =>
        currentShipments.map((shipment) =>
          shipment.id === shipmentId
            ? {
                ...shipment,
                tracking_number:
                  trackingNumber,
              }
            : shipment
        )
      );

      Swal.fire({
        icon: "success",
        title: "Tracking number saved",
        text: "The tracking number has been updated.",
        confirmButtonColor: "#000000",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to save tracking number",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setSavingTrackingId(null);
    }
  }

  async function handleStatusChange(
    shipmentId: number,
    newStatus: string
  ) {
    try {
      setUpdatingStatusId(shipmentId);

      const updatedShipment =
        await updateShipmentStatus(
          shipmentId,
          newStatus
        );

      setShipments((currentShipments) =>
        currentShipments.map((shipment) =>
          shipment.id === shipmentId
            ? updatedShipment
            : shipment
        )
      );

      Swal.fire({
        icon: "success",
        title: "Status updated",
        text: `Shipment status changed to ${formatStatus(
          newStatus
        )}.`,
        confirmButtonColor: "#000000",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to update status",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });

      await loadShipments();
    } finally {
      setUpdatingStatusId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold">
            Shipments
          </h1>

          <p className="mt-4 text-gray-500">
            Loading shipments...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-semibold">
            Shipments
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your shipments and tracking
            information.
          </p>
        </div>

        {/* NO SHIPMENTS */}

        {shipments.length === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center">
            <h2 className="text-xl font-medium">
              No shipments yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Shipments will appear here when
              customers place orders.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {shipments.map((shipment) => {
              const trackingNumber =
                trackingNumbers[
                  shipment.id
                ] || "";

              const isSavingTracking =
                savingTrackingId ===
                shipment.id;

              const isUpdatingStatus =
                updatingStatusId ===
                shipment.id;

              return (
                <div
                  key={shipment.id}
                  className="rounded-lg border bg-white p-6 shadow-sm"
                >

                  {/* SHIPMENT HEADER */}

                  <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                      <h2 className="text-lg font-semibold">
                        Shipment #{shipment.id}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Order #{shipment.order_id}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Seller #{shipment.seller_id}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        shipment.status
                      )}`}
                    >
                      {formatStatus(
                        shipment.status
                      )}
                    </span>

                  </div>

                  {/* TRACKING NUMBER */}

                  <div className="mt-6">

                    <label
                      htmlFor={`tracking-${shipment.id}`}
                      className="block text-sm font-medium text-gray-900"
                    >
                      Tracking Number
                    </label>

                    <div className="mt-2 flex flex-col gap-3 sm:flex-row">

                      <input
                        id={`tracking-${shipment.id}`}
                        type="text"
                        value={trackingNumber}
                        onChange={(event) =>
                          setTrackingNumbers(
                            (current) => ({
                              ...current,
                              [shipment.id]:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Enter tracking number"
                        className="min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleSaveTrackingNumber(
                            shipment.id
                          )
                        }
                        disabled={
                          isSavingTracking
                        }
                        className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSavingTracking
                          ? "Saving..."
                          : "Save Tracking Number"}
                      </button>

                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Customers will see this
                      tracking number on their
                      order tracking page.
                    </p>

                  </div>

                  {/* SHIPMENT STATUS */}

                  <div className="mt-6 border-t pt-6">

                    <label
                      htmlFor={`status-${shipment.id}`}
                      className="block text-sm font-medium text-gray-900"
                    >
                      Shipment Status
                    </label>

                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">

                      <select
                        id={`status-${shipment.id}`}
                        value={shipment.status}
                        onChange={(event) =>
                          handleStatusChange(
                            shipment.id,
                            event.target.value
                          )
                        }
                        disabled={
                          isUpdatingStatus
                        }
                        className="rounded-lg border px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100"
                      >
                        <option value="processing">
                          Processing
                        </option>

                        <option value="shipped">
                          Shipped
                        </option>

                        <option value="out_for_delivery">
                          Out for Delivery
                        </option>

                        <option value="delivered">
                          Delivered
                        </option>
                      </select>

                      {isUpdatingStatus && (
                        <span className="text-sm text-gray-500">
                          Updating status...
                        </span>
                      )}

                    </div>

                  </div>

                  {/* EXPECTED DELIVERY */}

                  {shipment.expected_delivery_date && (
                    <div className="mt-6 border-t pt-6">
                      <p className="text-sm text-gray-500">
                        Expected Delivery
                      </p>

                      <p className="mt-1 font-medium">
                        {new Date(
                          shipment.expected_delivery_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* CURRENT TRACKING */}

                  {shipment.tracking_number && (
                    <div className="mt-6 rounded-lg bg-gray-50 p-4">

                      <p className="text-xs text-gray-500">
                        Current Tracking Number
                      </p>

                      <p className="mt-1 break-all font-medium">
                        {
                          shipment.tracking_number
                        }
                      </p>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}