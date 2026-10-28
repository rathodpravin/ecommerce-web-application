import { Fragment, useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ALL_STATUSES, NEXT_STATUSES, formatDate, money } from '../../utils/format';
import StatusBadge from '../StatusBadge';
import ConfirmDialog from '../ConfirmDialog';
import Pagination from '../Pagination';
import Loading from '../Loading';
import StateMessage from '../StateMessage';

export default function AdminOrders() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null); // { order, next }
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminService.orders({ status, page, size: 10 })
      .then(setData)
      .catch((e) => setError(getErrorMessage(e, 'Could not load orders.')))
      .finally(() => setLoading(false));
  }, [status, page]);
  useEffect(() => { load(); }, [load]);

  const apply = async () => {
    setSaving(true);
    try {
      const updated = await adminService.updateOrderStatus(pending.order.id, pending.next);
      setData((d) => ({ ...d, content: d.content.map((o) => (o.id === updated.id ? updated : o)) }));
      toast.success(`Order ${updated.orderNumber} is now ${updated.status}.`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Orders</h2>
        <label className="field-inline"><span>Status</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="">All</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {loading && <Loading label="Loading orders…" />}
      {!loading && error && <StateMessage type="error" title="Couldn't load orders" message={error}><button type="button" className="btn btn-primary" onClick={load}>Try again</button></StateMessage>}
      {!loading && !error && data?.content.length === 0 && <StateMessage title="No orders found" message={status ? 'No orders have this status.' : 'Orders will appear here once customers check out.'} />}

      {!loading && !error && data?.content.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th className="num">Total</th><th>Status</th><th>Update status</th></tr></thead>
              <tbody>
                {data.content.map((o) => {
                  const next = NEXT_STATUSES[o.status] || [];
                  return (
                    <Fragment key={o.id}>
                      <tr>
                        <td><button type="button" className="link-muted" onClick={() => setExpanded(expanded === o.id ? null : o.id)} aria-expanded={expanded === o.id}>{o.orderNumber}</button></td>
                        <td>{o.customerName}<br /><span className="muted small">{o.customerEmail}</span></td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td className="num">{money(o.totalAmount)}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td>
                          {next.length === 0 ? <span className="muted small">Final</span> : (
                            <select aria-label={`Change status of ${o.orderNumber}`} value="" onChange={(e) => e.target.value && setPending({ order: o, next: e.target.value })}>
                              <option value="">Change to…</option>
                              {next.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>
                      {expanded === o.id && (
                        <tr className="row-detail">
                          <td colSpan="6">
                            <strong>Ship to:</strong> <span className="pre">{o.shippingAddress}</span>
                            <ul className="detail-items">{o.items.map((i) => <li key={i.id}>{i.productName} × {i.quantity} — {money(i.subtotal)}</li>)}</ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={!!pending} title="Update order status?"
        message={pending ? `Change ${pending.order.orderNumber} from ${pending.order.status} to ${pending.next}?${pending.next === 'CANCELLED' ? ' Stock will be restored.' : ''}` : ''}
        confirmLabel="Update" danger={pending?.next === 'CANCELLED'} busy={saving} onConfirm={apply} onCancel={() => setPending(null)} />
    </div>
  );
}
