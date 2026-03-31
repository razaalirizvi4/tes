import React, { useState } from 'react';
import { MenuItem } from '@/types';
import { useTranslations } from 'next-intl';

interface MenuItemFormProps {
  menuItem?: MenuItem;
  onSubmit: (data: Partial<MenuItem>) => void;
  onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ menuItem, onSubmit, onCancel }) => {
  const tCommon = useTranslations("common");
  const tVendor = useTranslations("vendor");

  const [formData, setFormData] = useState({
    label: menuItem?.label || '',
    description: menuItem?.description || '',
    price: menuItem?.price || 0,
    image: menuItem?.image || '',
    category: menuItem?.category || '',
    barcode: menuItem?.barcode || '',
    brand: menuItem?.brand || '',
    sku: menuItem?.sku || '',
    unit: menuItem?.unit || '',
    unitQuantity: menuItem?.unitQuantity || 0,
    weight: menuItem?.weight || 0,
    stockQuantity: menuItem?.stockQuantity || 0,
    trackStock: menuItem?.trackStock ?? false,
    lowStockThreshold: menuItem?.lowStockThreshold || 0,
    pricingType: menuItem?.pricingType || 'FIXED'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price.toString()),
      unitQuantity: parseFloat(formData.unitQuantity.toString()),
      weight: parseFloat(formData.weight.toString()),
      stockQuantity: parseInt(formData.stockQuantity.toString()),
      lowStockThreshold: parseInt(formData.lowStockThreshold.toString())
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("itemName")}*
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">{tVendor("description")}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("price")}*
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("pricingType")}
          </label>
          <select
            value={formData.pricingType}
            onChange={(e) => setFormData({ ...formData, pricingType: e.target.value as any })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="FIXED">{tVendor("pricingTypes.FIXED")}</option>
            <option value="PER_UNIT">{tVendor("pricingTypes.PER_UNIT")}</option>
            <option value="WEIGHTED">{tVendor("pricingTypes.WEIGHTED")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("category")}*
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("brand")}
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("sku")}
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("barcode")}
          </label>
          <input
            type="text"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("unit")}
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="kg, pcs, box"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("unitQuantity")}
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.unitQuantity}
            onChange={(e) => setFormData({ ...formData, unitQuantity: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("stockQuantity")}
          </label>
          <input
            type="number"
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("lowStockThreshold")}
          </label>
          <input
            type="number"
            value={formData.lowStockThreshold}
            onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="trackStock"
            checked={formData.trackStock}
            onChange={(e) => setFormData({ ...formData, trackStock: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <label htmlFor="trackStock" className="text-sm font-medium text-gray-700">
            {tVendor("trackStock")}
          </label>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            {tVendor("coverImage")}
          </label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {tCommon("cancel")}
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {tCommon("save")}
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm;
