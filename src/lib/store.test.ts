import { describe, expect, it } from 'vitest';
import {
  addToCart, buildWhatsAppUrl, cartKey, cartTotal, filterProducts,
  formatBRL, isValidWhatsAppPhone, sanitizeCart, updateQuantity,
  type CartLine, type Product,
} from './store';

const dress: Product = {
  id: 'dress', name: 'Vestido de Linho', category: 'Vestidos', description: 'Coleção verão, algodão e linho.',
  price: 15990, originalPrice: 19990, image: '/dress.svg', sizes: ['P', 'M'],
  colors: [{ name: 'Areia', hex: '#ddc9aa' }, { name: 'Preto', hex: '#222' }],
  stock: 4, featured: true, details: ['Linho'],
};
const shirt: Product = {
  ...dress, id: 'shirt', name: 'Camisa Clássica', category: 'Blusas', description: 'Toque macio.',
  price: 8990, stock: 8, featured: false,
};
const unavailable: Product = { ...dress, id: 'out', stock: 0 };
const products = [shirt, dress, unavailable];
const line: CartLine = { productId: 'dress', size: 'M', color: 'Areia', quantity: 1 };
const alternate: CartLine = { ...line, size: 'P', color: 'Preto' };
const filters = { query: '', category: 'Todos', sort: 'featured' as const };

describe('catalog and currency', () => {
  it('formats centavos and rejects prices that would hide invalid arithmetic', () => {
    expect(formatBRL(15990)).toMatch(/R\$\s159,90/);
    expect(formatBRL(0)).toMatch(/R\$\s0,00/);
    for (const value of [-1, 1.1, NaN, Infinity]) expect(() => formatBRL(value)).toThrow(RangeError);
  });
  it('finds text across name, description, category and colors without accent sensitivity', () => {
    expect(filterProducts([dress, shirt], { ...filters, query: 'VERAO LINHO' })).toEqual([dress]);
    expect(filterProducts([dress, shirt], { ...filters, query: 'classica' })).toEqual([shirt]);
    expect(filterProducts([dress], { ...filters, query: 'areia' })).toEqual([dress]);
    expect(filterProducts([dress], { ...filters, query: 'impossível' })).toEqual([]);
  });
  it('combines categories and saved favorites', () => {
    expect(filterProducts([dress, shirt], { ...filters, category: 'vestidos', favoritesOnly: true, favorites: ['shirt'] })).toEqual([]);
    expect(filterProducts([dress, shirt], { ...filters, favoritesOnly: true, favorites: ['shirt'] })).toEqual([shirt]);
    expect(filterProducts([dress], { ...filters, favoritesOnly: true })).toEqual([]);
  });
  it('sorts a copy by highlight, price and name', () => {
    const original = [shirt, dress];
    expect(filterProducts(original, filters).map((p) => p.id)).toEqual(['dress', 'shirt']);
    expect(filterProducts(original, { ...filters, sort: 'price-asc' }).map((p) => p.id)).toEqual(['shirt', 'dress']);
    expect(filterProducts(original, { ...filters, sort: 'price-desc' }).map((p) => p.id)).toEqual(['dress', 'shirt']);
    expect(filterProducts(original, { ...filters, sort: 'name' }).map((p) => p.id)).toEqual(['shirt', 'dress']);
    expect(original).toEqual([shirt, dress]);
  });
});

