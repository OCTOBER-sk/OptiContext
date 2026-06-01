import React from 'react';
import { Outlet } from 'react-router-dom';
import { LandingNav } from './LandingNav';

export function LandingLayout() {
  return (
    <div style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <LandingNav />
      <Outlet />
    </div>
  );
}
