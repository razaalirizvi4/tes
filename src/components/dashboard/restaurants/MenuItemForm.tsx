import React, { useState, useEffect } from "react";
import { AddonGroup, MenuItem, SpicyLevel } from "../../../types";
import { uploadImageToBucket } from "@/app/[locale]/utils/uploadImage";
import { useTranslations } from "next-intl";

interface MenuItemFormProps {
  menuItem?: MenuItem;
  restaurantId?: string;
  onSubmit: (data: Partial<MenuItem> & { addonGroupIds?: string[] }) => void;
  onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  menuItem,
  restaurantId,
  onSubmit,
  onCancel,
}) => {
  const tCommon = useTranslations("common");
  const tVendor = useTranslations("vendor");
  const [label, setLabel] = useState(menuItem?.label ?? "");
  const [description, setDescription] = useState(menuItem?.description ?? "");
  const [price, setPrice] = useState(menuItem?.price ?? 0);
  const [image, setImage] = useState(menuItem?.image ?? "");
  const [category, setCategory] = useState(menuItem?.category ?? "");
  const [spicy, setSpicy] = useState<SpicyLevel | null>(menuItem?.spicy ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Addon Groups state
  const [availableGroups, setAvailableGroups] = useState<AddonGroup[]>([]);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>(
    menuItem?.addonGroups?.map(ag => ag.addonGroupId) ?? []
  );
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Fetch available addon groups for this restaurant
  useEffect(() => {
    const rId = menuItem?.restaurantId || restaurantId;
    if (rId) {
      const fetchAddonGroups = async () => {
        setIsLoadingGroups(true);
        try {
          const res = await fetch(`/api/restaurants/${rId}/addon-groups`);
          if (res.ok) {
            const data = await res.json();
            setAvailableGroups(data);
          }
        } catch (error) {
          console.error("Failed to fetch addon groups:", error);
        } finally {
          setIsLoadingGroups(false);
        }
      };
      
      fetchAddonGroups();
    }
  }, [menuItem?.restaurantId, restaurantId]);



  useEffect(() => {
    if (menuItem) {
      setLabel(menuItem.label ?? "");
      setDescription(menuItem.description ?? "");
      setPrice(menuItem.price ?? 0);
      setImage(menuItem.image ?? "");
      setCategory(menuItem.category ?? "");
      setSpicy(menuItem.spicy ?? null);
      setFile(null);
      setPreviewUrl(null);
      
      // Update assigned group ids when menuItem changes
      setAssignedGroupIds(menuItem.addonGroups?.map(ag => ag.addonGroupId) ?? []);
    }
  }, [menuItem]);

  // Handle file preview URL creation and cleanup
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = image;
    if (file) {
      setUploading(true);
      const uploadedImageUrl = await uploadImageToBucket(file);
      if (uploadedImageUrl) {
        imageUrl = uploadedImageUrl;
      }
    }

    onSubmit({
      id: menuItem?.id,
      label,
      description,
      price,
      image: imageUrl,
      category,
      spicy: spicy || null,
      addonGroupIds: assignedGroupIds,
    });

    // We will need to handle assigning addon groups after creating/updating the menu item
    // The parent component will handle the actual onSubmit which creates/updates the menu item.
    // If it's an update, we assume the parent handles the API call, and maybe we can do a secondary call here,
    // OR we can pass it up. Passing it up is cleaner. 
    // Wait, the original code just calls onSubmit with data. 
    // We can add addonGroupIds to the onSubmit payload if parent supports it.
    // Let's modify the onSubmit prop type or just do the API call here if we have a menuItem.id.
    // Actually, it's better to pass it up, but since parent might not expect it, let's do the secondary call here if menuItem.id exists.
    // Wait, if it's a NEW menu item, we don't have the ID until parent creates it.
    // Let's just pass addonGroupIds in the onSubmit data and let parent handle it.
  };

  const handleAddonGroupToggle = (groupId: string) => {
    setAssignedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{tCommon("label")}</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tVendor("description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{tCommon("price")}</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          required
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tVendor("coverImage")}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      {/* Show image preview - new file takes priority, otherwise show existing image */}
      {(previewUrl || image) && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">
            {previewUrl ? "New image preview:" : "Current image:"}
          </p>
          <img
            src={previewUrl || image}
            alt={previewUrl ? "Preview" : "Current"}
            className="w-32 h-32 object-cover rounded border border-gray-300"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tCommon("category")}
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tVendor("spicyLevel")}
        </label>
        <select
          value={spicy || ""}
          onChange={(e) => setSpicy(e.target.value ? (e.target.value as SpicyLevel) : null)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        >
          <option value="">{tVendor("spice_notApplicable")}</option>
          <option value="MILD">{tVendor("spice_mild")} 🌶️</option>
          <option value="MEDIUM">{tVendor("spice_medium")} 🌶️🌶️</option>
          <option value="HOT">{tVendor("spice_hot")} 🌶️🌶️🌶️</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Select the spice level for this menu item. Leave as &quot;Normal&quot; if the item is not spicy.
        </p>
      </div>

      {/* Addon Groups Assignment */}
      <div className="border-t pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign Addon Groups
        </label>
        {isLoadingGroups ? (
          <p className="text-sm text-gray-500">Loading Addon Groups...</p>
        ) : availableGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableGroups.map(group => (
              <label key={group.id} className="flex items-center space-x-2 border p-2 rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={assignedGroupIds.includes(group.id)}
                  onChange={() => handleAddonGroupToggle(group.id)}
                />
                <span className="text-sm">
                  {group.name} 
                  <span className="text-xs text-gray-500 ml-1">
                    ({group.isRequired ? 'Required' : 'Optional'} &middot; {group.selectionType === 'SINGLE' ? 'Single' : 'Multi'})
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No addon groups available for this restaurant.</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          {tCommon("cancel")}
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={uploading}
        >
          {uploading ? tCommon("uploading") : tCommon("save")}
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm;
