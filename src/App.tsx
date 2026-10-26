import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUpRight, Check, Heart, Instagram, Layers3, MessageCircle, Search, Share2, ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react';
import { products, categories, store } from './data';
import { addToCart, filterProducts, sanitizeCart, updateQuantity, type CartLine, type CatalogFilters, type Product } from './lib/store';
import { useStoredState } from './lib/storage';
import ProductCard from './components/ProductCard';
import ProductDialog from './components/ProductDialog';
import CartDrawer from './components/CartDrawer';
import Modal from './components/Modal';

type Info = 'about' | 'buy' | 'privacy' | 'share';

function Brand() {
  return <a className="wordmark" href="#inicio" aria-label={`${store.name}, início`}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 6 16 28 28 6M9 6l7 13 7-13" fill="none" stroke="currentColor" /></svg><span>{store.name === 'Vitrine Moda' ? 'vitrine' : store.name}<small>{store.tagline}</small></span></a>;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [sort, setSort] = useState<CatalogFilters['sort']>('featured');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useStoredState<string[]>('vitrine:favorites:v1', [], (value) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && products.some((product) => product.id === id)))] : []);
  const [cart, setCart] = useStoredState<CartLine[]>('vitrine:cart:v1', [], (value) => sanitizeCart(value, products));
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [info, setInfo] = useState<Info | null>(null);
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = filterProducts(products, { query, category, sort, favoritesOnly, favorites });
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const resetFilters = () => { setQuery(''); setCategory('Todos'); setFavoritesOnly(false); };
  const openFavorites = () => { setFavoritesOnly(true); setCategory('Todos'); setQuery(''); document.getElementById('colecao')?.scrollIntoView({ behavior: 'smooth' }); };
  const toggleFavorite = (id: string) => setFavorites((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const shareStore = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: store.name, text: store.tagline, url: window.location.href });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
        setToast('Link da vitrine copiado.');
      } else setInfo('share');
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setInfo('share');
    }
  };

  return (
    <div className="app-shell" id="inicio">
      <a className="skip-link" href="#colecao">Pular para a coleção</a>
      {store.catalogIsDemo && <div className="demo-note">Prévia de desenvolvimento · catálogo, ilustrações e preços de demonstração · compras indisponíveis</div>}
      <div className="announcement"><Sparkles size={13} /> Seu estilo tem um lugar aqui <span aria-hidden="true">✦</span></div>
      <header className="site-header page-width">
        <Brand />
        <nav className="header-actions" aria-label="Navegação principal">
          <a href="#colecao" className="desktop-link">A coleção</a>
          <button type="button" className="desktop-link" onClick={() => setInfo('about')}>Nossa vitrine</button>
          <button type="button" className="icon-button" onClick={shareStore} aria-label="Compartilhar vitrine"><Share2 /></button>
          <button type="button" className="icon-button" onClick={openFavorites} aria-label={`Ver favoritos (${favorites.length})`}><Heart />{favorites.length > 0 && <span className="cart-count">{favorites.length}</span>}</button>
          <button type="button" className="icon-button" onClick={() => setCartOpen(true)} aria-label={`Abrir sacola (${cartCount})`}><ShoppingBag /><span className="cart-count">{cartCount}</span></button>
        </nav>
      </header>

      <main className="page-width">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="eyebrow">{store.name} · escolhas com personalidade</p>
            <h1 className="hero-title" id="hero-heading">Seu estilo.<br />Suas escolhas.<br /><em>Sua vitrine.</em></h1>
            <p className="hero-description">{store.description}</p>
            <div className="hero-actions"><a className="button primary" href="#colecao">Explorar a coleção <ArrowUpRight /></a><button type="button" className="button secondary" onClick={() => setInfo('buy')}>Como comprar <ArrowRight /></button></div>
            <div className="hero-proof"><Heart /><p><strong>Encontre o que combina com você</strong>Guarde seus favoritos e monte a sua seleção.</p></div>
          </div>
          <div className="hero-visual">
            <img className="hero-image" src="/images/hero.svg" alt="Composição ilustrativa com peças de moda em tons naturais" width="1000" height="1000" fetchPriority="high" />
            <div className="hero-stamp"><Sparkles /><span>Vista a sua<br />personalidade</span></div>
            <div className="hero-caption"><div><span>Inspiração para o seu dia a dia</span><strong>O essencial é ser você.</strong></div><a href="#colecao" aria-label="Ir para a coleção"><ArrowDown size={22} /></a></div>
          </div>
        </section>

        <nav className="quick-links" aria-label="Explore a vitrine">
          <a className="quick-link" href="#colecao"><Layers3 /><span><strong>Explore a coleção</strong><small>Encontre seu próximo look</small></span><ArrowUpRight /></a>
          <button className="quick-link" type="button" onClick={openFavorites}><Heart /><span><strong>Seus favoritos</strong><small>Peças que ganharam seu coração</small></span><ArrowUpRight /></button>
          <button className="quick-link" type="button" onClick={() => setInfo('buy')}><MessageCircle /><span><strong>Como comprar</strong><small>Conheça o próximo passo</small></span><ArrowUpRight /></button>
        </nav>

        <section className="catalog" id="colecao" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div><h2 id="catalog-title">{favoritesOnly ? 'Seus favoritos' : 'Encontre a sua próxima peça.'}</h2><p>{favoritesOnly ? 'Uma seleção que tem tudo a ver com você.' : 'Explore com calma. Combine do seu jeito.'}</p></div>
            <div className="catalog-tools">
              <label className="search-field"><Search /><span className="sr-only">Buscar produtos</span><input ref={searchRef} type="search" placeholder="O que você procura?" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Limpar busca" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><X /></button>}</label>
              <label className="sort-field"><ArrowDownUp /><span className="sr-only">Ordenar produtos</span><select value={sort} onChange={(event) => setSort(event.target.value as CatalogFilters['sort'])}><option value="featured">Em destaque</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="name">Nome: A a Z</option></select></label>
            </div>
          </div>
          <div className="categories" aria-label="Categorias de produtos">
            {categories.map((item) => <button key={item} type="button" className={`category-button ${category === item && !favoritesOnly ? 'active' : ''}`} aria-pressed={category === item && !favoritesOnly} onClick={() => { setCategory(item); setFavoritesOnly(false); }}>{item}</button>)}
            <button type="button" className={`category-button ${favoritesOnly ? 'active' : ''}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}><Heart />Favoritos <span>{favorites.length}</span></button>
          </div>
          <p className="result-count" role="status">{filtered.length} {filtered.length === 1 ? 'peça encontrada' : 'peças encontradas'}</p>
          <div className="product-grid">
            {filtered.map((product) => <ProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} onOpen={() => setSelected(product)} />)}
            {!filtered.length && <div className="empty-state"><Search /><h3>{favoritesOnly && !favorites.length ? 'Seu estilo merece uma seleção.' : 'Nenhuma peça por aqui.'}</h3><p>{favoritesOnly && !favorites.length ? 'Toque no coração de uma peça para guardar seus favoritos neste navegador.' : 'Tente outro termo ou explore as outras categorias da vitrine.'}</p><button type="button" className="button secondary" onClick={resetFilters}>Ver toda a coleção <ArrowRight /></button></div>}
          </div>
        </section>

        <section className="manifesto" aria-labelledby="manifesto-title">
          <div className="manifesto-icon"><Sparkles /></div>
          <div className="manifesto-copy"><p className="eyebrow">Mais possibilidades, mais você</p><h2 id="manifesto-title">Moda para vestir a sua personalidade.</h2><p>Seu estilo muda, se reinventa, surpreende. A sua vitrine acompanha cada versão.</p></div>
          <button type="button" className="button secondary" onClick={() => setInfo('about')}>Conheça a vitrine <ArrowUpRight /></button>
        </section>
      </main>

      <footer className="footer page-width">
        <div><Brand /><nav className="footer-links" aria-label="Informações da loja"><button type="button" onClick={() => setInfo('about')}>Sobre a vitrine</button><button type="button" onClick={() => setInfo('buy')}>Como comprar</button><button type="button" onClick={() => setInfo('privacy')}>Privacidade</button>{/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/.test(store.instagram) && <a href={store.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram da loja"><Instagram /></a>}<button type="button" onClick={shareStore} aria-label="Compartilhar esta vitrine"><Share2 /></button></nav></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {store.name}. {store.tagline}</span><span><ShieldCheck />Seus favoritos ficam com você.</span></div>
        {(store.legalName || store.businessDocument || store.contactEmail) && <p className="legal-info">{[store.legalName, store.businessDocument].filter(Boolean).join(' · ')}{store.contactEmail && <> · <a href={`mailto:${store.contactEmail}`}>{store.contactEmail}</a></>}</p>}
      </footer>

      {selected && <ProductDialog key={selected.id} product={selected} available={Math.max(0, selected.stock - cart.filter((line) => line.productId === selected.id).reduce((sum, line) => sum + line.quantity, 0))} onClose={() => setSelected(null)} onAdd={(line) => { setCart((current) => addToCart(current, line, products)); setSelected(null); setToast('Peça adicionada à sua sacola.'); }} />}
      {cartOpen && <CartDrawer lines={cart} onClose={() => setCartOpen(false)} onQuantity={(key, quantity) => setCart((current) => updateQuantity(current, key, quantity, products))} />}
      {info && <Modal className="contact-dialog" labelledBy="info-title" onClose={() => setInfo(null)}>
        <div className="dialog-content">
          <p className="eyebrow">{store.name}</p>
          <h2 id="info-title">{({ about: 'Sua vitrine, seu estilo.', buy: 'Da vitrine à sua sacola.', privacy: 'Sua privacidade importa.', share: 'Compartilhe a vitrine.' })[info]}</h2>
          {info === 'about' && <><p className="product-details">{store.description}</p>{store.catalogIsDemo && <p className="checkout-note warning">Esta é uma prévia em desenvolvimento. A identidade visual, o catálogo e os dados oficiais da loja ainda precisam ser confirmados.</p>}<button className="button primary" type="button" onClick={() => { setInfo(null); document.getElementById('colecao')?.scrollIntoView(); }}>Explorar a coleção <ArrowRight /></button></>}
          {info === 'buy' && <div className="faq-list">
            <section className="faq-item"><h3>01. Encontre suas peças</h3><p>Explore as categorias ou busque por nome, cor e estilo. Toque em uma peça para escolher tamanho, cor e quantidade.</p></section>
            <section className="faq-item"><h3>02. Monte sua seleção</h3><p>Adicione as peças à sacola. Você pode revisar e alterar sua seleção antes de entrar em contato.</p></section>
            <section className="faq-item"><h3>03. Confirme com a loja</h3><p>Quando o atendimento estiver disponível, sua seleção poderá ser enviada pelo WhatsApp. A loja confirma disponibilidade, entrega e pagamento.</p></section>
            {store.catalogIsDemo && <p className="checkout-note warning">Nesta prévia, produtos e preços são ilustrativos e o envio de pedidos está desativado.</p>}
            {store.shippingPolicy && <section className="faq-item"><h3>Entrega</h3><p>{store.shippingPolicy}</p></section>}
            {store.returnsPolicy && <section className="faq-item"><h3>Trocas e devoluções</h3><p>{store.returnsPolicy}</p></section>}
          </div>}
          {info === 'privacy' && <div className="faq-list"><section className="faq-item"><h3>Sacola e favoritos</h3><p>Salvamos suas escolhas somente neste navegador, usando armazenamento local. Esta página não solicita cadastro e não usa ferramentas de análise ou rastreamento.</p></section><section className="faq-item"><h3>Atendimento externo</h3><p>Se você optar por enviar sua seleção pelo WhatsApp, o aplicativo abrirá com os itens escolhidos. A mensagem só é enviada quando você confirmar no WhatsApp, que tem sua própria política de privacidade.</p></section><section className="faq-item"><h3>Apagar suas escolhas</h3><p>Use o botão abaixo para apagar a sacola e os favoritos deste navegador.</p><button type="button" className="text-button" onClick={() => { setCart([]); setFavorites([]); setToast('Sua sacola e seus favoritos foram apagados.'); }}>Apagar minhas escolhas</button></section>{store.contactEmail && <p className="product-details">Contato: <a href={`mailto:${store.contactEmail}`}>{store.contactEmail}</a></p>}</div>}
          {info === 'share' && <><p className="product-details">Copie o endereço abaixo para enviar a vitrine para alguém.</p><input className="share-input" aria-label="Endereço da vitrine" readOnly value={window.location.href} onFocus={(event) => event.target.select()} /></>}
        </div>
      </Modal>}
      <div role="status" aria-live="polite" aria-atomic="true">{toast && <div className="toast"><Check /><span>{toast}</span>{toast.includes('sacola.') && <button type="button" onClick={() => { setToast(''); setCartOpen(true); }}>Ver sacola</button>}<button type="button" aria-label="Fechar mensagem" onClick={() => setToast('')}><X size={14} /></button></div>}</div>
    </div>
  );
}
