import React from 'react';
import { MenuItemAddon, SelectedAddon, SelectionType } from '@/types';

interface AddonSelectorProps {
  addonGroups: MenuItemAddon[];
  selectedAddons: SelectedAddon[];
  onSelectionChange: (addons: SelectedAddon[]) => void;
  formatCurrency: (value: number | string) => string;
}

export default function AddonSelector({
  addonGroups,
  selectedAddons,
  onSelectionChange,
  formatCurrency,
}: AddonSelectorProps) {
  
  if (!addonGroups || addonGroups.length === 0) return null;

  const handleSelection = (
    groupId: string,
    groupName: string,
    optionId: string,
    optionName: string,
    priceAdjustment: number,
    selectionType: SelectionType,
    maxSelections?: number | null
  ) => {
    const newSelection: SelectedAddon = {
      groupId,
      groupName,
      optionId,
      optionName,
      priceAdjustment,
    };

    if (selectionType === 'SINGLE') {
      // Remove any existing selection for this group and add new one
      const filtered = selectedAddons.filter((s) => s.groupId !== groupId);
      onSelectionChange([...filtered, newSelection]);
    } else {
      // MULTIPLE
      const exists = selectedAddons.some((s) => s.optionId === optionId);
      
      if (exists) {
        // Remove it
        onSelectionChange(selectedAddons.filter((s) => s.optionId !== optionId));
      } else {
        // Check max selections
        const currentGroupSelectionsCount = selectedAddons.filter((s) => s.groupId === groupId).length;
        if (maxSelections && currentGroupSelectionsCount >= maxSelections) {
          // Reached max, do not add
          return;
        }
        onSelectionChange([...selectedAddons, newSelection]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {addonGroups.map(({ addonGroup }) => {
        if (!addonGroup || !addonGroup.isActive || !addonGroup.options || addonGroup.options.length === 0) {
          return null;
        }

        const isSingle = addonGroup.selectionType === 'SINGLE';
        const groupSelections = selectedAddons.filter((s) => s.groupId === addonGroup.id);

        return (
          <div key={addonGroup.id} className="mb-6">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2">
              {addonGroup.displayName || addonGroup.name}
              {addonGroup.isRequired && (
                <span className="text-red-500 text-xs font-semibold uppercase ml-2 tracking-wide font-medium bg-red-50 px-2 py-0.5 rounded">
                  Required
                </span>
              )}
            </h3>
            
            {!isSingle && addonGroup.maxSelections && (
              <p className="text-xs text-gray-500 mb-3">
                Choose up to {addonGroup.maxSelections}
              </p>
            )}

            <div className={isSingle ? "flex flex-wrap gap-3" : "space-y-2"}>
              {addonGroup.options.map((opt) => {
                const isSelected = selectedAddons.some((s) => s.optionId === opt.id);

                if (isSingle) {
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        handleSelection(
                          addonGroup.id,
                          addonGroup.name,
                          opt.id,
                          opt.name,
                          opt.priceAdjustment,
                          addonGroup.selectionType,
                          addonGroup.maxSelections
                        )
                      }
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-white border border-primary-500 text-gray-800 shadow-sm ring-1 ring-primary-500'
                          : 'bg-gray-100 border border-transparent text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.image && (
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span>
                        {opt.name}
                        {opt.priceAdjustment > 0 && ` (+ ${formatCurrency(opt.priceAdjustment)})`}
                      </span>
                    </button>
                  );
                } else {
                  return (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer border border-transparent hover:border-gray-200"
                      onClick={() =>
                        handleSelection(
                          addonGroup.id,
                          addonGroup.name,
                          opt.id,
                          opt.name,
                          opt.priceAdjustment,
                          addonGroup.selectionType,
                          addonGroup.maxSelections
                        )
                      }
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {opt.image && (
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                            <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-gray-800 font-medium text-sm md:text-base">
                          {opt.name}
                        </span>
                      </div>
                      {opt.priceAdjustment > 0 && (
                        <span className="text-gray-600 font-medium text-sm md:text-base ml-4">
                          +{formatCurrency(opt.priceAdjustment)}
                        </span>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
