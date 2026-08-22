import React from 'react';

export const SummaryCardSkeleton = () => (
  <div className="fintech-card" style={{ height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="skeleton" style={{ width: '100px', height: '14px' }} />
      <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
    </div>
    <div>
      <div className="skeleton" style={{ width: '140px', height: '28px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ width: '80px', height: '14px' }} />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="fintech-card" style={{ height: '340px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="skeleton" style={{ width: '180px', height: '20px' }} />
      <div className="skeleton" style={{ width: '200px', height: '30px', borderRadius: '20px' }} />
    </div>
    <div className="skeleton" style={{ flex: 1, width: '100%', borderRadius: '12px' }} />
  </div>
);

export const TableSkeleton = () => (
  <div className="fintech-card" style={{ padding: '1rem' }}>
    <div className="skeleton" style={{ width: '150px', height: '24px', marginBottom: '1.25rem' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
      ))}
    </div>
  </div>
);
