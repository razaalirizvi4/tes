'use client';

import { useCurrency } from '@/hooks/useCurrency';
import { useTranslations } from 'next-intl';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: any;
    restaurantCurrency?: string | null;
}

export default function ReceiptModal({ isOpen, onClose, receiptData, restaurantCurrency }: ReceiptModalProps) {
    const { formatCurrency } = useCurrency(restaurantCurrency);
    const tOrder = useTranslations('order');
    const tCart = useTranslations('cart');
    const tMessages = useTranslations('messages');
    const tCommon = useTranslations('common');

    if (!isOpen || !receiptData) return null;

    const data = receiptData.jsonData;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold">{tOrder('orderDetails')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label={tCommon('close')}>
                        ✕
                    </button>
                </div>

                {/* Start Print Area */}
                <div id="receipt-print" className="bg-white p-4 font-mono text-sm">
                    <div className="text-center mb-4">
                        <h1 className="text-lg font-bold">{data.restaurant.name}</h1>
                        <p>{data.restaurant.address}</p>
                        <p>{data.restaurant.city}</p>
                    </div>

                    <div className="border-t border-b border-dashed py-2 mb-4">
                        <p>{tOrder('orderNumber')}: {data.order.id.slice(-8)}</p>
                        <p>Date: {new Date(data.order.date).toLocaleString()}</p>
                        <p>{tCommon('status')}: {data.order.type.toUpperCase()}</p>
                    </div>

                    <div className="mb-4">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="mb-2">
                                <div className="flex justify-between">
                                    <span>
                                        {item.name} x {item.quantity}
                                    </span>
                                    <span>{formatCurrency(item.total)}</span>
                                </div>
                                {item.options?.selectedAddons && item.options.selectedAddons.length > 0 && (
                                    <div className="text-[10px] text-gray-500 pl-2">
                                        {item.options.selectedAddons.map((addon: any, aidx: number) => (
                                            <span key={aidx}>
                                                + {addon.optionName}
                                                {aidx < item.options.selectedAddons.length - 1 ? ', ' : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed pt-2 space-y-1">
                        <div className="flex justify-between">
                            <span>{tCart('subtotal')}</span>
                            <span>{formatCurrency(data.totals.subtotal)}</span>
                        </div>
                        {data.totals.tax > 0 && (
                            <div className="flex justify-between">
                                <span>{tCart('tax')}</span>
                                <span>{formatCurrency(data.totals.tax)}</span>
                            </div>
                        )}
                        {data.totals.serviceCharge > 0 && (
                            <div className="flex justify-between">
                                <span>Service Charge</span>
                                <span>{formatCurrency(data.totals.serviceCharge)}</span>
                            </div>
                        )}
                        {data.totals.discount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>{tCart('discountApplied') ?? 'Discount'}</span>
                                <span>-{formatCurrency(data.totals.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                            <span>{tCart('total')}</span>
                            <span>{formatCurrency(data.totals.total)}</span>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs">
                        <p>{tMessages('success')}</p>
                    </div>
                </div>
                {/* End Print Area */}

                <div className="mt-8 flex space-x-3 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Print Receipt
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        {tCommon('close')}
                    </button>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print, #receipt-print * {
            visibility: visible;
          }
          #receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
        </div>
    );
}
