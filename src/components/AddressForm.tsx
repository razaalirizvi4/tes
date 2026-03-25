import { useState, useEffect } from 'react';
import { UserAddress } from '@/types';
import { useTranslations } from "next-intl";

interface AddressFormProps {
  initialData?: Partial<UserAddress>;
  onSubmit: (data: Partial<UserAddress>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  closeModal?: (isOpen: boolean) => void; // ✅ Now it accepts a boolean
  hasDefaultAddress?: boolean; // Pass whether a default address exists
}

export default function AddressForm({
  initialData = {},
  onSubmit,
  onCancel,
  closeModal,
  submitLabel = 'Save Address',
  hasDefaultAddress = false
}: AddressFormProps) {
  const [formData, setFormData] = useState<Partial<UserAddress>>({
    label: initialData.label || 'Home',
    streetAddress: initialData.streetAddress || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    phoneNumber: initialData.phoneNumber || '',
    isDefault: initialData.isDefault || false
  });
  const [loading, setLoading] = useState(false);
  const tOrder = useTranslations("order");
  const tVendor = useTranslations("vendor");
  const tCommon = useTranslations("common");
  const tProfile = useTranslations("profile");

  // Sync form when the edited address changes (e.g., open modal for another address)
  useEffect(() => {
    setFormData({
      label: initialData.label || 'Home',
      streetAddress: initialData.streetAddress || '',
      city: initialData.city || '',
      state: initialData.state || '',
      zipCode: initialData.zipCode || '',
      phoneNumber: initialData.phoneNumber || '',
      isDefault: initialData.isDefault || false
    });
    // Only react to identity/record change, not on every re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      if (closeModal) {
        closeModal(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);

    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="label" className="block text-sm font-medium text-gray-700">
          Label
        </label>
        <select
          id="label"
          name="label"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        >
          <option value="Home">{tCommon("home")}</option>
          <option value="Work">{tCommon("work")}</option>
          <option value="Other">{tCommon("other")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700">
          {tOrder("deliveryAddress")}
        </label>
        <input
          type="text"
          id="streetAddress"
          name="streetAddress"
          value={formData.streetAddress}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            {tVendor('city')}
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            {tVendor('state')}
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
          {tVendor('zipCode')}
        </label>
        <input
          type="text"
          id="zipCode"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* Only show "Set as default" checkbox if no default address exists */}
      {!hasDefaultAddress && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
            {tProfile("defaultAddress")}
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {tCommon("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>


  );
}