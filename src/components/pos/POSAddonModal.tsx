'use client';

import { useState, useEffect } from 'react';
import { MenuItem, MenuItemAddon, SelectedAddon } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { useTranslations } from 'next-intl';
import AddonSelector from '@/components/menu/AddonSelector';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface POSAddonModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuItem: MenuItem | null;
    onAddToCart: (item: MenuItem, selectedAddons: SelectedAddon[]) => void;
    restaurantCurrency?: string | null;
}

export default function POSAddonModal({
    isOpen,
    onClose,
    menuItem,
    onAddToCart,
    restaurantCurrency
}: POSAddonModalProps) {
    const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
    const { formatCurrency } = useCurrency(restaurantCurrency);
    const tCommon = useTranslations('common');
    const tDashboard = useTranslations('dashboard');
    const tRestaurant = useTranslations('restaurant');

    // Reset selections when modal opens for a new item
    useEffect(() => {
        if (isOpen && menuItem) {
            const defaultAddons: SelectedAddon[] = [];

            // Pre-select default options
            menuItem.addonGroups?.forEach((groupRelation: MenuItemAddon) => {
                const group = groupRelation.addonGroup;
                if (!group) return;

                group.options?.forEach(opt => {
                    if (opt.isDefault) {
                        defaultAddons.push({
                            groupId: group.id,
                            groupName: group.name,
                            optionId: opt.id,
                            optionName: opt.name,
                            priceAdjustment: opt.priceAdjustment
                        });
                    }
                });
            });

            setSelectedAddons(defaultAddons);
        }
    }, [isOpen, menuItem]);

    if (!isOpen || !menuItem) return null;

    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.priceAdjustment, 0);
    const itemTotal = menuItem.price + addonsTotal;

    const handleConfirm = () => {
        // Simple validation: check required groups
        const unfulfilledRequiredGroups = menuItem.addonGroups?.filter(gr => {
            const group = gr.addonGroup;
            if (!group?.isRequired) return false;
            return !selectedAddons.some(s => s.groupId === group.id);
        });

        if (unfulfilledRequiredGroups && unfulfilledRequiredGroups.length > 0) {
            alert(`Please select required options for: ${unfulfilledRequiredGroups.map(gr => gr.addonGroup.name).join(', ')}`);
            return;
        }

        onAddToCart(menuItem, selectedAddons);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{menuItem.label}</h2>
                        <p className="text-sm text-gray-500">{formatCurrency(menuItem.price)} base price</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {menuItem.addonGroups && menuItem.addonGroups.length > 0 ? (
                        <AddonSelector
                            addonGroups={menuItem.addonGroups}
                            selectedAddons={selectedAddons}
                            onSelectionChange={setSelectedAddons}
                            formatCurrency={formatCurrency}
                        />
                    ) : (
                        <p className="text-center text-gray-500 my-8">No customizations available for this item.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex items-center justify-between">
                    <div className="text-left">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Price</p>
                        <p className="text-2xl font-black text-blue-600">{formatCurrency(itemTotal)}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {tCommon('cancel')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200"
                        >
                            {tRestaurant('addToCart')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
