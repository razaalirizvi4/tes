import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Restaurant } from '../../../types';

interface RestaurantFormProps {
  restaurant?: Restaurant;
  onSubmit: (data: Partial<Restaurant>) => void;
  onCancel: () => void;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({ restaurant, onSubmit, onCancel }) => {
  const tCommon = useTranslations('common');
  const tRestaurant = useTranslations('restaurant');
  const tVendor = useTranslations('vendor');
  const [formData, setFormData] = useState<Partial<Restaurant>>(restaurant || {
    name: '',
    chainName: '',
    address: '',
    latitude: 0,
    longitude: 0,
    cuisineType: '',
    segment: 'Casual Dining',
    rating: null,
    coverImage: '',
    city: '',
    area: '',
    deliveryTime: '',
    minimumOrder: '',
    menuItems: []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMenuItemRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{tRestaurant("name")}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{tRestaurant("chainName")}</label>
          <input
            type="text"
            name="chainName"
            value={formData.chainName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{tCommon("address")}</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{tCommon("latitude")}</label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              step="any"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{tCommon("longitude")}</label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              step="any"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{tRestaurant("cuisineType")}</label>
          <input
            type="text"
            name="cuisineType"
            value={formData.cuisineType}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{tCommon("segment")}</label>
          <select
            name="segment"
            value={formData.segment}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="Casual Dining">{tRestaurant("casualDining")}</option>
            <option value="Fine Dining">{tRestaurant("fineDining")}</option>
            <option value="Fast Food">{tRestaurant("fastFood")}</option>
            <option value="Cafe">{tRestaurant("cafe")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{tCommon("rating")}</label>
          <input
            type="number"
            name="rating"
            value={formData.rating || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            min="0"
            max="5"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{tRestaurant("coverImageUrl")}</label>
          <input
            type="text"
            name="coverImage"
            value={formData.coverImage || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{tCommon("city")}</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{tCommon("area")}</label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{tCommon("deliveryTime")}</label>
            <input
              type="text"
              name="deliveryTime"
              value={formData.deliveryTime || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g. 25-35"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{tCommon("minimumOrder")}</label>
            <input
              type="text"
              name="minimumOrder"
              value={formData.minimumOrder || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g. $15"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium">{tRestaurant("menuItems")}</h3>
        <div className="mt-4 space-y-4">
          {formData.menuItems?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="text-sm">${item.price}</p>
              </div>
              <button
                type="button"
                onClick={() => handleMenuItemRemove(index)}
                className="text-red-600 hover:text-red-800"
              >
                {tCommon("remove")}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {tCommon("cancel")}
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {tCommon("save")}
        </button>
      </div>
    </form>
  );
};

export default RestaurantForm;