describe('safe cart operations', () => {
  it('keeps variant keys distinct even when values contain separators', () => {
    expect(cartKey({ productId: 'a|b', size: 'c', color: 'd' })).not.toBe(cartKey({ productId: 'a', size: 'b|c', color: 'd' }));
  });
  it('merges identical variants without mutating the original cart', () => {
    const original = [{ ...line }];
    expect(addToCart(original, { ...line, quantity: 2 }, products)).toEqual([{ ...line, quantity: 3 }]);
    expect(original).toEqual([line]);
  });
  it('caps combined variants to the product stock', () => {
    const result = addToCart([{ ...line, quantity: 3 }], { ...alternate, quantity: 3 }, products);
    expect(result).toEqual([{ ...line, quantity: 3 }, { ...alternate, quantity: 1 }]);
    expect(addToCart(result, line, products)).toEqual(result);
    expect(updateQuantity(result, cartKey(alternate), 9, products)).toEqual(result);
  });
  it('rejects missing products, invalid variants and unsafe quantities', () => {
    for (const bad of [
      { ...line, productId: 'unknown' }, { ...line, productId: 'out' },
      { ...line, size: 'XXL' }, { ...line, color: 'Azul' },
      ...[0, -1, 1.5, Infinity, NaN].map((quantity) => ({ ...line, quantity })),
    ]) expect(addToCart([line], bad, products)).toEqual([line]);
  });
  it('cleans corrupted storage, strips foreign properties and combines duplicated entries', () => {
    for (const input of [null, undefined, 'cart', {}, 42]) expect(sanitizeCart(input, products)).toEqual([]);
    expect(sanitizeCart([
      null, 'bad', {}, { ...line, quantity: '3' }, { ...line, quantity: -9 },
      { ...line, price: 1, quantity: 2 }, { ...alternate, quantity: 1 }, { ...line, quantity: 7 },
      { ...line, productId: 'unknown' }, { ...line, productId: 'out' },
    ], products)).toEqual([{ ...line, quantity: 3 }, alternate]);
  });
  it('updates quantities, removes zero and ignores invalid or unknown updates', () => {
    const initial = [line, alternate];
    expect(updateQuantity(initial, cartKey(line), 99, products)).toEqual([{ ...line, quantity: 3 }, alternate]);
    expect(updateQuantity(initial, cartKey(line), 0, products)).toEqual([alternate]);
    for (const quantity of [-1, NaN, 1.5, Infinity]) expect(updateQuantity(initial, cartKey(line), quantity, products)).toEqual(initial);
    expect(updateQuantity(initial, 'unknown', 2, products)).toEqual(initial);
    expect(initial).toEqual([line, alternate]);
  });
  it('calculates integer-cent subtotals using current catalog prices and clean quantities', () => {
    const lines = [{ ...line, quantity: 2 }, { ...line, productId: 'shirt', quantity: 3 }];
    expect(cartTotal(lines, products)).toBe(2 * 15990 + 3 * 8990);
    expect(cartTotal([{ ...line, quantity: 100 }], products)).toBe(4 * 15990);
    expect(cartTotal([{ ...line, productId: 'unknown' }], products)).toBe(0);
  });
});

describe('WhatsApp checkout request', () => {
  it('accepts Brazilian country code, real DDD and formatted mobile or fixed numbers', () => {
    for (const phone of ['5511998765432', '+55 (11) 99876-5432', '552132345678', '5561987654321']) {
      expect(isValidWhatsAppPhone(phone)).toBe(true);
    }
    for (const phone of ['', '11998765432', '15511998765432', '5500998765432', '5523998765432', '551112345678', '55119987654321', 'abc5511998765432']) {
      expect(isValidWhatsAppPhone(phone)).toBe(false);
    }
  });
  it('does not create a destination for invalid numbers or empty/invalid carts', () => {
    expect(buildWhatsAppUrl('', [line], products, 'Vitrine')).toBeNull();
    expect(buildWhatsAppUrl('5511998765432', [], products, 'Vitrine')).toBeNull();
    expect(buildWhatsAppUrl('5511998765432', [{ ...line, size: 'BAD' }], products, 'Vitrine')).toBeNull();
  });
  it('encodes the exact item variants and subtotal without asserting payment or delivery cost', () => {
    const result = buildWhatsAppUrl('+55 (11) 99876-5432', [{ ...line, quantity: 2 }], products, 'Vitrine & Moda')!;
    const url = new URL(result);
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/5511998765432');
    const message = url.searchParams.get('text')!;
    expect(message).toContain('Vitrine & Moda');
    expect(message).toContain('2 × Vestido de Linho — M, Areia');
    expect(message).toContain(formatBRL(31980));
    expect(message).toContain('confirmação de disponibilidade, frete e pagamento');
    expect(message).not.toContain('Pedido confirmado');
    expect(message).not.toContain('Frete grátis');
  });
});
