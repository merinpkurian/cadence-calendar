import React from 'react';
import { Outlet } from 'react-router-dom';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
};
