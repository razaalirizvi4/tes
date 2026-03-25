'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PaymentModal from '@/components/pos/PaymentModal';
import POSAddonModal from '@/components/pos/POSAddonModal';
import ReceiptModal from '@/components/pos/ReceiptModal';
import ShiftModal from '@/components/pos/ShiftModal';
import { useCurrency } from '@/hooks/useCurrency';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useStore';
import { MenuItem as BaseMenuItem, SelectedAddon } from '@/types';
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  taxRate?: number;
  serviceChargeRate?: number;
  isTaxIncluded?: boolean;
  currency?: string | null;
}

interface MenuItem extends BaseMenuItem {}

interface CartItem {
  id?: string; // unique id for each cart entry (menuItemId + options hash)
  menuItemId: string;
  name: string;
  price: number; // base price + addons total
  basePrice: number;
  quantity: number;
  selectedAddons: SelectedAddon[];
}

interface POSOrder {
  id: string;
  orderId: string; // Add this
  order?: { id: string }; // Optional relation
  type: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  notes?: string;
  items?: any[];
}

interface Shift {
  id: string;
  openedAt: string;
  openingFloat: number;
  cashIn: number;
  cashOut: number;
  cashSales: number;
  cardSales: number;
  qrSales: number;
  expectedCash?: number;
}

