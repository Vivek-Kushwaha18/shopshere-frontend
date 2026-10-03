import { apiFetch } from "./api";

// =====================================================
// ADDRESS
// =====================================================

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  address_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CREATE ADDRESS
// =====================================================

export interface AddressCreateData {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  address_type: string;
  is_default?: boolean;
}

// =====================================================
// UPDATE ADDRESS
// =====================================================

export interface AddressUpdateData {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  address_type: string;
  is_default?: boolean;
}

// =====================================================
// GET MY ADDRESSES
// =====================================================

export async function getAddresses(): Promise<Address[]> {
  const response = await apiFetch("/addresses/");

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch addresses."
    );
  }

  if (!Array.isArray(response.data)) {
    throw new Error("Invalid addresses response.");
  }

  return response.data as Address[];
}

// =====================================================
// GET SINGLE ADDRESS
// =====================================================

export async function getAddress(
  addressId: number
): Promise<Address> {
  const response = await apiFetch(
    `/addresses/${addressId}`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch address."
    );
  }

  return response.data as Address;
}

// =====================================================
// CREATE ADDRESS
// =====================================================

export async function createAddress(
  data: AddressCreateData
): Promise<Address> {
  const response = await apiFetch(
    "/addresses/",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to create address."
    );
  }

  return response.data as Address;
}

// =====================================================
// UPDATE ADDRESS
// =====================================================

export async function updateAddress(
  addressId: number,
  data: AddressUpdateData
): Promise<Address> {
  const response = await apiFetch(
    `/addresses/${addressId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update address."
    );
  }

  return response.data as Address;
}

// =====================================================
// SET DEFAULT ADDRESS
// =====================================================

export async function setDefaultAddress(
  addressId: number
): Promise<Address> {
  const response = await apiFetch(
    `/addresses/${addressId}/default`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to set default address."
    );
  }

  return response.data as Address;
}

// =====================================================
// DELETE ADDRESS
// =====================================================

export async function deleteAddress(
  addressId: number
): Promise<void> {
  const response = await apiFetch(
    `/addresses/${addressId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to delete address."
    );
  }
}