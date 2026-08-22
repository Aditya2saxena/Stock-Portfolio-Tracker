import React from 'react';
import { FolderPlus, Plus } from 'lucide-react';

const EmptyState = ({ onAddClick }) => {
  return (
    <div
      className="fintech-card"
      style={{
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-accent-light)',
          color: 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <FolderPlus size={32} />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        Your portfolio is empty
      </h3>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
        Start building your investment portfolio by adding your first stock to track live prices and performance.
      </p>

      {onAddClick && (
        <button onClick={onAddClick} className="btn-primary">
          <Plus size={18} />
          Add Stock
        </button>
      )}
    </div>
  );
};

export default EmptyState;
