'use client';

import { useState, useEffect } from 'react';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CalculatorIcon,
    XMarkIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { authService } from '@/services/authService';
import { useCurrency } from '@/hooks/useCurrency';
import { useTranslations } from 'next-intl';

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: string;
    currentShift: any;
    onShiftUpdate: (shift: any) => void;
    restaurantCurrency?: string | null;
}

export default function ShiftModal({ isOpen, onClose, restaurantId, currentShift, onShiftUpdate, restaurantCurrency }: ShiftModalProps) {
    const [openingFloat, setOpeningFloat] = useState<string>('');
    const [cashAmount, setCashAmount] = useState<string>('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'close'>('overview');
    const { formatCurrency, currencySymbol } = useCurrency(restaurantCurrency);
    const tDashboard = useTranslations('dashboard');
    const tCommon = useTranslations('common');

    // For closing shift logic
    const [countedCash, setCountedCash] = useState<string>('');

    // Refresh shift data when modal opens
    const [shiftData, setShiftData] = useState<any>(currentShift);

    useEffect(() => {
        if (isOpen && currentShift) {
            // Re-fetch latest shift data to get up-to-date totals
            fetchShiftData();
        } else {
            setShiftData(currentShift); // Reset or set to null
        }
    }, [isOpen, currentShift]);

    const fetchShiftData = async () => {
        try {
            const token = await authService.getAccessToken();
            if (!token) return;
            const res = await fetch(`/api/pos/shift?restaurantId=${restaurantId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!data.error) {
                setShiftData(data);
            }
        } catch (error) {
            console.error("Failed to refresh shift data", error);
        }
    };

    if (!isOpen) return null;

    const handleOpenShift = async () => {
        if (!openingFloat || parseFloat(openingFloat) < 0) return;
        setIsLoading(true);
        try {
            const token = await authService.getAccessToken();
            if (!token) return;
            const res = await fetch('/api/pos/shift', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    restaurantId,
                    action: 'open',
                    openingFloat: parseFloat(openingFloat)
                })
            });
            const data = await res.json();
            if (res.ok) {
                onShiftUpdate(data);
                onClose();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error opening shift:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCashTransaction = async (action: 'cash-in' | 'cash-out') => {
        if (!cashAmount || parseFloat(cashAmount) <= 0) return;
        setIsLoading(true);
        try {
            const token = await authService.getAccessToken();
            if (!token) return;
            const res = await fetch('/api/pos/shift', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    restaurantId,
                    action,
                    cashAmount: parseFloat(cashAmount),
                    reason
                })
            });
            const data = await res.json();
            if (res.ok) {
                // Refresh local data
                await fetchShiftData();
                setCashAmount('');
                setReason('');
                alert("Transaction recorded successfully");
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error recording cash transaction:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseShift = async () => {
        if (!countedCash || parseFloat(countedCash) < 0) return;
        setIsLoading(true);
        const finalCash = parseFloat(countedCash);

        try {
            const token = await authService.getAccessToken();
            if (!token) return;
            const res = await fetch('/api/pos/shift', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    restaurantId,
                    action: 'close',
                    cashAmount: finalCash
                })
            });
            const data = await res.json();
            if (res.ok) {
                onShiftUpdate(null);
                onClose();
                setCountedCash('');
                setActiveTab('overview');
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error closing shift:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Variance
    const expectedCash = shiftData?.expectedCash || 0;
    const actualCash = parseFloat(countedCash || '0');
    const variance = actualCash - expectedCash;

    // --- RENDER: START SHIFT ---
    if (!shiftData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                        <BanknotesIcon className="h-12 w-12 mx-auto mb-3 opacity-90" />
                        <h2 className="text-2xl font-bold">{tDashboard('startShift')}</h2>
                        <p className="opacity-80 text-sm mt-1">{tDashboard('enterOpeningBalance')}</p>
                    </div>

                    <div className="p-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {tDashboard('openingBalance')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{currencySymbol}</span>
                            <input
                                type="number"
                                value={openingFloat}
                                onChange={(e) => setOpeningFloat(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 text-lg font-bold transition-colors"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors">
                                {tCommon('cancel')}
                            </button>
                            <button
                                onClick={handleOpenShift}
                                disabled={isLoading || !openingFloat}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                            >
                                {isLoading ? tDashboard('loadingRestaurants') : tDashboard('startShift')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: MANAGE SHIFT ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{tDashboard('shiftSummary')}</h2>
                        <span className="text-xs font-medium  text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            Active since {new Date(shiftData.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-4 text-base font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary-600 text-primary-600 bg-slate-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tDashboard('overview')}
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`flex-1 py-4 text-base font-semibold border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-primary-600 bg-slate-50 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tDashboard('transactions')}
                    </button>
                    <button
                        onClick={() => setActiveTab('close')}
                        className={`flex-1 py-4 text-base font-semibold border-b-2 transition-colors ${activeTab === 'close' ? 'border-primary-600 bg-slate-50 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tDashboard('endShift') ?? 'End Shift'}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-gray-50 flex-1">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-full w-2 bg-primary-500"></div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">{tDashboard('expectedAmount')}</h3>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(expectedCash)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-sm text-gray-500 font-medium uppercase">{tDashboard('openingBalance')}</p>
                                    <p className="text-xl mt-1 font-bold text-gray-800">{formatCurrency(shiftData.openingFloat)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-sm text-green-600 font-medium uppercase">{tDashboard('totalSales')}</p>
                                    <p className="text-xl mt-1 font-bold text-gray-800">{formatCurrency(shiftData.cashSales || 0)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-sm text-blue-600 font-medium uppercase">{tDashboard('cashIn')}</p>
                                    <p className="text-xl mt-1 font-bold text-gray-800">{formatCurrency(shiftData.transactions?.filter((t: any) => t.type === 'IN').reduce((acc: number, t: any) => acc + t.amount, 0) || 0)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-sm text-red-500 font-medium uppercase">{tDashboard('cashOut')}</p>
                                    <p className="text-xl mt-1 font-bold text-gray-800">{formatCurrency(shiftData.transactions?.filter((t: any) => t.type === 'OUT').reduce((acc: number, t: any) => acc + t.amount, 0) || 0)}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-blue-800">{tDashboard('systemBalanceCheck')}</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        {tDashboard('expectedAmount')} = {tDashboard('openingBalance')} ({shiftData.openingFloat}) + {tDashboard('totalSales')} ({shiftData.cashSales || 0}) + {tDashboard('cashIn')} - {tDashboard('cashOut')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TRANSACTIONS TAB */}
                    {activeTab === 'transactions' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <h3 className="font-bold text-gray-800">{tDashboard('addOrRemoveCash')}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{tDashboard('amount')}</label>
                                    <input
                                        type="number"
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        className="w-full border rounded-lg p-3 text-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{tDashboard('reason')}</label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full border rounded-lg p-3"
                                        placeholder="e.g., Buying supplies, change refill"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <button
                                        onClick={() => handleCashTransaction('cash-in')}
                                        disabled={isLoading || !cashAmount}
                                        className="py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium flex items-center justify-center gap-2"
                                    >
                                        <ArrowTrendingUpIcon className="w-5 h-5" />
                                        {tDashboard('cashIn')}
                                    </button>
                                    <button
                                        onClick={() => handleCashTransaction('cash-out')}
                                        disabled={isLoading || !cashAmount}
                                        className="py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2"
                                    >
                                        <ArrowTrendingDownIcon className="w-5 h-5" />
                                        {tDashboard('cashOut')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLOSE SHIFT TAB */}
                    {activeTab === 'close' && (
                        <div className="space-y-6">
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                                <div className="bg-red-100 p-2 rounded-full h-fit">
                                    <CalculatorIcon className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-900">{tDashboard('endOfShiftReconciliation')}</h3>
                                    <p className="text-sm text-red-700 mt-1">{tDashboard('pleaseCountThePhysicalCashInYourDrawerAndEnterItBelow')}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{tDashboard('physicalCashCount')}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            value={countedCash}
                                            onChange={(e) => setCountedCash(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-0 text-xl font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {countedCash && (
                                    <div className={`p-4 rounded-lg mb-6 flex justify-between items-center ${variance === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                                        <span className="font-medium">{tDashboard('variance')}</span>
                                        <span className="font-bold text-lg">
                                            {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <button
                                    onClick={handleCloseShift}
                                    disabled={isLoading || !countedCash}
                                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                                >
                                    {isLoading ? 'Closing Shift...' : 'Confirm & Close Shift'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
