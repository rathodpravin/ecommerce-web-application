const currency = import.meta.env.VITE_CURRENCY || 'INR';
const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });

export const money = (value) => formatter.format(Number(value ?? 0));

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

/** UI-only hint of which statuses an admin can pick next. The backend enforces the real rules. */
export const NEXT_STATUSES = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const ALL_STATUSES = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
export const canCustomerCancel = (status) => status === 'PLACED' || status === 'CONFIRMED';
