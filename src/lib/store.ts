/** Monetary amounts are integer centavos; no floating-point price arithmetic. */
export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  badge?: string;
  featured?: boolean;
  details: string[];
};

export type CartLine = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

export type CatalogFilters = {
  query: string;
  category: string;
  favoritesOnly?: boolean;
  favorites?: string[];
  sort: 'featured' | 'price-asc' | 'price-desc' | 'name';
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBRL(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError('O preço deve ser um inteiro não negativo em centavos.');
  }
  return currencyFormatter.format(cents / 100);
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  const queryTerms = normalize(filters.query).split(/\s+/).filter(Boolean);
  const favorites = new Set(filters.favorites ?? []);
  const category = normalize(filters.category);
  const result = products.filter((product) => {
    if (category && category !== 'todos' && normalize(product.category) !== category) return false;
    if (filters.favoritesOnly && !favorites.has(product.id)) return false;
    const searchable = normalize([product.name, product.category, product.description, ...product.colors.map((color) => color.name)].join(' '));
    return queryTerms.every((term) => searchable.includes(term));
  });

  switch (filters.sort) {
    case 'price-asc': return result.sort((a, b) => a.price - b.price);
    case 'price-desc': return result.sort((a, b) => b.price - a.price);
    case 'name': return result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    default: return result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }
}

/** JSON encoding prevents collisions when variant names contain separators. */
export function cartKey(line: Pick<CartLine, 'productId' | 'size' | 'color'>): string {
  return JSON.stringify([line.productId, line.size, line.color]);
}

function validProduct(product: Product | undefined): product is Product {
  return Boolean(product && Number.isSafeInteger(product.price) && product.price >= 0
    && Number.isSafeInteger(product.stock) && product.stock > 0);
}

function parseLine(input: unknown, products: Product[]): { line: CartLine; product: Product } | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<CartLine>;
  if (typeof candidate.productId !== 'string' || typeof candidate.size !== 'string'
    || typeof candidate.color !== 'string' || !Number.isSafeInteger(candidate.quantity)
    || (candidate.quantity ?? 0) <= 0) return null;
  const product = products.find((item) => item.id === candidate.productId);
  if (!validProduct(product) || !product.sizes.includes(candidate.size)
    || !product.colors.some((color) => color.name === candidate.color)) return null;
  return {
    line: {
      productId: candidate.productId,
      size: candidate.size,
      color: candidate.color,
      quantity: candidate.quantity as number,
    },
    product,
  };
}

/** Treat localStorage as untrusted. Drop invalid entries and cap combined variants by stock. */
export function sanitizeCart(input: unknown, products: Product[]): CartLine[] {
  if (!Array.isArray(input)) return [];
  const result: CartLine[] = [];
  const stockUsed = new Map<string, number>();
  const indexes = new Map<string, number>();
  for (const candidate of input) {
    const parsed = parseLine(candidate, products);
    if (!parsed) continue;
    const { line, product } = parsed;
    const used = stockUsed.get(product.id) ?? 0;
    const quantity = Math.min(line.quantity, product.stock - used);
    if (quantity <= 0) continue;
    const key = cartKey(line);
    const index = indexes.get(key);
    if (index === undefined) {
      indexes.set(key, result.length);
      result.push({ ...line, quantity });
    } else {
      result[index] = { ...result[index], quantity: result[index].quantity + quantity };
    }
    stockUsed.set(product.id, used + quantity);
  }
  return result;
}

/** Valid additions are capped to remaining stock; invalid additions leave the clean cart unchanged. */
export function addToCart(lines: CartLine[], line: CartLine, products: Product[]): CartLine[] {
  return sanitizeCart([...lines, line], products);
}

/** Zero removes an item. Invalid quantities are ignored; positive quantities respect total stock. */
export function updateQuantity(lines: CartLine[], key: string, quantity: number, products: Product[]): CartLine[] {
  const clean = sanitizeCart(lines, products);
  if (!Number.isSafeInteger(quantity) || quantity < 0) return clean;
  const current = clean.find((line) => cartKey(line) === key);
  if (!current) return clean;
  if (quantity === 0) return clean.filter((line) => cartKey(line) !== key);
  const product = products.find((item) => item.id === current.productId)!;
  const otherQuantity = clean.reduce((total, line) => total + (line.productId === current.productId && cartKey(line) !== key ? line.quantity : 0), 0);
  const allowedQuantity = Math.min(quantity, product.stock - otherQuantity);
  return clean.map((line) => cartKey(line) === key ? { ...line, quantity: allowedQuantity } : line);
}

export function cartTotal(lines: CartLine[], products: Product[]): number {
  return sanitizeCart(lines, products).reduce((total, line) => {
    const product = products.find((item) => item.id === line.productId)!;
    return total + product.price * line.quantity;
  }, 0);
}

const brazilianAreaCodes = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47',
  '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68',
  '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87',
  '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

export function isValidWhatsAppPhone(phone: string): boolean {
  if (!/^\+?[\d\s().-]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('55') || !brazilianAreaCodes.has(digits.slice(2, 4))) return false;
  const subscriber = digits.slice(4);
  return /^[2-5]\d{7}$/.test(subscriber) || /^9\d{8}$/.test(subscriber);
}

/** This opens a request for confirmation, never an assertion that payment or an order succeeded. */
export function buildWhatsAppUrl(phone: string, lines: CartLine[], products: Product[], storeName: string): string | null {
  if (!isValidWhatsAppPhone(phone)) return null;
  const clean = sanitizeCart(lines, products);
  if (!clean.length) return null;
  const name = storeName.replace(/[\r\n\t]/g, ' ').trim().slice(0, 120) || 'loja';
  const items = clean.map((line) => {
    const product = products.find((item) => item.id === line.productId)!;
    return `${line.quantity} × ${product.name} — ${line.size}, ${line.color} — ${formatBRL(product.price * line.quantity)}`;
  });
  const message = [
    `Olá! Gostaria de consultar a disponibilidade deste pedido na ${name}:`,
    '',
    ...items,
    '',
    `Subtotal dos produtos: ${formatBRL(cartTotal(clean, products))}`,
    '',
    'Aguardo a confirmação de disponibilidade, frete e pagamento.',
  ].join('\n');
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
