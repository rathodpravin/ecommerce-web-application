import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate, money } from '../../utils/format';
import StatusBadge from '../StatusBadge';
import Loading from '../Loading';
import StateMessage from '../StateMessage';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    setData(null);
    adminService.dashboard().then(setData).catch((e) => setError(getErrorMessage(e, 'Could not load dashboard.')));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <StateMessage type="error" title="Dashboard unavailable" message={error}><button type="button" className="btn btn-primary" onClick={load}>Try again</button></StateMessage>;
  if (!data) return <Loading label="Loading dashboard…" />;

  const stats = [
    { label: 'Products', value: data.totalProducts },
    { label: 'Customers', value: data.totalCustomers },
    { label: 'Orders', value: data.totalOrders },
    { label: 'Revenue (excl. cancelled)', value: money(data.totalRevenue) },
    { label: 'Low-stock products (≤5)', value: data.lowStockProducts },
  ];

  return (
    <>
      <div className="stat-grid">
        {stats.map((s) => <div key={s.label} className="stat"><span className="stat-label">{s.label}</span><span className="stat-value">{s.value}</span></div>)}
      </div>

      <div className="panel">
        <h2>Orders by status</h2>
        <div className="status-row">
          {Object.entries(data.ordersByStatus).map(([status, count]) => (
            <div key={status} className="status-count"><StatusBadge status={status} /><strong>{count}</strong></div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Recent orders</h2>
        {data.recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}><td>{o.orderNumber}</td><td>{o.customerName}</td><td>{formatDate(o.createdAt)}</td><td><StatusBadge status={o.status} /></td><td className="num">{money(o.totalAmount)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
