"use client";
import { toast } from "react-hot-toast";
import { authService } from "@/services/authService";
import { UserAddress } from "@/types";
import AddressForm from "@/components/AddressForm";
import { useEffect, useState } from "react";
import { MdDelete, MdEdit, MdHome, MdWork, MdOutlineLocationOn } from "react-icons/md";
import { useAddressStore } from "@/store/useStore";
import { useTranslations } from "next-intl";

export default function AddressPage() {
  const tOrder = useTranslations("order");
  const tCommon = useTranslations("common");
  const tMessages = useTranslations("messages");
  const tProfile = useTranslations("profile");

  const { addresses, fetchAddresses, removeAddress, updateAddress } =
    useAddressStore();
  const user = authService.getCurrentUser();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<
    (typeof addresses)[0] | null
  >(null);
  const [formKey, setFormKey] = useState(0); // Used to force form reset

  useEffect(() => {
    if (user?.id) {
      fetchAddresses(); // Fetch addresses when the user is available
    }
  }, [user, fetchAddresses]);

  const handleSubmit = async (data: Partial<UserAddress>) => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error("No user found");
      }

      // Ensure phoneNumber is sent (required by API) even if hidden in form
      const addressData = {
        ...data,
        phoneNumber: data.phoneNumber || '',
      };

      if (editingAddress) {
        // Update existing address
        await updateAddress({
          ...addressData,
          id: editingAddress.id,
        } as (typeof addresses)[0]);
        toast.success(tMessages("addressUpdated"));
        setEditingAddress(null); // Reset edit mode
      } else {
        // Create new address
        await useAddressStore.getState().createAddress(
          addressData as (typeof addresses)[0]
        );
        toast.success(tMessages("addressAdded"));
      }

      // Clear form after save by resetting editingAddress and triggering form reset
      setEditingAddress(null);
      setFormKey(prev => prev + 1); // Force form reset
    } catch {
      if (editingAddress) {
        toast.error(tOrder("updateAddressError"));
      } else {
        toast.error(tMessages("errorOccurred"));
      }
    }
  };

  const handleEditAddress = (address: (typeof addresses)[0]) => {
    setEditingAddress(address);
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setFormKey(prev => prev + 1); // Force form reset
  };

  const handleClikRemoveAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAddressId) return;

    try {
      await removeAddress(selectedAddressId);
      setIsModalOpen(false);
      setSelectedAddressId(null);
      toast.success(tOrder("deleteAddressSuccess"));
    } catch {
      toast.error(tOrder("deleteAddressError"));
    }
  };

  const handleSetAsDefault = async (addressId: string) => {
    try {
      const address = addresses.find(addr => addr.id === addressId);
      if (!address) return;

      await updateAddress({
        ...address,
        isDefault: true,
      });
      toast.success(tOrder("updateAddressSuccess"));
    } catch {
      toast.error(tOrder("updateAddressError"));
    }
  };

  // Check if any address is already set as default (excluding the one being edited)
  const hasDefaultAddress = addresses.some(addr => addr.isDefault && addr.id !== editingAddress?.id);

  // Get icon component based on address label
  const getAddressIcon = (label: string) => {
    const iconClass = "text-2xl mr-2 text-gray-700";

    switch (label.toLowerCase()) {
      case 'home':
        return <MdHome className={iconClass} />;
      case 'work':
        return <MdWork className={iconClass} />;
      case 'other':
      default:
        return <MdOutlineLocationOn className={iconClass} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between w-full gap-8 p-10">
      <div className="md:w-1/2">
        <h2 className="text-3xl font-medium mb-4">
          {tOrder("yourDeliveryAddresses")}
        </h2>
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9-3a9 9 0 1118 0 9 9 0 01-18 0z"
              />
            </svg>
            <p className="text-lg font-semibold">
              {tOrder("noLocation")}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {tOrder("addNewAddress")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="border p-4 rounded-lg border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    {getAddressIcon(address.label || 'Other')}
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {address.label || tCommon("address")}
                      </p>
                      {address.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                          {tProfile("defaultAddress")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MdDelete
                      onClick={(e) => {
                        e.stopPropagation();
                        if (address.id) handleClikRemoveAddress(address.id);
                      }}
                      className="text-xl text-red-500 hover:text-red-700 cursor-pointer"
                    />
                    <MdEdit
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAddress(address);
                      }}
                      className="text-xl text-blue-500 hover:text-blue-700 cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-gray-700">{address.city}</p>
                <p className="text-gray-500 text-sm">
                  {address.streetAddress}, {address.state} {address.zipCode}
                </p>
                {/* {!address.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (address.id) handleSetAsDefault(address.id);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Set as default
                  </button>
                )} */}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="md:w-1/2">
        <h2 className="text-3xl font-medium">
          {editingAddress
            ? `${tCommon("edit")} ${tCommon("address")}`
            : tOrder("addNewAddress")}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {tOrder("deliveryAddress")}
        </p>
        <div className="mt-8">
          <AddressForm
            key={editingAddress?.id || `new-address-${formKey}`}
            onSubmit={handleSubmit}
            initialData={
              editingAddress
                ? {
                  label: editingAddress.label,
                  streetAddress: editingAddress.streetAddress,
                  city: editingAddress.city,
                  state: editingAddress.state,
                  zipCode: editingAddress.zipCode,
                  phoneNumber: editingAddress.phoneNumber,
                  isDefault: editingAddress.isDefault,
                }
                : {}
            }
            onCancel={editingAddress ? handleCancelEdit : undefined}
            submitLabel={tCommon("save")}
            hasDefaultAddress={hasDefaultAddress && !editingAddress?.isDefault}
          />
        </div>
      </div>



      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-800">
              {tOrder("confirmDeletion")}
            </h2>
            <p className="text-gray-600 mt-2">
              {tOrder("confirmDeletionMessage")}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={() => confirmDelete()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                {tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
