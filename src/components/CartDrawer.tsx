import { ArrowUpRight, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import Modal from './Modal';
import { buildWhatsAppUrl, cartKey, cartTotal, formatBRL, type CartLine } from '../lib/store';
import { products, store } from '../data';

type Props = { lines: CartLine[]; onClose: () => void; onQuantity: (key: string, quantity: number) => void };

export default function CartDrawer({ lines, onClose, onQuantity }: Props) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const checkout = !store.catalogIsDemo ? buildWhatsAppUrl(store.whatsapp, lines, products, store.name) : null;

  return (
    <Modal className="cart-drawer" labelledBy="cart-title" onClose={onClose} closeButton={false}>
      <div className="drawer-header">
        <div><h2 id="cart-title">Sua sacola</h2><p>{count} {count === 1 ? 'peça escolhida' : 'peças escolhidas'}</p></div>
        <button className="dialog-close" type="button" aria-label="Fechar sacola" onClick={onClose}><X /></button>
      </div>
      {!lines.length ? <div className="cart-empty">
        <div className="empty-icon"><ShoppingBag /></div>
        <h3>Um novo look começa aqui.</h3>
        <p>Sua sacola está vazia. Explore a vitrine e escolha as suas peças.</p>
        <button type="button" className="button primary" onClick={onClose}>Explorar a vitrine <ArrowUpRight /></button>
      </div> : <>
        <div className="cart-items">
          {lines.map((line) => {
            const product = products.find((entry) => entry.id === line.productId)!;
            const used = lines.filter((entry) => entry.productId === product.id).reduce((sum, entry) => sum + entry.quantity, 0);
            return <article className="cart-item" key={cartKey(line)}>
              <img className="cart-item-image" src={product.image} alt={product.name} width="80" height="101" />
              <div className="cart-item-info">
                <h3>{product.name}</h3><p>{line.size} · {line.color}</p>
                <strong>{formatBRL(product.price * line.quantity)}</strong>
                <div>
                  <div className="quantity-control" aria-label={`Quantidade de ${product.name}`}>
                    <button type="button" aria-label={`Diminuir ${product.name}`} onClick={() => onQuantity(cartKey(line), line.quantity - 1)}><Minus /></button>
                    <output aria-live="polite">{line.quantity}</output>
                    <button type="button" aria-label={`Aumentar ${product.name}`} disabled={used >= product.stock} onClick={() => onQuantity(cartKey(line), line.quantity + 1)}><Plus /></button>
                  </div>
                  <button type="button" className="text-button" onClick={() => onQuantity(cartKey(line), 0)} aria-label={`Remover ${product.name} da sacola`}>Remover</button>
                </div>
              </div>
            </article>;
          })}
        </div>
        <div className="drawer-footer">
          <div className="cart-summary">
            <div><span>Produtos ({count})</span><span>{formatBRL(cartTotal(lines, products))}</span></div>
            <div><span>Frete</span><small>A combinar com a loja</small></div>
            <div><strong>Subtotal</strong><strong data-testid="cart-total">{formatBRL(cartTotal(lines, products))}</strong></div>
          </div>
          <p className="checkout-note">O envio da sacola inicia uma conversa. Valores, disponibilidade, entrega e pagamento precisam ser confirmados pela loja.</p>
          {checkout ? <a className="button primary" href={checkout} target="_blank" rel="noopener noreferrer">Consultar pelo WhatsApp <ArrowUpRight /></a> : <>
            <button type="button" className="button primary" disabled>Pedidos indisponíveis nesta prévia</button>
            <p className="checkout-note warning">{store.catalogIsDemo ? 'Catálogo de demonstração. Os produtos e valores exibidos são exemplos e não estão à venda.' : 'O atendimento para pedidos ainda não foi disponibilizado pela loja.'}</p>
          </>}
        </div>
      </>}
    </Modal>
  );
}
