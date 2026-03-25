"use client";

import { uploadImageToBucket } from '@/app/[locale]/utils/uploadImage';
import { AddonGroup, AddonOption, MenuItem, SelectionType } from '@/types';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

interface AddonGroupFormProps {
  restaurantId: string;
  initialData?: AddonGroup;
  onSave: () => void;
  onCancel: () => void;
}

export default function AddonGroupForm({ restaurantId, initialData, onSave, onCancel }: AddonGroupFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [selectionType, setSelectionType] = useState<SelectionType>(initialData?.selectionType || 'SINGLE');
  const [isRequired, setIsRequired] = useState(initialData?.isRequired || false);
  const [minSelections, setMinSelections] = useState(initialData?.minSelections || 0);
  const [maxSelections, setMaxSelections] = useState(initialData?.maxSelections || null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Create a workable format for options editing
  const [options, setOptions] = useState<Partial<AddonOption>[]>(
    initialData?.options || []
  );
  
  const [optionFiles, setOptionFiles] = useState<{ [key: number]: File }>({});
  const [optionPreviews, setOptionPreviews] = useState<{ [key: number]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const tVendor = useTranslations("vendor.addonGroup");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}/menu-items`);
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data);
        }
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };
    fetchMenuItems();
  }, [restaurantId]);

  const handleAddOption = () => {
    setOptions([
      ...options,
      {
        name: '',
        priceAdjustment: 0,
        isDefault: false,
        sortOrder: options.length,
        isActive: true,
        linkedMenuItemId: null
      }
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
    // Clean up files and previews
    const newFiles = { ...optionFiles };
    const newPreviews = { ...optionPreviews };
    delete newFiles[index];
    delete newPreviews[index];
    setOptionFiles(newFiles);
    setOptionPreviews(newPreviews);
  };

  const updateOption = (index: number, field: keyof AddonOption, value: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    
    // If setting default for SINGLE select, un-default others
    if (field === 'isDefault' && value === true && selectionType === 'SINGLE') {
      updated.forEach((opt, i) => {
        if (i !== index) opt.isDefault = false;
      });
    }

    // Auto-fill name and price if linking a menu item and they are empty
    if (field === 'linkedMenuItemId' && value) {
      const selectedItem = menuItems.find(item => item.id === value);
      if (selectedItem) {
        if (!updated[index].name) {
          updated[index].name = selectedItem.label;
        }
        if (updated[index].priceAdjustment === 0 || updated[index].priceAdjustment === undefined) {
          updated[index].priceAdjustment = selectedItem.price;
        }
        // Also auto-fill image if empty
        if (!updated[index].image && selectedItem.image) {
          updated[index].image = selectedItem.image;
        }
      }
    }
    
    setOptions(updated);
  };

  const handleOptionFileChange = (index: number, file: File | null) => {
    if (!file) return;

    setOptionFiles(prev => ({ ...prev, [index]: file }));
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setOptionPreviews(prev => ({ ...prev, [index]: objectUrl }));

    // Clean up preview on unmount or change
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Validate options exist
    if (options.length === 0) {
      alert(tVendor('atLeastOneOption'));
      setIsSaving(false);
      return;
    }

    try {
      // Upload images for options if any
      const finalOptions = await Promise.all(options.map(async (opt, i) => {
        let imageUrl = opt.image || null;
        
        if (optionFiles[i]) {
          const uploadedUrl = await uploadImageToBucket(optionFiles[i]);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        }
        
        return {
          ...opt,
          image: imageUrl,
          sortOrder: i
        };
      }));

      const payload = {
        name,
        displayName: displayName || null,
        selectionType,
        isRequired,
        minSelections: selectionType === 'MULTIPLE' ? minSelections : 0,
        maxSelections: selectionType === 'MULTIPLE' ? maxSelections : null,
        sortOrder: initialData?.sortOrder || 0,
        options: finalOptions
      };

      const url = initialData 
        ? `/api/restaurants/${restaurantId}/addon-groups/${initialData.id}`
        : `/api/restaurants/${restaurantId}/addon-groups`;
        
      const method = initialData ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave();
      } else {
        const errorData = await res.json();
        alert(`${tCommon('error')}: ${errorData.error || tVendor('failedToSave')}`);
      }
    } catch (error) {
      console.error("Error saving addon group:", error);
      alert(tVendor('unexpectedError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full sm:h-auto">
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{tVendor('groupNameInternal')}</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder={tVendor('groupNamePlaceholder')}
              className="w-full border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{tVendor('displayNameOptional')}</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              placeholder={tVendor('displayNamePlaceholder')}
              className="w-full border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-5 p-5 bg-gray-50/80 rounded-lg border border-gray-100 shadow-sm">
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-gray-700">{tVendor('selectionType')}</label>
            <div className="flex gap-5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  checked={selectionType === 'SINGLE'} 
                  onChange={() => setSelectionType('SINGLE')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                /> 
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{tVendor('singleRadio')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  checked={selectionType === 'MULTIPLE'} 
                  onChange={() => setSelectionType('MULTIPLE')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                /> 
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{tVendor('multipleCheckboxes')}</span>
              </label>
            </div>
          </div>
          
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-gray-700">{tVendor('isRequired')}</label>
            <div className="flex items-center h-[22px]">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isRequired} 
                  onChange={e => setIsRequired(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{tVendor('customerMustChoose')}</span>
              </label>
            </div>
          </div>

          {selectionType === 'MULTIPLE' && (
            <div className="flex gap-4 ms-auto sm:ms-0">
              <div className="space-y-2 w-24">
                <label className="block text-sm font-semibold text-gray-700">{tVendor('min')}</label>
                <input 
                  type="number" 
                  min="0"
                  value={minSelections} 
                  onChange={e => setMinSelections(Number(e.target.value))} 
                  className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2 w-24">
                <label className="block text-sm font-semibold text-gray-700">{tVendor('max')}</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder={tVendor('noLimit')}
                  value={maxSelections || ''} 
                  onChange={e => setMaxSelections(e.target.value ? Number(e.target.value) : null)} 
                  className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-base font-bold text-gray-800">{tVendor('options')}</label>
            <button 
              type="button" 
              onClick={handleAddOption}
              className="text-sm bg-blue-600 text-white px-3.5 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-semibold border border-blue-700 shadow-sm flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {tVendor('addOption')}
            </button>
          </div>
          
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
            {options.map((opt, idx) => (
              <div key={idx} className="flex flex-col gap-4 bg-white p-4 border rounded-lg shadow-sm group">
                {/* Mobile header / Delete button */}
                <div className="flex justify-between items-center sm:hidden border-b pb-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">{tVendor('option')} {idx + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveOption(idx)}
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-5 items-end">
                  {/* Name */}
                  <div className="sm:col-span-4 lg:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{tVendor('optionName')}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder={tVendor('optionNamePlaceholder')} 
                      value={opt.name || ''} 
                      onChange={e => updateOption(idx, 'name', e.target.value)}
                      className="w-full border rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-shadow"
                    />
                  </div>
                  
                  {/* Image */}
                  <div className="sm:col-span-2 lg:col-span-1 flex flex-col items-start">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 hidden sm:block">{tVendor('image')}</label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 border rounded-md bg-gray-50 flex-shrink-0 relative overflow-hidden group/image cursor-pointer hover:border-blue-400 transition-colors">
                        {(optionPreviews[idx] || opt.image) ? (
                          <>
                            <img 
                              src={optionPreviews[idx] || opt.image || ''} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer p-1 text-white hover:text-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={e => handleOptionFileChange(idx, e.target.files?.[0] || null)}
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <label className="flex items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={e => handleOptionFileChange(idx, e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>
                      {(optionPreviews[idx] || opt.image) && (
                        <button 
                          type="button"
                          onClick={() => {
                            updateOption(idx, 'image', null);
                            const newFiles = { ...optionFiles };
                            const newPreviews = { ...optionPreviews };
                            delete newFiles[idx];
                            delete newPreviews[idx];
                            setOptionFiles(newFiles);
                            setOptionPreviews(newPreviews);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title={tVendor('removeImage')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Linked Menu Item */}
                  <div className="sm:col-span-6 lg:col-span-5">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 whitespace-nowrap">{tVendor('linkMenuItem')}</label>
                    <select
                      value={opt.linkedMenuItemId || ''}
                      onChange={e => updateOption(idx, 'linkedMenuItemId', e.target.value || null)}
                      className="w-full border rounded-md p-2 text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-shadow"
                    >
                      <option value="">{tVendor('noneStandalone')}</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.label} (${item.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price adjustment */}
                  <div className="sm:col-span-4 lg:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{tVendor('priceAdd')}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-500 font-medium">$</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        required
                        value={opt.priceAdjustment === undefined ? '' : opt.priceAdjustment} 
                        onChange={e => updateOption(idx, 'priceAdjustment', Number(e.target.value))}
                        className="w-full border rounded-md p-2 ps-7 text-sm focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Actions / Default */}
                  <div className="sm:col-span-8 lg:col-span-12 flex items-center justify-between sm:justify-end gap-x-6 sm:pb-2 lg:pt-4 lg:border-t lg:mt-2 lg:border-gray-50">
                    <label className="flex flex-row items-center gap-2 cursor-pointer" title={tVendor('def')}>
                      <span className="text-xs font-semibold text-gray-600 uppercase pt-1">{tVendor('def')}</span>
                      <input 
                        type="checkbox" 
                        checked={opt.isDefault || false}
                        onChange={e => updateOption(idx, 'isDefault', e.target.checked)}
                        className="h-4 w-4 mt-1 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-colors"
                      />
                    </label>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveOption(idx)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                      title={tVendor('removeOption')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {options.length === 0 && (
              <div className="text-center p-4 text-gray-500 text-sm">
                {tVendor('noOptions')}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors shadow-sm"
          >
            {tCommon('cancel')}
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {tVendor('saving')}
              </>
            ) : tVendor('saveAddonGroup')}
          </button>
        </div>
      </form>
    </div >
      
  );
}
