# ShopEase Frontend (React + Vite)

Separate app that talks to the Spring Boot backend over REST. Contains no backend code and no secrets.

## Run it
```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8080/api
npm install
npm run dev               # http://localhost:5173
npm test                  # UI tests (use an in-memory fake API, not your real backend)
npm run build             # production build in dist/
```
Start the backend first (`mvn spring-boot:run` in `../backend`). The backend's `CORS_ALLOWED_ORIGINS` must contain `http://localhost:5173`.

## Environment variables
Every `VITE_` variable is compiled into the JavaScript that browsers download, so **anyone can read them**.
Only put public values there (API URL, display currency). Never put passwords, database credentials or JWT secrets.

## How authentication works
The backend returns a JWT in the login/register response (a bearer token, not a cookie).
- Stored in `sessionStorage` (survives refresh, cleared when the tab closes), attached by an Axios interceptor.
- **Risk:** any script running on the page can read it (XSS or a malicious dependency). Mitigations: short expiry, no `dangerouslySetInnerHTML`, token never logged, cleared on logout/expiry/any 401, and the backend re-reads the user's role from the database on every request.
- The password is never stored. On page load the app calls `GET /api/users/me` to confirm who the user is.
- A timer logs the user out when the token expires; any 401 does the same and shows a message.
- A more secure setup is an HttpOnly cookie issued by the backend (requires backend + CSRF changes).
- `ProtectedRoute` only hides pages for usability. The backend enforces every permission.

## Structure
```
src/
  components/   Navbar, Footer, ProductCard, SearchBar, Pagination, ConfirmDialog, ProtectedRoute, ...
  components/admin/   AdminOverview, AdminProducts, ProductForm, AdminOrders, AdminCustomers
  pages/        Home, Products, ProductDetails, Login, Register, Cart, Checkout, MyOrders, OrderDetails, Profile, AdminDashboard
  services/     api.js (Axios instance + interceptors), authService, productService, cartService, orderService, adminService
  context/      AuthContext, CartContext, ToastContext
  styles/       global.css + one CSS file per page/component group
  utils/        money/date formatting, status helpers
  test/         fake backend + UI tests
```

## Routes
`/`, `/products`, `/products/:id`, `/login`, `/register` (public) · `/cart`, `/checkout`, `/my-orders`, `/orders/:id`, `/profile` (logged in) · `/admin` (ADMIN only)

## Notes
- Checkout collects only a shipping address. **No payment is taken** and the UI says so.
- Prices, totals and stock always come from the backend; the browser never sends a price.
- "Budget picks" on the home page means lowest price; the backend has no popularity data.
- Currency display is `VITE_CURRENCY` (default INR); it does not change stored prices.
