import React from 'react';
import './styles/Modal.css'; // Keep this import for any useful base styles

const WarningModal = ({ isOpen, onClose, onConfirm, warnings }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div
        className="modal-container"
        style={{
          background: '#1A202C',
          border: '1px solid #2D3748',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
          color: '#E2E8F0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ padding: '20px' }}>
          <h2
            style={{
              color: '#F0A500',
              textAlign: 'center',
              marginBottom: '15px',
              fontSize: '1.5rem',
            }}
          >
            Warning
          </h2>
          {warnings.map((warning, index) => (
            <p
              key={index}
              style={{
                marginBottom: '10px',
                color: '#FBD38D',
                textAlign: 'center',
              }}
            >
              {warning}
            </p>
          ))}
          <p
            style={{
              marginTop: '20px',
              textAlign: 'center',
              color: '#E2E8F0',
            }}
          >
            Do you still want to proceed with listing?
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '15px 20px',
            borderTop: '1px solid #2D3748',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#4A5568',
              color: '#E2E8F0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              background: '#F0A500',
              color: '#1A202C',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background 0.3s',
            }}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;
