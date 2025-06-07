import React from 'react';
import { NavLink } from 'react-router-dom';

const SidebarNav: React.FC = () => (
  <aside className="sidebar-nav">
    <nav>
      <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
        Market
      </NavLink>
      {/* Add more links as needed */}
      {/* <NavLink to="/test-market" className={({ isActive }) => isActive ? 'active' : ''}>Test Market</NavLink>
      <NavLink to="/spanish-bodega" className={({ isActive }) => isActive ? 'active' : ''}>Spanish Bodega</NavLink> */}
    </nav>
  </aside>
);

export default SidebarNav;