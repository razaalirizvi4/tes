import React from "react";


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AddressModal({ isOpen, children }: ModalProps) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          {children}
          <div className="mt-4 flex justify-end gap-3">
            {/* <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Close
            </button> */}
          </div>
        </div>
      </div>
    );
  }