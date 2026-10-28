import { useState } from 'react';
import AdminOverview from '../components/admin/AdminOverview';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCustomers from '../components/admin/AdminCustomers';
import '../styles/AdminDashboard.css';

const TABS = [
  { id: 'overview', label: 'Overview', Component: AdminOverview },
  { id: 'products', label: 'Products', Component: AdminProducts },
  { id: 'orders', label: 'Orders', Component: AdminOrders },
  { id: 'customers', label: 'Customers', Component: AdminCustomers },
];

/** Reached only via <ProtectedRoute adminOnly>. Every API call below is ALSO checked by the backend. */
export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const Active = TABS.find((t) => t.id === tab).Component;

  return (
    <div className="container section">
      <div className="page-head"><h1>Admin dashboard</h1></div>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <Active />
    </div>
  );
}
