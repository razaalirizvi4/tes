"use client";

import { AddonGroup } from '@/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import AddonGroupForm from './AddonGroupForm';
interface AddonGroupManagerProps {
  restaurantId: string;
}

export default function AddonGroupManager({ restaurantId }: AddonGroupManagerProps) {
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tVendor = useTranslations("vendor.addonGroup");
  const tCommon = useTranslations("common");

  useEffect(() => {
    fetchGroups();
  }, [restaurantId]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/restaurants/${restaurantId}/addon-groups`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch addon groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!window.confirm(tVendor('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/addon-groups/${groupId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGroups(groups.filter(g => g.id !== groupId));
      }
    } catch (error) {
      console.error('Failed to delete addon group:', error);
    }
  };

  if (isLoading) return <div>{tCommon('loading')}</div>;

  if (isCreating || editingGroup) {
    return (
      <AddonGroupForm
        restaurantId={restaurantId}
        initialData={editingGroup || undefined}
        onSave={() => {
          setIsCreating(false);
          setEditingGroup(null);
          fetchGroups();
        }}
        onCancel={() => {
          setIsCreating(false);
          setEditingGroup(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{tVendor('title')}</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + {tVendor('addGroup')}
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-gray-500">{tVendor('noGroupsConfigured')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="border p-4 rounded bg-white shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <p className="text-xs text-gray-500">
                    {group.isRequired ? tCommon('required') : tVendor('optional')} &middot; {group.selectionType === 'SINGLE' ? tVendor('singleSelect') : tVendor('multiSelect', { max: group.maxSelections || tVendor('unlimited') })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditingGroup(group)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">{tCommon('edit')}</button>
                  <button onClick={() => handleDelete(group.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">{tCommon('delete')}</button>
                </div>
              </div>

              <div className="mt-2 space-y-1 flex-grow">
                {group.options.map((opt) => (
                  <div key={opt.id} className="flex justify-between text-sm py-1 border-b last:border-0 border-gray-100">
                    <span className="flex items-center gap-2">
                      {opt.image && (
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border">
                          <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      {opt.name}
                      {opt.isDefault && <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-800 font-medium">{tVendor('default')}</span>}
                      {opt.linkedMenuItemId && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-medium">{tVendor('linkedItem')}</span>}
                    </span>
                    <span className="text-gray-600 font-medium">
                      {opt.priceAdjustment > 0 ? '+' : ''}{opt.priceAdjustment === 0 ? '$0.00' : `$${opt.priceAdjustment.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
