import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';
import StateMessage from '../components/StateMessage';
import '../styles/Products.css';

const SORTS = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'price,asc', label: 'Price: low to high' },
  { value: 'price,desc', label: 'Price: high to low' },
  { value: 'name,asc', label: 'Name: A to Z' },
];
const PAGE_SIZE = 12;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'createdAt,desc';
  const page = Math.max(0, (parseInt(params.get('page'), 10) || 1) - 1);

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const update = useCallback((changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page'); // any filter change goes back to page 1
    setParams(next);
  }, [params, setParams]);

  useEffect(() => {
    productService.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const load = useCallback(() => {
    let cancelled = false;
    const [sortBy, direction] = sort.split(',');
    setLoading(true);
    setError(null);
    productService.list({ q, category, page, size: PAGE_SIZE, sortBy, direction })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(getErrorMessage(e, 'Could not load products.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, category, sort, page]);

  useEffect(() => load(), [load]);

  const hasFilters = q || category;

  return (
    <div className="container section">
      <div className="page-head">
        <h1>{category || 'All products'}</h1>
        {q && <p className="muted">Results for “{q}”</p>}
      </div>

      <div className="toolbar">
        <SearchBar initialValue={q} onSearch={(v) => update({ q: v })} />
        <div className="toolbar-selects">
          <label className="field-inline">
            <span>Category</span>
            <select value={category} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field-inline">
            <span>Sort by</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {loading && <Loading label="Loading products…" />}

      {!loading && error && (
        <StateMessage type="error" title="Something went wrong" message={error}>
          <button type="button" className="btn btn-primary" onClick={load}>Try again</button>
        </StateMessage>
      )}

      {!loading && !error && data && data.content.length === 0 && (
        <StateMessage title={hasFilters ? 'No products match your search' : 'No products available'}
          message={hasFilters ? 'Try a different keyword or clear the filters.' : 'Please check back soon.'}>
          {hasFilters && <button type="button" className="btn btn-primary" onClick={() => setParams({})}>Clear filters</button>}
        </StateMessage>
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <>
          <p className="muted result-count">{data.totalElements} product{data.totalElements === 1 ? '' : 's'}</p>
          <div className="product-grid">
            {data.content.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => update({ page: String(p + 1) })} />
        </>
      )}
    </div>
  );
}
