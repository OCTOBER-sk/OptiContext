import React from 'react';
import { Outlet } from 'react-router-dom';

export function PageLayout() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <main id="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
