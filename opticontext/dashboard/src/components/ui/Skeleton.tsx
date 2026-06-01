import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  lines?: number;
  gap?: number;
}

/** Single skeleton block */
export function Skeleton({ width, height, borderRadius, className = '' }: SkeletonProps) {
  return (
    <div
      className={['skeleton', className].join(' ')}
      style={{ width, height: height ?? '1rem', borderRadius: borderRadius ?? '4px' }}
      aria-hidden="true"
    />
  );
}

/** Multi-line text skeleton */
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={['card', className].join(' ')} aria-hidden="true">
      <Skeleton width="40%" height="1rem" className="mb-3" />
      <Skeleton width="60%" height="2rem" className="mb-2" />
      <Skeleton width="80%" height="0.75rem" />
    </div>
  );
}
