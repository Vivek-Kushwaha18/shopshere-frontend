"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressCreateData,
} from "@/services/addresses";

const emptyForm: AddressCreateData = {
  full_name: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  postal_code: "",
  address_type: "Home",
  is_default: false,
};

export default function AddressesPage() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [defaultId, setDefaultId] =
    useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [formData, setFormData] =
    useState<AddressCreateData>(emptyForm);

  // =====================================================
  // LOAD ADDRESSES
  // =====================================================

  async function loadAddresses() {
    try {
      setLoading(true);

      const data = await getAddresses();

      setAddresses(data);
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
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  function openAddForm() {
    setEditingId(null);

    setFormData({
      ...emptyForm,
    });

    setShowForm(true);
  }

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  function openEditForm(address: Address) {
    setEditingId(address.id);

    setFormData({
      full_name: address.full_name,
      phone: address.phone,
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      address_type: address.address_type,
      is_default: address.is_default,
    });

    setShowForm(true);
  }

  // =====================================================
  // CLOSE FORM
  // =====================================================

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);

    setFormData({
      ...emptyForm,
    });
  }

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  function validateForm() {
    if (formData.full_name.trim().length < 2) {
      return "Please enter a valid full name.";
    }

    if (formData.phone.trim().length < 5) {
      return "Please enter a valid phone number.";
    }

    if (
      formData.address_line.trim().length < 5
    ) {
      return "Please enter your complete address.";
    }

    if (formData.city.trim().length < 2) {
      return "Please enter your city.";
    }

    if (formData.state.trim().length < 2) {
      return "Please enter your state.";
    }

    if (
      formData.postal_code.trim().length < 3
    ) {
      return "Please enter a valid postal code.";
    }

    if (
      formData.address_type.trim().length < 2
    ) {
      return "Please enter a valid address type.";
    }

    return null;
  }

  // =====================================================
  // SAVE ADDRESS
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Address",
        text: validationError,
      });

      return;
    }

    const data: AddressCreateData = {
      full_name:
        formData.full_name.trim(),

      phone:
        formData.phone.trim(),

      address_line:
        formData.address_line.trim(),

      city:
        formData.city.trim(),

      state:
        formData.state.trim(),

      postal_code:
        formData.postal_code.trim(),

      address_type:
        formData.address_type.trim(),

      is_default:
        formData.is_default,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateAddress(
          editingId,
          data
        );

        Swal.fire({
          icon: "success",
          title: "Address Updated",
          text: "Your address has been updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createAddress(data);

        Swal.fire({
          icon: "success",
          title: "Address Added",
          text: "Your address has been saved successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      closeForm();

      await loadAddresses();
    } catch (error) {
      console.error(
        "Failed to save address:",
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
      setSaving(false);
    }
  }

  // =====================================================
  // SET DEFAULT
  // =====================================================

  async function handleSetDefault(
    addressId: number
  ) {
    try {
      setDefaultId(addressId);

      await setDefaultAddress(
        addressId
      );

      await loadAddresses();

      Swal.fire({
        icon: "success",
        title: "Default Address Updated",
        text: "This address is now your default delivery address.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Failed to set default address:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to update default address",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setDefaultId(null);
    }
  }

  // =====================================================
  // DELETE ADDRESS
  // =====================================================

  async function handleDelete(
    address: Address
  ) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Address?",
      text: "This address will be permanently deleted.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(address.id);

      await deleteAddress(
        address.id
      );

      await loadAddresses();

      Swal.fire({
        icon: "success",
        title: "Address Deleted",
        text: "The address has been deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Failed to delete address:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to delete address",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">

      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-3xl font-bold tracking-tight">
              My Addresses
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage your saved delivery addresses.
            </p>

          </div>

          {!showForm && (
            <Button
              onClick={openAddForm}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          )}

        </div>

        {/* =================================================
            ADDRESS FORM
        ================================================= */}

        {showForm && (
          <Card className="mb-8">

            <CardHeader className="flex flex-row items-center justify-between">

              <CardTitle>
                {editingId !== null
                  ? "Edit Address"
                  : "Add New Address"}
              </CardTitle>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeForm}
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </Button>

            </CardHeader>

            <CardContent>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div>

                  <label
                    htmlFor="full_name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Full Name
                  </label>

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={
                      formData.full_name
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={150}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Enter full name"
                  />

                </div>

                <div>

                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium"
                  >
                    Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={30}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Enter phone number"
                  />

                </div>

                <div>

                  <label
                    htmlFor="address_line"
                    className="mb-2 block text-sm font-medium"
                  >
                    Address
                  </label>

                  <textarea
                    id="address_line"
                    name="address_line"
                    value={
                      formData.address_line
                    }
                    onChange={
                      handleChange
                    }
                    rows={4}
                    required
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="House number, street, area, landmark"
                  />

                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label
                      htmlFor="city"
                      className="mb-2 block text-sm font-medium"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={
                        formData.city
                      }
                      onChange={
                        handleChange
                      }
                      maxLength={100}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Enter city"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="state"
                      className="mb-2 block text-sm font-medium"
                    >
                      State
                    </label>

                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={
                        formData.state
                      }
                      onChange={
                        handleChange
                      }
                      maxLength={100}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Enter state"
                    />

                  </div>

                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label
                      htmlFor="postal_code"
                      className="mb-2 block text-sm font-medium"
                    >
                      Postal Code
                    </label>

                    <input
                      id="postal_code"
                      name="postal_code"
                      type="text"
                      value={
                        formData.postal_code
                      }
                      onChange={
                        handleChange
                      }
                      maxLength={20}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Enter postal code"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="address_type"
                      className="mb-2 block text-sm font-medium"
                    >
                      Address Type
                    </label>

                    <select
                      id="address_type"
                      name="address_type"
                      value={
                        formData.address_type
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >

                      <option value="Home">
                        Home
                      </option>

                      <option value="Office">
                        Office
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      formData.is_default
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          is_default:
                            event.target
                              .checked,
                        })
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm">
                    Set as default address
                  </span>

                </label>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <Button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Address"
                        : "Save Address"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </Button>

                </div>

              </form>

            </CardContent>

          </Card>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="py-16 text-center">

            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />

            <p className="text-sm text-muted-foreground">
              Loading your addresses...
            </p>

          </div>

        ) : addresses.length === 0 ? (

          <Card>

            <CardContent className="flex flex-col items-center justify-center py-16 text-center">

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">

                <MapPin className="h-8 w-8 text-primary" />

              </div>

              <h2 className="text-xl font-semibold">
                No saved addresses
              </h2>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Add a delivery address so you can use it quickly during checkout.
              </p>

              {!showForm && (
                <Button
                  className="mt-6"
                  onClick={openAddForm}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Address
                </Button>
              )}

            </CardContent>

          </Card>

        ) : (

          <div className="grid gap-5 md:grid-cols-2">

            {addresses.map(
              (address) => (
                <Card
                  key={address.id}
                  className={
                    address.is_default
                      ? "border-primary"
                      : ""
                  }
                >

                  <CardHeader>

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">

                          <MapPin className="h-5 w-5 text-primary" />

                        </div>

                        <div>

                          <CardTitle className="text-lg">
                            {address.address_type}
                          </CardTitle>

                          {address.is_default && (
                            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">

                              <Star className="h-3 w-3 fill-current" />

                              Default Address

                            </div>
                          )}

                        </div>

                      </div>

                    </div>

                  </CardHeader>

                  <CardContent>

                    <div className="space-y-1 text-sm">

                      <p className="font-semibold">
                        {address.full_name}
                      </p>

                      <p>
                        {address.phone}
                      </p>

                      <p className="pt-2 text-muted-foreground">
                        {address.address_line}
                      </p>

                      <p className="text-muted-foreground">
                        {address.city},{" "}
                        {address.state}{" "}
                        {address.postal_code}
                      </p>

                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">

                      {!address.is_default && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSetDefault(
                              address.id
                            )
                          }
                          disabled={
                            defaultId ===
                            address.id
                          }
                        >
                          <Star className="mr-2 h-4 w-4" />

                          {defaultId ===
                          address.id
                            ? "Setting..."
                            : "Set Default"}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openEditForm(
                            address
                          )
                        }
                        disabled={
                          deletingId ===
                          address.id
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDelete(
                            address
                          )
                        }
                        disabled={
                          deletingId ===
                          address.id
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />

                        {deletingId ===
                        address.id
                          ? "Deleting..."
                          : "Delete"}
                      </Button>

                    </div>

                  </CardContent>

                </Card>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}