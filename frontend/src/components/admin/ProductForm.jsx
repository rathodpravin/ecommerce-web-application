import { useState } from 'react';
import { productService } from '../../services/productService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const EMPTY = { name: '', description: '', price: '', stockQuantity: '', category: '', imageUrl: '' };

export default function ProductForm({ product, onSaved, onCancel }) {
  const toast = useToast();
  const editing = !!product;
  const [form, setForm] = useState(editing ? {
    name: product.name, description: product.description || '', price: String(product.price),
    stockQuantity: String(product.stockQuantity), category: product.category, imageUrl: product.imageUrl || '',
  } : EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Name is required.';
    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0.01) er.price = 'Price must be at least 0.01.';
    else if (!/^\d{1,8}(\.\d{1,2})?$/.test(form.price)) er.price = 'Use at most 2 decimal places.';
    const stock = Number(form.stockQuantity);
    if (form.stockQuantity === '' || !Number.isInteger(stock) || stock < 0) er.stockQuantity = 'Stock must be a whole number, 0 or more.';
    if (!form.category.trim()) er.category = 'Category is required.';
    if (form.imageUrl && !/^https?:\/\//i.test(form.imageUrl.trim())) er.imageUrl = 'Image URL must start with http:// or https://';
    return er;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const er = validate();
    setErrors(er);
    setFormError('');
    if (Object.keys(er).length) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      category: form.category.trim(),
      imageUrl: form.imageUrl.trim(),
    };
    try {
      const saved = editing ? await productService.update(product.id, body) : await productService.create(body);
      toast.success(editing ? 'Product updated.' : 'Product created.');
      onSaved(saved);
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...getFieldErrors(err) }));
      setFormError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const input = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={`pf-${name}`}>{label}</label>
      <input id={`pf-${name}`} name={name} value={form[name]} onChange={onChange} aria-invalid={!!errors[name]} aria-describedby={`pf-${name}-error`} {...props} />
      <span id={`pf-${name}-error`} className="field-error" role="alert">{errors[name]}</span>
    </div>
  );

  return (
    <form className="panel product-form" onSubmit={onSubmit} noValidate>
      <h2>{editing ? `Edit product #${product.id}` : 'Create product'}</h2>
      {formError && <div className="alert alert-error" role="alert">{formError}</div>}
      <div className="form-grid">
        {input('name', 'Name', { type: 'text', maxLength: 200 })}
        {input('category', 'Category', { type: 'text', maxLength: 100 })}
        {input('price', 'Price', { type: 'number', step: '0.01', min: '0.01', inputMode: 'decimal' })}
        {input('stockQuantity', 'Stock quantity', { type: 'number', step: '1', min: '0' })}
      </div>
      {input('imageUrl', 'Image URL (optional)', { type: 'url', maxLength: 500, placeholder: 'https://…' })}
      <div className="field">
        <label htmlFor="pf-description">Description</label>
        <textarea id="pf-description" name="description" rows="4" maxLength={2000} value={form.description} onChange={onChange} />
        <span className="field-error" role="alert">{errors.description}</span>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>
      </div>
    </form>
  );
}
