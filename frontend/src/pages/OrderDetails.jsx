import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { canCustomerCancel, formatDate, money } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import StateMessage from '../components/StateMessage';
import '../styles/Orders.css';

export default function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    orderService.get(id)
      .then((o) => { if (!cancelled) setOrder(o); })
      .catch((e) => { if (!cancelled) setError(e.response?.status === 404 ? 'Order not found.' : getErrorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const cancel = async () => {
    setCancelling(true);
    try {
      setOrder(await orderService.cancel(order.id));
      toast.success('Order cancelled.');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  if (loading) return <div className="container section"><Loading label="Loading order…" /></div>;
  if (error || !order) {
    return (
      <div className="container section">
        <StateMessage type="error" title="Order unavailable" message={error}>
          <Link to="/my-orders" className="btn btn-primary">Back to my orders</Link>
        </StateMessage>
      </div>
    );
  }

  return (
    <div className="container section narrow">
      {location.state?.justPlaced && (
        <div className="alert alert-success" role="status">
          <strong>Thank you! Your order has been placed.</strong> {order.paymentNote}
        </div>
      )}
      <div className="page-head page-head-row">
        <div><h1>Order {order.orderNumber}</h1><p className="muted">Placed {formatDate(order.createdAt)}</p></div>
        <StatusBadge status={order.status} />
      </div>

      <div className="panel">
        <h2>Items</h2>
        <table className="table">
          <thead><tr><th>Product</th><th className="num">Price</th><th className="num">Qty</th><th className="num">Subtotal</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.productName}</td><td className="num">{money(i.unitPrice)}</td><td className="num">{i.quantity}</td><td className="num">{money(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan="3">Total</td><td className="num"><strong>{money(order.totalAmount)}</strong></td></tr></tfoot>
        </table>
      </div>

      <div className="panel">
        <h2>Shipping address</h2>
        <p className="pre">{order.shippingAddress}</p>
      </div>

      <div className="order-actions">
        <Link to="/my-orders" className="btn btn-ghost">← All orders</Link>
        {canCustomerCancel(order.status) && <button type="button" className="btn btn-danger" onClick={() => setConfirmCancel(true)}>Cancel order</button>}
      </div>

      <ConfirmDialog open={confirmCancel} title="Cancel this order?" message="Items will be returned to stock. This cannot be undone."
        confirmLabel="Yes, cancel order" danger busy={cancelling} onConfirm={cancel} onCancel={() => setConfirmCancel(false)} />
    </div>
  );
}
