import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import '../styles/Register.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !submitting) return <Navigate to="/" replace />;

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const er = {};
    if (form.fullName.trim().length < 2) er.fullName = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'Enter a valid email address.';
    if (form.password.length < 8) er.password = 'Password must be at least 8 characters.';
    else if (form.password.length > 72) er.password = 'Password must be at most 72 characters.';
    if (form.confirm !== form.password) er.confirm = 'Passwords do not match.';
    return er;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const er = validate();
    setErrors(er);
    setFormError('');
    if (Object.keys(er).length) return;
    setSubmitting(true);
    try {
      await register(form.fullName.trim(), form.email.trim(), form.password);
      toast.success('Account created. Welcome to ShopEase!');
      navigate('/', { replace: true });
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...getFieldErrors(err) }));
      setFormError(getErrorMessage(err, 'Registration failed. Please try again.'));
      setSubmitting(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} value={form[name]} onChange={onChange} aria-invalid={!!errors[name]} aria-describedby={`${name}-error`} {...props} />
      <span id={`${name}-error`} className="field-error" role="alert">{errors[name]}</span>
    </div>
  );

  const pwType = showPassword ? 'text' : 'password';

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Create account</h1>
        <p className="muted">It only takes a minute.</p>

        {formError && <div className="alert alert-error" role="alert">{formError}</div>}

        {field('fullName', 'Full name', { type: 'text', autoComplete: 'name', maxLength: 100 })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
        {field('password', 'Password', { type: pwType, autoComplete: 'new-password' })}
        {field('confirm', 'Confirm password', { type: pwType, autoComplete: 'new-password' })}

        <label className="checkbox">
          <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} /> Show passwords
        </label>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
          {submitting ? <><span className="spinner spinner-sm" /> Creating account…</> : 'Create account'}
        </button>
        <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
