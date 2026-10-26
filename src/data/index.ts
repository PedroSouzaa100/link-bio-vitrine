import catalog from './catalog.json';
import settings from './store.json';
import type { Product } from '../lib/store';

export const products: Product[] = catalog;
export const store = {
  ...settings,
  whatsapp: import.meta.env.VITE_STORE_WHATSAPP?.trim() || settings.whatsapp,
};
export const categories = ['Todos', ...new Set(products.map((product) => product.category))];
