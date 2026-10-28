import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import '../styles/Login.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !submitting) return <Navigate to={from || (isAdmin ? '/admin' : '/')} replace />;

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const er = {};
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'Enter a valid email address.';
    if (!form.password) er.password = 'Enter your password.';
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
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      navigate(from || (user.role === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Login failed. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Log in</h1>
        <p className="muted">Welcome back! Enter your details to continue.</p>

        {formError && <div className="alert alert-error" role="alert">{formError}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} aria-invalid={!!errors.email} aria-describedby="email-error" />
          <span id="email-error" className="field-error" role="alert">{errors.email}</span>
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-with-button">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={onChange} aria-invalid={!!errors.password} aria-describedby="password-error" />
            <button type="button" className="input-toggle" onClick={() => setShowPassword((s) => !s)} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <span id="password-error" className="field-error" role="alert">{errors.password}</span>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
          {submitting ? <><span className="spinner spinner-sm" /> Logging in…</> : 'Log in'}
        </button>
        <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
