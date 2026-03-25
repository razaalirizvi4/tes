'use client';

import { useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { useTranslations } from 'next-intl';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    onPaymentComplete: (method: string, amount: number) => void;
    isLoading: boolean;
    restaurantCurrency?: string | null;
}

export default function PaymentModal({ isOpen, onClose, totalAmount, onPaymentComplete, isLoading, restaurantCurrency }: PaymentModalProps) {
    const [method, setMethod] = useState<'cash' | 'card' | 'qr'>('cash');
    const [receivedAmount, setReceivedAmount] = useState(totalAmount);
    const { formatCurrency } = useCurrency(restaurantCurrency);

    const tOrder = useTranslations('order');
    const tDashboard = useTranslations('dashboard');
    const tCommon = useTranslations('common');
    const tMessages = useTranslations('messages');

    if (!isOpen) return null;

    const change = Math.max(0, receivedAmount - totalAmount);

    const paymentMethodLabel = (m: 'cash' | 'card' | 'qr') => {
        switch (m) {
            case 'cash':
                return tDashboard('cash');
            case 'card':
                return tDashboard('card');
            case 'qr':
            default:
                return tDashboard('digital');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">{tOrder('payment')}</h2>

                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-1">{tOrder('totalAmountLabel')}</p>
                    <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(totalAmount)}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {tOrder('paymentMethod')}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['cash', 'card', 'qr'] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={`py-2 px-4 rounded border text-sm capitalize ${method === m
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300'
                                        }`}
                                >
                                    {paymentMethodLabel(m)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {method === 'cash' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {tDashboard('cashInHand')}
                            </label>
                            <input
                                type="number"
                                value={receivedAmount}
                                onChange={(e) => setReceivedAmount(Number(e.target.value || 0))}
                                className="w-full border rounded p-2 text-lg"
                            />
                            <div className="flex space-x-2 mt-2">
                                {[totalAmount, 500, 1000, 5000].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setReceivedAmount(val)}
                                        className="bg-gray-100 hover:bg-gray-200 text-xs py-1 px-2 rounded"
                                    >
                                        {formatCurrency(val)}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded">
                                <p className="text-sm text-blue-700">
                                    {tDashboard('cashInHand')} - {tOrder('totalAmountLabel')}
                                </p>
                                <p className="text-xl font-bold text-blue-900">
                                    {formatCurrency(change)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        {tCommon('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onPaymentComplete(method, receivedAmount)}
                        disabled={isLoading || (method === 'cash' && receivedAmount < totalAmount)}
                        className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? tMessages('loading') : tCommon('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
