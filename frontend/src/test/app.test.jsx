import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { installFakeBackend } from './fakeBackend';

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider><AuthProvider><CartProvider><App /></CartProvider></AuthProvider></ToastProvider>
    </MemoryRouter>
  );
}

async function register(user, name = 'Asha Rao', email = 'asha@example.com') {
  await user.type(await screen.findByLabelText('Full name'), name);
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), 'StrongPass123');
  await user.type(screen.getByLabelText('Confirm password'), 'StrongPass123');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('customer journey', () => {
  it('register -> browse -> add to cart -> change quantity -> checkout -> see order', async () => {
    const db = installFakeBackend();
    const user = userEvent.setup();
    renderApp('/register');

    await register(user);
    expect(await screen.findByText('New arrivals')).toBeInTheDocument();      // products loaded from API
    expect(screen.getAllByText('Wireless Mouse').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[0]);
    await user.click(await screen.findByRole('link', { name: 'Cart, 1 items' }));

    expect(await screen.findByText('Shopping cart')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await waitFor(() => expect(screen.getByText('2 items')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Proceed to checkout' }));
    await user.type(await screen.findByLabelText('Delivery address'), '12 Main Road, Hyderabad');
    expect(screen.getByText(/No payment is taken/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Place Order' }));

    expect(await screen.findByText(/Your order has been placed/)).toBeInTheDocument();
    expect(db.orders).toHaveLength(1);
    expect(db.orders[0].totalAmount).toBe(1598);                  // computed by the (fake) server
    expect(db.products[0].stockQuantity).toBe(3);
    expect(await screen.findByRole('link', { name: 'Cart, 0 items' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: 'My orders' })[0]);
    expect(await screen.findByText(db.orders[0].orderNumber)).toBeInTheDocument();
  });

  it('shows server errors: duplicate email and stock limit', async () => {
    installFakeBackend();
    const user = userEvent.setup();
    renderApp('/register');
    await register(user, 'Admin Two', 'admin@x.com');
    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
  });

  it('refuses to add more than the available stock', async () => {
    installFakeBackend();
    const user = userEvent.setup();
    renderApp('/register');
    await register(user);
    await screen.findByText('New arrivals');
    const add = screen.getAllByRole('button', { name: 'Add to Cart' })[0];
    for (let i = 0; i < 6; i += 1) await user.click(add);          // stock is 5
    expect(await screen.findByText("Only 5 unit(s) of 'Wireless Mouse' available")).toBeInTheDocument();
  });

  it('disables out-of-stock products', async () => {
    installFakeBackend();
    renderApp('/products');
    const sold = await screen.findByRole('button', { name: 'Sold out' });
    expect(sold).toBeDisabled();
  });

  it('login shows an error for wrong credentials', async () => {
    installFakeBackend();
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'nobody@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('search filters products via the API', async () => {
    installFakeBackend();
    const user = userEvent.setup();
    renderApp('/products');
    await screen.findByText('Wireless Mouse');
    const box = screen.getAllByRole('searchbox')[1]; // [0] = navbar, [1] = page
    await user.type(box, 'lamp{enter}');
    await waitFor(() => expect(screen.queryByText('Wireless Mouse')).not.toBeInTheDocument());
    expect(screen.getByText('Desk Lamp')).toBeInTheDocument();
  });
});

describe('access control and resilience', () => {
  it('redirects logged-out users from protected pages to login', async () => {
    installFakeBackend();
    renderApp('/cart');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('blocks customers from the admin page (UI) and the API says 403', async () => {
    const db = installFakeBackend();
    const user = userEvent.setup();
    renderApp('/register');
    await register(user);
    await screen.findByText('New arrivals');
    expect(screen.queryByRole('link', { name: 'Admin Dashboard' })).not.toBeInTheDocument();
    window.history.pushState({}, '', '/admin');
    // direct API check with the customer's token
    const { adminService } = await import('../services/adminService');
    await expect(adminService.dashboard()).rejects.toMatchObject({ response: { status: 403 } });
    expect(db.calls).toContain('GET /admin/dashboard');
  });

  it('shows the admin dashboard to an admin', async () => {
    installFakeBackend();
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'admin@x.com');
    await user.type(screen.getByLabelText('Password'), 'AdminPass1234');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('heading', { name: 'Admin dashboard' })).toBeInTheDocument();
    expect(await screen.findByText('Revenue (excl. cancelled)')).toBeInTheDocument();
  });

  it('customer cannot see the admin page through the router', async () => {
    installFakeBackend();
    const user = userEvent.setup();
    const view = renderApp('/register');
    await register(user);
    await screen.findByText('New arrivals');
    view.unmount();
    renderApp('/admin');
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });

  it('shows a friendly message when the backend is unreachable', async () => {
    installFakeBackend({ offline: true });
    renderApp('/');
    expect(await screen.findByText("We couldn't load the store")).toBeInTheDocument();
    expect(screen.getByText(/Cannot reach the server/)).toBeInTheDocument();
  });

  it('empty catalogue shows an empty state', async () => {
    installFakeBackend({ products: [] });
    renderApp('/');
    expect(await screen.findByText('No products yet')).toBeInTheDocument();
  });

  it('never stores the password in browser storage', async () => {
    installFakeBackend();
    const user = userEvent.setup();
    renderApp('/register');
    await register(user);
    await screen.findByText('New arrivals');
    const dump = JSON.stringify({ ...sessionStorage }) + JSON.stringify({ ...localStorage });
    expect(dump).not.toContain('StrongPass123');
  });
});
