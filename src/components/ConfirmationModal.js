import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, messages = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full flex flex-col border border-yellow-400">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-yellow-300">{title || 'Confirmation'}</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {messages.map((msg, index) => (
            <p key={index} className="text-gray-300">
              {msg}
            </p>
          ))}
        </div>

        {/* Footer with Action Buttons */}
        <div className="bg-gray-900 px-6 py-4 border-t border-gray-700 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
