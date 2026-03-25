'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { UserAddress } from '@/types';
import AddressForm from '@/components/AddressForm';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [loading, setLoading] = useState(true);
  
  const loadAddresses = async () => {
    const user = authService.getCurrentUser();
    if (user) {
      try {
        const response = await fetch(`/api/users/${user.id}/addresses`);
        if (!response.ok) throw new Error('Failed to load addresses');
        const data = await response.json();
        setAddresses(data);
      } catch (error) {
        toast.error('Failed to load addresses');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddAddress = async (data: Partial<UserAddress>) => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please log in to add an address');
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to add address');
      
      await loadAddresses();
      setShowAddForm(false);
      toast.success('Address added successfully');
    } catch (error) {
      toast.error('Failed to add address');
      console.error(error);
    }
  };

  const handleUpdateAddress = async (data: Partial<UserAddress>) => {
    if (!editingAddress?.id) return;

    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please log in to update the address');
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/addresses/${editingAddress.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update address');
      
      await loadAddresses();
      setEditingAddress(null);
      toast.success('Address updated successfully');
    } catch (error) {
      toast.error('Failed to update address');
      console.error(error);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please log in to delete the address');
      return;
    }

    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`/api/users/${user.id}/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete address');
      
      await loadAddresses();
      toast.success('Address deleted successfully');
    } catch (error) {
      toast.error('Failed to delete address');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
        >
          Add New Address
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Add New Address</h2>
          <AddressForm
            onSubmit={handleAddAddress}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <div className="grid gap-4">
        {addresses.map((address) => (
          <div key={address.id} className="border p-4 rounded-lg bg-white relative">
            {editingAddress?.id === address.id ? (
              <AddressForm
                initialData={address}
                onSubmit={handleUpdateAddress}
                onCancel={() => setEditingAddress(null)}
                submitLabel="Update Address"
              />
            ) : (
              <>
                {address.isDefault && (
                  <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                    Default
                  </span>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{address.label}</p>
                    <p>{address.streetAddress}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p>{address.phoneNumber}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingAddress(address)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
