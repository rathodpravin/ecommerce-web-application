import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import StateMessage from '../components/StateMessage';
import '../styles/Home.css';

function Section({ title, subtitle, link, linkLabel, products }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div><h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}</div>
          <Link to={link} className="link-more">{linkLabel} →</Link>
        </div>
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [state, setState] = useState({ loading: true, error: null, newest: [], budget: [], categories: [] });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [newest, budget, categories] = await Promise.all([
        productService.list({ size: 4, sortBy: 'createdAt', direction: 'desc' }),
        productService.list({ size: 4, sortBy: 'price', direction: 'asc' }),
        productService.categories(),
      ]);
      setState({ loading: false, error: null, newest: newest.content, budget: budget.content, categories });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: getErrorMessage(e, 'Could not load products.') }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { loading, error, newest, budget, categories } = state;

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">Welcome to ShopEase</span>
            <h1>Find something you'll love.</h1>
            <p>Browse our catalogue, add items to your cart and place your order in a few clicks.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">Shop Now</Link>
              <Link to="/register" className="btn btn-light btn-lg">Create account</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-blob b1" /><div className="hero-blob b2" /><div className="hero-blob b3" />
          </div>
        </div>
      </section>

      {loading && <div className="container section"><Loading label="Loading products…" /></div>}

      {!loading && error && (
        <div className="container section">
          <StateMessage type="error" title="We couldn't load the store" message={error}>
            <button type="button" className="btn btn-primary" onClick={load}>Try again</button>
          </StateMessage>
        </div>
      )}

      {!loading && !error && newest.length === 0 && (
        <div className="container section">
          <StateMessage title="No products yet" message="The store is empty right now. Please check back soon." />
        </div>
      )}

      {!loading && !error && newest.length > 0 && (
        <>
          {categories.length > 0 && (
            <section className="section section-tint">
              <div className="container">
                <div className="section-head"><h2>Shop by category</h2></div>
                <div className="category-row">
                  {categories.map((c) => (
                    <Link key={c} className="category-chip" to={`/products?category=${encodeURIComponent(c)}`}>{c}</Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          <Section title="New arrivals" subtitle="The latest products added to the store." link="/products?sort=createdAt,desc" linkLabel="View all" products={newest} />

          <section className="section">
            <div className="container promo-grid">
              <Link to="/products?sort=createdAt,desc" className="promo promo-a">
                <span className="promo-tag">Just in</span><h3>See what's new</h3><p>Fresh products, added regularly.</p>
              </Link>
              <Link to="/register" className="promo promo-b">
                <span className="promo-tag">Members</span><h3>Create a free account</h3><p>Save your cart and track your orders.</p>
              </Link>
            </div>
          </section>

          <Section title="Budget picks" subtitle="Our lowest-priced products." link="/products?sort=price,asc" linkLabel="Shop by price" products={budget} />
        </>
      )}
    </>
  );
}