export default function POSPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const vendorId = !isSuperAdmin ? user?.vendorProfile?.id : undefined;
  const isVendor = Boolean(vendorId);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [activeOrders, setActiveOrders] = useState<POSOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<POSOrder | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const tDashboard = useTranslations("dashboard");
  const tOrder = useTranslations("order");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");

  // New state for payment/receipt
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [itemPendingAddons, setItemPendingAddons] = useState<MenuItem | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use ref to track active POSOrder ID (internal) to prevent infinite loop in useEffect
  const orderIdRef = useRef<string | null>(null);

  // Use currency hook for proper currency display
  const { formatCurrency } = useCurrency(selectedRestaurant?.currency);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync orderIdRef when currentOrder.id changes
  useEffect(() => {
    if (currentOrder?.id) {
      orderIdRef.current = currentOrder.id;
    } else {
      orderIdRef.current = null;
    }
  }, [currentOrder?.id]);

  // Debounced cart sync - only depends on cart, not currentOrder
  useEffect(() => {
    // Debounced sync when cart changes
    if (orderIdRef.current && cart.length > 0) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncCartWithBackend();
      }, 1000);
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cart]); // Removed currentOrder from dependencies to prevent loop

  useEffect(() => {
    if (vendorId) {
      loadInitialData();
    } else {
      setLoading(false);
    }
  }, [vendorId]);


  const loadInitialData = async () => {
    if (!vendorId) return;
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/restaurants?vendorId=${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const restaurantsData = await res.json();
      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : []);

      // Auto-select if only one restaurant
      if (Array.isArray(restaurantsData) && restaurantsData.length === 1) {
        setSelectedRestaurant(restaurantsData[0]);
        loadRestaurantData(restaurantsData[0].id);
      } else if (Array.isArray(restaurantsData)) {
        const savedId = localStorage.getItem('pos_selected_restaurant');
        if (savedId) {
          const savedRest = restaurantsData.find(r => r.id === savedId);
          if (savedRest) {
            setSelectedRestaurant(savedRest);
            loadRestaurantData(savedRest.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantData = async (restaurantId: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const menuRes = await fetch(`/api/restaurants/${restaurantId}/menu-items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const menuData = await menuRes.json();
      setMenuItems(Array.isArray(menuData) ? menuData : []);

      const shiftRes = await fetch(`/api/pos/shift?restaurantId=${restaurantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const shiftData = await shiftRes.json();
      setCurrentShift(shiftData.error ? null : shiftData);

      const ordersRes = await fetch(`/api/pos/order?restaurantId=${restaurantId}&status=OPEN`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      // ORDERS DATA should now contain `order: { id: ... }` from the include
      setActiveOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    }
  };

  const syncCartWithBackend = async () => {
    if (!orderIdRef.current) return;
    setIsSyncing(true);
    setError(null);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/pos/order/${orderIdRef.current}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            options: { selectedAddons: item.selectedAddons }
          }))
        })
      });
      if (!res.ok) {
        throw new Error('Failed to sync cart');
      }
      const updatedOrder = await res.json();
      // Only update specific fields to avoid triggering infinite loop
      setCurrentOrder(prev => prev ? {
        ...prev,
        totalAmount: updatedOrder.totalAmount,
        taxAmount: updatedOrder.taxAmount,
        serviceCharge: updatedOrder.serviceCharge,
        items: updatedOrder.items,
        orderId: updatedOrder.orderId // Update orderId if changed?
      } : updatedOrder);
    } catch (error) {
      console.error('Error syncing cart:', error);
      setError('Failed to sync cart with server');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    localStorage.setItem('pos_selected_restaurant', restaurant.id);
    loadRestaurantData(restaurant.id);
  };

  const createNewOrder = async () => {
    if (!selectedRestaurant) {
      console.error('No restaurant selected');
      return null;
    }
    if (!currentShift) {
      alert("Please open a shift first");
      setIsShiftModalOpen(true);
      return null;
    }
    const token = await authService.getAccessToken();
    if (!token) {
      alert('Authentication error. Please log in again.');
      return null;
    }
    try {
      console.log('Creating order with:', {
        restaurantId: selectedRestaurant.id,
        type: 'walkin',
        hasToken: !!token
      });

      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          type: 'walkin'
        })
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMessage = responseData?.error || `HTTP ${res.status}: ${res.statusText}`;
        console.error('Order creation failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorMessage,
          responseData
        });
        alert(`Failed to create order: ${errorMessage}`);
        return null;
      }

      if (!responseData?.id) {
        console.error('Order created but missing ID:', responseData);
        alert('Order created but missing ID. Please try again.');
        return null;
      }

      console.log('Order created successfully:', responseData.id);
      setCurrentOrder(responseData);
      orderIdRef.current = responseData.id;
      if (cart.length > 0) setCart([]);
      return responseData;
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create order: ${errorMessage}`);
      return null;
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    if (!currentShift) {
      setIsShiftModalOpen(true);
      return;
    }

    // Check if item has addons
    if (menuItem.addonGroups && menuItem.addonGroups.length > 0) {
      setItemPendingAddons(menuItem);
      setIsAddonModalOpen(true);
      return;
    }

    // Default: No addons
    executeAddToCart(menuItem, []);
  };

  const executeAddToCart = (menuItem: MenuItem, selectedAddons: SelectedAddon[]) => {
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.priceAdjustment, 0);
    const finalPrice = menuItem.price + addonsTotal;
    
    // Create a unique key for grouping same items with same options
    const optionsKey = JSON.stringify(selectedAddons.map(s => s.optionId).sort());
    const cartItemId = `${menuItem.id}-${optionsKey}`;

    const existing = cart.find(item => item.id === cartItemId);
    
    if (existing) {
      setCart(cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: cartItemId,
        menuItemId: menuItem.id,
        name: menuItem.label,
        price: finalPrice,
        basePrice: menuItem.price,
        quantity: 1,
        selectedAddons
      }]);
    }
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== cartItemId));
    } else {
      setCart(cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    // Current simple total, backend will calculate tax/charges
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleProceedToPayment = async () => {
    if (!currentShift) {
      alert("Please open a shift first");
      setIsShiftModalOpen(true);
      return;
    }
    if (!currentOrder?.id) {
      // Create order first if not exists
      const newOrder = await createNewOrder();
      if (!newOrder?.id) {
        // Failed to create order, don't proceed
        return;
      }
    }
    // Final sync before opening modal
    await syncCartWithBackend();
    setIsPaymentModalOpen(true);
  };

  const handleSendToKitchen = async () => {
    if (!currentOrder?.id) return;
    const token = await authService.getAccessToken();
    if (!token) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/pos/order/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            options: { selectedAddons: item.selectedAddons }
          })),
          status: 'PREPARING'
        })
      });
      if (res.ok) {
        // Refresh orders
        if (selectedRestaurant) loadRestaurantData(selectedRestaurant.id);
        setCurrentOrder(null);
        orderIdRef.current = null;
        setCart([]);
      }
    } catch (error) {
      console.error('Error sending to kitchen:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const onPaymentComplete = async (method: string, amount: number) => {
    if (!currentOrder?.id) return;
    const token = await authService.getAccessToken();
    if (!token) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/pos/order/${currentOrder.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method, amount })
      });

      if (res.ok) {
        const receiptRes = await fetch(`/api/pos/order/${currentOrder.id}/receipt`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const receipt = await receiptRes.json();
        setReceiptData(receipt);

        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(true);

        // Reset current order
        setCurrentOrder(null);
        orderIdRef.current = null;
        setCart([]);
        // Refresh active orders
        if (selectedRestaurant) loadRestaurantData(selectedRestaurant.id);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMenuItems = Array.isArray(menuItems) ? menuItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // POS is only for vendors; super admin or non-vendor users see Not Found
  if (!isVendor) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-gray-100">

        {/* POS Header */}
        <div className="bg-white px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-30 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
              <span className="p-1.5 bg-blue-600 rounded-lg">
                <BanknotesIcon className="w-5 h-5 text-white" />
              </span>
              {tDashboard("pos")}
            </h1>
            {selectedRestaurant && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg border border-gray-100 whitespace-nowrap">
                <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold tracking-tight">
                  {selectedRestaurant.name}
                </span>
              </div>
            )}
          </div>
 
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-semibold border ${currentShift
                ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-50'
                : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                }`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>
                {currentShift ? `${tDashboard("shift")} (${new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : `${tDashboard("shift")}`}
              </span>
            </button>
 
            {selectedRestaurant && (
              <button
                onClick={() => {
                  setSelectedRestaurant(null);
                  localStorage.removeItem('pos_selected_restaurant');
                }}
                className="text-gray-400 hover:text-rose-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 group"
              >
                <PlusIcon className="w-4 h-4 rotate-45" />
                <span className="hidden sm:inline">{tDashboard("switchRestaurant")}</span>
              </button>
            )}
          </div>
        </div>

        {!selectedRestaurant ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl mx-auto text-center font-bold text-gray-800 mb-6">{tDashboard("selectRestaurant")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    onClick={() => handleRestaurantSelect(restaurant)}
                    className="bg-white transition-all cursor-pointer border border-gray-200 hover:border-gray-300 px-4 py-6 group"
                  >
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors mb-2 flex items-start gap-2">
                      <BuildingStorefrontIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      {restaurant.name}
                    </h3>
                    <p className="text-gray-600 flex items-start gap-2">
                      <MapPinIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      {restaurant.address}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
 
            {/* LEFT SIDE: MENU & SEARCH */}
            <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 border-r border-gray-200 transition-all duration-300 ${isMobileCartOpen ? 'hidden lg:flex' : 'flex'}`}>
 
              {/* Search & Filters */}
              <div className="p-4 bg-white border-b border-gray-200 flex gap-4 sticky top-0 z-20 shadow-sm">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={tCommon("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 rounded-xl transition-all font-medium text-gray-700 placeholder:text-gray-400"
                  />
                </div>
              </div>
 
              {/* Menu Grid - Standardized for all screens */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <div className="grid grid-cols-2 min-[1600px]:grid-cols-3 gap-4">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-white p-3 rounded-xl cursor-pointer border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all flex gap-4 group active:bg-blue-50/10"
                    >
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-50">
                        <Image
                          src={item.image || "/images/food-placeholder.jpg"}
                          alt={item.label}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                            {item.label}
                          </h3>
                          <div className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block ${
                            item.addonGroups?.length ? 'bg-indigo-50 text-indigo-500' : 'bg-green-50 text-green-500'
                          }`}>
                            {item.addonGroups?.length ? tCommon("customizable") : tCommon("singleItem")}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-gray-900 tracking-tight">
                            {formatCurrency(item.price)}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <PlusIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
 
                {filteredMenuItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-300 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl mx-auto w-full max-w-lg mt-10">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <ArchiveBoxIcon className="w-12 h-12 opacity-30" />
                    </div>
                    <p className="font-black text-xl text-gray-900 uppercase tracking-widest">{tCommon("noItems")}</p>
                    <p className="text-gray-400 mt-2 font-medium">{tCommon("noResults")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: CART & ACTIVE ORDERS */}
            {/* RIGHT SIDE: CART & ACTIVE ORDERS */}
            <div className={`w-full lg:w-[350px] xl:w-[380px] bg-white flex flex-col z-20 border-l border-gray-100 transition-all duration-300 ${isMobileCartOpen ? 'flex fixed inset-0 lg:relative lg:inset-auto z-50' : 'hidden lg:flex'}`}>
              {/* Cart Section */}
              <div className="flex-[3] flex flex-col min-h-0 border-b border-gray-100">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                  <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <ShoppingCartIcon className="w-4 h-4 text-gray-400" />
                    {tCart("cart")}
                    {currentOrder?.orderId && (
                      <span className="text-[10px] text-blue-500 font-bold mx-1">
                        #{currentOrder.orderId.slice(-5)}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={createNewOrder}
                      className="p-1.5 hover:bg-white rounded-md text-blue-500 transition-all border border-transparent hover:border-blue-100"
                      title={tDashboard("newOrder")}
                    >
                    
                    </button>
                    {/* Mobile Close Button */}
                    <button 
                      onClick={() => setIsMobileCartOpen(false)}
                      className="lg:hidden p-1.5 bg-gray-200/50 hover:bg-gray-200 rounded-full transition-colors"
                      title="Close Cart"
                    >
                      <PlusIcon className="w-5 h-5 rotate-45 text-gray-600" />
                    </button>
                  </div>
                </div>
 
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {Array.isArray(cart) && cart.map((item) => (
                    <div key={item.id} className="group border-b border-gray-50 pb-4 last:border-0">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate mb-0.5">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {formatCurrency(item.price)}
                          </p>
                          
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {item.selectedAddons.map((addon, idx) => (
                                <span key={idx} className="inline-block px-1.5 py-0.5 bg-gray-50 text-[9px] text-gray-500 rounded font-medium border border-gray-100">
                                  {addon.optionName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-0.5 border border-gray-100/50">
                          <button
                            onClick={() => item.id && updateCartQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white transition-colors text-gray-400"
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-bold w-4 text-center text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => item.id && updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white transition-colors text-blue-500"
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="text-xs font-bold text-gray-900 w-16 text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
 
                  {(!Array.isArray(cart) || cart.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 min-h-[150px]">
                      <ShoppingCartIcon className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{tCart("empty")}</p>
                    </div>
                  )}
                </div>
 
                {/* Cart Action Buttons */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-400">
                      <span>{tDashboard("subtotal")}</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-gray-900 text-sm uppercase tracking-tight">{tDashboard("total")}</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(currentOrder?.totalAmount || calculateTotal())}
                      </span>
                    </div>
                  </div>
 
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendToKitchen}
                      disabled={cart.length === 0 || isProcessing || isSyncing}
                      className="flex-1 py-3 bg-orange-50 text-orange-600 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-orange-100 disabled:opacity-50 transition-all border border-orange-100/50"
                    >
                      {tDashboard("kitchen")}
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      disabled={cart.length === 0 && (!currentOrder || currentOrder.totalAmount === 0)}
                      className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {tDashboard("payment")}
                    </button>
                  </div>
                </div>
              </div>
 
              {/* Active Orders List (Bottom Container) */}
              <div className="flex-[2] min-h-0 bg-gray-50 flex flex-col overflow-hidden">
                <div className="p-3 bg-white border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">{tOrder("activeOrders")}</h3>
                  <span className="text-[10px] font-bold text-gray-300">{activeOrders.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setCurrentOrder(order);
                        setCart(order.items?.map(item => {
                          const selectedAddons = item.options?.selectedAddons || [];
                          const addonsTotal = selectedAddons.reduce((sum: number, a: any) => sum + (a.priceAdjustment || 0), 0);
                          const optionsKey = JSON.stringify(selectedAddons.map((s: any) => s.optionId).sort());
                          const cartItemId = `${item.menuItemId}-${optionsKey}`;
                          return {
                            id: cartItemId,
                            menuItemId: item.menuItemId,
                            name: item.name,
                            price: item.price,
                            basePrice: item.price - addonsTotal,
                            quantity: item.quantity,
                            selectedAddons
                          };
                        }) || []);
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        currentOrder?.id === order.id 
                          ? 'border-blue-500 bg-white shadow-sm' 
                          : 'border-transparent bg-white/50 hover:bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-gray-900 text-[11px]">#{order.orderId ? order.orderId.slice(-5) : 'ORDER'}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          order.status === 'PREPARING' 
                            ? 'bg-amber-50 text-amber-500' 
                            : 'bg-blue-50 text-blue-500'
                        }`}>
                          {tDashboard(order.status.toLowerCase())}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-bold text-gray-900 text-xs">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                  {activeOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 opacity-30">
                      <p className="text-[9px] font-bold uppercase tracking-widest">{tDashboard("noActiveOrders")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={currentOrder?.totalAmount || calculateTotal()}
        onPaymentComplete={onPaymentComplete}
        isLoading={isProcessing}
        restaurantCurrency={selectedRestaurant?.currency}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptData}
        restaurantCurrency={selectedRestaurant?.currency}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        restaurantId={selectedRestaurant?.id || ''}
        currentShift={currentShift}
        onShiftUpdate={setCurrentShift}
        restaurantCurrency={selectedRestaurant?.currency}
      />

      <POSAddonModal
        isOpen={isAddonModalOpen}
        onClose={() => {
          setIsAddonModalOpen(false);
          setItemPendingAddons(null);
        }}
        menuItem={itemPendingAddons}
        onAddToCart={executeAddToCart}
        restaurantCurrency={selectedRestaurant?.currency}
      />
 
      {/* Mobile View Cart Button */}
      {selectedRestaurant && (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
            className="px-6 py-4 bg-blue-600 text-white rounded-full shadow-2xl flex items-center gap-3 font-bold hover:bg-blue-700 transition-all active:scale-95 border-4 border-white"
          >
            <div className="relative">
              <ShoppingCartIcon className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-blue-600">
                  {cart.length}
                </span>
              )}
            </div>
            <span>
              {isMobileCartOpen 
                ? tDashboard('backToMenu') 
                : tDashboard('viewCart', { amount: formatCurrency(calculateTotal()) })}
            </span>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}