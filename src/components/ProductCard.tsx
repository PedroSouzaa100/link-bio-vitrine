import { Heart, Plus } from 'lucide-react';
import { formatBRL, type Product } from '../lib/store';

type Props = { product: Product; favorite: boolean; onFavorite: () => void; onOpen: () => void };

export default function ProductCard({ product, favorite, onFavorite, onOpen }: Props) {
  return (
    <article className="product-card" data-testid="product-card">
      <div className="product-image-wrap">
        <button type="button" onClick={onOpen} aria-label={`Ver ${product.name}`}>
          <img className="product-image" src={product.image} alt={`Ilustração de ${product.name}`} width="600" height="750" loading="lazy" />
        </button>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button type="button" className={`favorite-button ${favorite ? 'selected' : ''}`} aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${product.name} ${favorite ? 'dos' : 'aos'} favoritos`} aria-pressed={favorite} onClick={onFavorite}><Heart /></button>
        <button type="button" className="quick-add" aria-label={`Escolher opções de ${product.name}`} onClick={onOpen}><Plus /></button>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3><button className="product-title" type="button" onClick={onOpen}>{product.name}</button></h3>
        <div className="price-line">
          {product.originalPrice && product.originalPrice > product.price && <span className="compare-price">{formatBRL(product.originalPrice)}</span>}
          <span className="product-price">{formatBRL(product.price)}</span>
        </div>
        <div className="product-colors" aria-label={`Cores: ${product.colors.map((color) => color.name).join(', ')}`}>
          {product.colors.map((color) => <span key={color.name} className="color-dot" style={{ backgroundColor: color.hex }} title={color.name} />)}
        </div>
      </div>
    </article>
  );
}
