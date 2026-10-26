import { useState } from 'react';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import Modal from './Modal';
import { formatBRL, type CartLine, type Product } from '../lib/store';

type Props = { product: Product; available: number; onClose: () => void; onAdd: (line: CartLine) => void };

export default function ProductDialog({ product, available, onClose, onAdd }: Props) {
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]?.name);
  const [quantity, setQuantity] = useState(1);
  return (
    <Modal className="product-dialog" labelledBy="product-dialog-title" onClose={onClose}>
      <img className="dialog-image" src={product.image} alt={`Ilustração de ${product.name}`} width="600" height="750" />
      <div className="dialog-content">
        <p className="product-category">{product.category}</p>
        <h2 id="product-dialog-title">{product.name}</h2>
        <p className="product-price">{formatBRL(product.price)}</p>
        <p className="product-details">{product.description}</p>
        <fieldset>
          <legend>Tamanho</legend>
          <div className="variant-options">{product.sizes.map((value) => <button key={value} type="button" className={`variant-option ${size === value ? 'active' : ''}`} aria-pressed={size === value} onClick={() => setSize(value)}>{value}</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Cor</legend>
          <div className="variant-options">{product.colors.map((value) => <button key={value.name} type="button" className={`variant-option ${color === value.name ? 'active' : ''}`} aria-pressed={color === value.name} onClick={() => setColor(value.name)}><span className="color-dot" style={{ backgroundColor: value.hex, display: 'inline-block', marginRight: 6 }} />{value.name}</button>)}</div>
        </fieldset>
        <p className="quantity-label" id="quantity-label">Quantidade</p>
        <div className="quantity-control" role="group" aria-labelledby="quantity-label">
          <button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)}><Minus /></button>
          <output aria-live="polite">{quantity}</output>
          <button type="button" aria-label="Aumentar quantidade" disabled={quantity >= available} onClick={() => setQuantity((value) => value + 1)}><Plus /></button>
        </div>
        <button className="button primary" type="button" disabled={available <= 0 || !size || !color} onClick={() => onAdd({ productId: product.id, size, color, quantity: Math.min(quantity, available) })}><ShoppingBag />{available > 0 ? 'Adicionar à sacola' : 'Limite de unidades na sacola'}</button>
        <p className="stock-note">Disponibilidade e condições a confirmar com a loja.</p>
        <ul className="detail-list">{product.details.map((detail) => <li key={detail}><Check />{detail}</li>)}</ul>
      </div>
    </Modal>
  );
}
