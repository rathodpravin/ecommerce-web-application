# E-Commerce Web Application

Two separate apps:

- `backend/`  – Java 21, Spring Boot 3.3, Spring Security + JWT, JPA/Hibernate, MySQL  **(implemented)**
- `frontend/` – React + Vite (see `frontend/README.md`)

> **Checkout creates an order only. No payment is processed or charged.**

---------------------------------------------------------------------

## 1. Prerequisites
- JDK 21, Maven 3.9+
- MySQL 8+
- (optional) Postman

## 2. Create the database
```sql
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
```
Tables are created automatically in development (`DDL_AUTO=update`).

## 3. Configure environment variables
```bash
cd backend
cp .env.example .env      # then edit .env  (.env is git-ignored)
```
Required: `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (32+ chars; `openssl rand -base64 48`).
Optional: `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_EXPIRATION` (ms), `CORS_ALLOWED_ORIGINS`.
The app reads `backend/.env` automatically when started **from the `backend/` folder**; real OS environment variables override it.
The app refuses to start without `JWT_SECRET`, and it contains no default admin account.

### Creating the first admin (no default password exists)
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ chars) in `.env`, start once, then **delete those two lines**.
The admin is only created if that email does not already exist. Public registration always creates `CUSTOMER`.

## 4. Build and run
```bash
cd backend
mvn clean test          # unit tests (JWT + order-status rules)
mvn clean package
mvn spring-boot:run     # http://localhost:8080
```
Swagger UI: http://localhost:8080/swagger-ui.html

## 5. Development vs production
| Setting | Development | Production |
|---|---|---|
| `DDL_AUTO` | `update` | `validate` + Flyway/Liquibase migrations |
| `SWAGGER_ENABLED` | `true` | `false` |
| `DB_USE_SSL` / `DB_ALLOW_PUBLIC_KEY` | `false` / `true` | `true` / `false` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | your real HTTPS frontend origin only |
| Secrets | `.env` file | secret manager / platform env vars |
| Admin bootstrap | one-time env vars | create once, then remove variables |
| Transport | HTTP | HTTPS only (reverse proxy) |

## 6. API reference
Auth header for protected routes: `Authorization: Bearer <token>`.
Errors always look like:
```json
{"timestamp":"2026-10-27T10:00:00Z","status":400,"error":"Bad Request","message":"Validation failed","path":"/api/auth/register","fieldErrors":{"password":"Password must be 8-72 characters"}}
```

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /api/auth/register | public | returns token + user (201) |
| POST | /api/auth/login | public | 401 on bad credentials |
| GET | /api/users/me | logged in | profile |
| GET | /api/products | public | `q, category, page, size, sortBy=price\|name\|createdAt, direction=asc\|desc` |
| GET | /api/products/search | public | same, text in `name` |
| GET | /api/products/categories | public | list of category names |
| GET | /api/products/{id} | public | |
| POST/PUT/DELETE | /api/products[/{id}] | ADMIN | DELETE blocked (409) if product is in past orders |
| GET | /api/cart | logged in | |
| POST | /api/cart/items | logged in | `{"productId":1,"quantity":2}` – merges duplicates, checks stock |
| PUT | /api/cart/items/{itemId} | logged in | `{"quantity":3}` |
| DELETE | /api/cart/items/{itemId} | logged in | all cart calls return the full updated cart |
| POST | /api/orders/checkout | logged in | `{"shippingAddress":"..."}` – creates order, no payment |
| GET | /api/orders/my-orders | logged in | `page,size` |
| GET | /api/orders/{orderId} | owner (or ADMIN) | other users' orders -> 404 |
| POST | /api/orders/{orderId}/cancel | owner | only while PLACED/CONFIRMED; restores stock |
| GET | /api/admin/dashboard | ADMIN | counts, revenue (excl. cancelled), recent orders |
| GET | /api/admin/orders | ADMIN | optional `status` |
| PUT | /api/admin/orders/{id}/status | ADMIN | `{"status":"CONFIRMED"}` |
| GET | /api/admin/users | ADMIN | customers only |

Order status flow: `PLACED → CONFIRMED → SHIPPED → DELIVERED`; `CANCELLED` allowed only from PLACED/CONFIRMED (stock restored once).

### Sample: register
```json
POST /api/auth/register
{"fullName":"Asha Rao","email":"asha@example.com","password":"StrongPass123"}
```
```json
201 {"token":"eyJ...","tokenType":"Bearer","expiresInSeconds":3600,
     "user":{"id":2,"fullName":"Asha Rao","email":"asha@example.com","role":"CUSTOMER","createdAt":"2026-10-27T10:00:00"}}
```
### Sample: create product (ADMIN)
```json
POST /api/products
{"name":"Wireless Mouse","description":"2.4GHz","price":799.00,"stockQuantity":25,"category":"Electronics","imageUrl":"https://example.com/mouse.jpg"}
```
### Sample: checkout response
```json
201 {"id":1,"orderNumber":"ORD-20261027-3F9A1C2B","status":"PLACED","totalAmount":1598.00,
     "shippingAddress":"12 Main Road, Hyderabad","customerName":"Asha Rao","customerEmail":"asha@example.com",
     "items":[{"productId":1,"productName":"Wireless Mouse","unitPrice":799.00,"quantity":2,"subtotal":1598.00}],
     "paymentNote":"Order created. No payment has been processed - this application does not charge any payment method."}
```

## 7. Postman testing
1. Create environment variables `baseUrl = http://localhost:8080` and `token`.
2. Admin: POST `{{baseUrl}}/api/auth/login`; in the **Tests** tab: `pm.environment.set("token", pm.response.json().token)`.
3. Auth tab on protected requests: *Bearer Token* = `{{token}}`.
4. Suggested order: login(admin) → create product → register customer → login(customer) → GET products → POST cart item → PUT quantity → checkout → GET my-orders → login(admin) → PUT order status.
5. Security checks (expect these results):
   - Customer token on `GET /api/admin/dashboard` → **403**
   - No token on `GET /api/cart` → **401**
   - Customer B on customer A's `/api/orders/{id}` or `/api/cart/items/{id}` → **404**
   - Quantity above stock → **409**
