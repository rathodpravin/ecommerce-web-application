import { useCallback, useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { money } from '../../utils/format';
import ProductForm from './ProductForm';
import ProductImage from '../ProductImage';
import ConfirmDialog from '../ConfirmDialog';
import Pagination from '../Pagination';
import Loading from '../Loading';
import StateMessage from '../StateMessage';

export default function AdminProducts() {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list, {} = create, product = edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    productService.list({ page, size: 10, sortBy: 'createdAt', direction: 'desc' })
      .then(setData)
      .catch((e) => setError(getErrorMessage(e, 'Could not load products.')))
      .finally(() => setLoading(false));
  }, [page]);
  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await productService.remove(toDelete.id);
      toast.success('Product deleted.');
      setToDelete(null);
      if (data.content.length === 1 && page > 0) setPage(page - 1); else load();
    } catch (e) {
      toast.error(getErrorMessage(e)); // e.g. 409: product is in past orders
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    return <ProductForm product={editing.id ? editing : null} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Products</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({})}>+ New product</button>
      </div>

      {loading && <Loading label="Loading products…" />}
      {!loading && error && <StateMessage type="error" title="Couldn't load products" message={error}><button type="button" className="btn btn-primary" onClick={load}>Try again</button></StateMessage>}
      {!loading && !error && data?.content.length === 0 && <StateMessage title="No products yet" message="Create your first product to start selling." />}

      {!loading && !error && data?.content.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th className="num">Actions</th></tr></thead>
              <tbody>
                {data.content.map((p) => (
                  <tr key={p.id}>
                    <td><div className="cell-product"><ProductImage src={p.imageUrl} alt="" /><span>{p.name}</span></div></td>
                    <td>{p.category}</td>
                    <td className="num">{money(p.price)}</td>
                    <td className="num">{p.stockQuantity <= 5 ? <span className="stock stock-low">{p.stockQuantity}</span> : p.stockQuantity}</td>
                    <td className="num">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>Edit</button>{' '}
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={!!toDelete} title="Delete product?" message={toDelete ? `“${toDelete.name}” will be permanently removed from the store and from all carts.` : ''}
        confirmLabel="Delete" danger busy={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
