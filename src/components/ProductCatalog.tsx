import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Globe, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Tag, 
  Check, 
  Sparkles,
  Store,
  Layers,
  Edit3
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import CreateProductModal from './CreateProductModal';

interface ProductCatalogProps {
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
}

export default function ProductCatalog({
  products,
  onProductsUpdated,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isShopifyModalOpen, setIsShopifyModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // URL Resolver State
  const [urlInput, setUrlInput] = useState('');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [resolvedPreview, setResolvedPreview] = useState<Partial<Product> | null>(null);

  // Shopify Sync State
  const [shopifyStoreInput, setShopifyStoreInput] = useState('allbirds.com');
  const [isSyncingShopify, setIsSyncingShopify] = useState(false);
  const [shopifySyncSuccess, setShopifySyncSuccess] = useState<string | null>(null);


  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSource = selectedSource === 'ALL' || p.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  // Handle URL Scrape / Resolve
  const handleResolveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsResolvingUrl(true);
    setResolvedPreview(null);
    try {
      const data = await api.resolveProductUrl(urlInput.trim());
      setResolvedPreview(data);
    } catch (err: any) {
      alert(`Could not extract product: ${err.message}`);
    } finally {
      setIsResolvingUrl(false);
    }
  };

  const handleSaveResolvedProduct = async () => {
    if (!resolvedPreview) return;
    const created = await api.createProduct(resolvedPreview);
    onProductsUpdated([created, ...products]);
    setIsUrlModalOpen(false);
    setUrlInput('');
    setResolvedPreview(null);
  };

  // Handle Shopify Sync
  const handleSyncShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopifyStoreInput.trim()) return;
    setIsSyncingShopify(true);
    setShopifySyncSuccess(null);
    try {
      const result = await api.syncShopifyCatalog(shopifyStoreInput.trim());
      const updatedList = await api.getProducts();
      onProductsUpdated(updatedList);
      setShopifySyncSuccess(`Successfully synced ${result.count} products from ${result.store}!`);
      setTimeout(() => {
        setIsShopifyModalOpen(false);
        setShopifySyncSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(`Shopify sync failed: ${err.message}`);
    } finally {
      setIsSyncingShopify(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product from the central catalog?')) return;
    await api.deleteProduct(id);
    onProductsUpdated(products.filter((p) => p.id !== id));
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'SHOPIFY':
        return <span className="badge badge-emerald" style={{ fontSize: '10px' }}><Store size={10} style={{ marginRight: '3px' }} /> Shopify</span>;
      case 'AMAZON':
        return <span className="badge badge-amber" style={{ fontSize: '10px' }}><Tag size={10} style={{ marginRight: '3px' }} /> Amazon</span>;
      case 'STRIPE':
        return <span className="badge badge-purple" style={{ fontSize: '10px' }}><Sparkles size={10} style={{ marginRight: '3px' }} /> Stripe</span>;
      default:
        return <span className="badge badge-teal" style={{ fontSize: '10px' }}>Custom</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Actions Header */}
      <div className="surface-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShoppingBag size={20} color="var(--accent-teal)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Central Product Catalog
            </h2>
            <span className="badge badge-teal">{products.length} Products</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Products defined here can be reused across any video timeline, project, or live broadcast stream.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsShopifyModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Store size={15} color="var(--accent-emerald)" />
            <span>Sync Shopify Store</span>
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={() => setIsUrlModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Globe size={15} color="var(--accent-cyan)" />
            <span>Import Product URL</span>
          </button>

          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingProduct(null);
              setIsCreateModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>Add Custom Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search products by title, vendor, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Source Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'SHOPIFY', 'STRIPE', 'AMAZON', 'CUSTOM'].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              style={{
                background: selectedSource === src ? 'var(--accent-teal)' : 'var(--bg-surface)',
                color: selectedSource === src ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${selectedSource === src ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {src === 'ALL' ? 'All Sources' : src}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="surface-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShoppingBag size={42} color="var(--text-muted)" style={{ marginBottom: '14px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No products found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
            {searchQuery ? 'Try adjusting your search query or source filter.' : 'Start by importing products from Shopify, pasting any product link, or creating custom items.'}
          </p>
          <button className="btn btn-primary" onClick={() => setIsUrlModalOpen(true)}>
            <Globe size={15} style={{ marginRight: '6px' }} />
            Import First Product
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="surface-panel"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                padding: '14px',
                position: 'relative',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              {/* Thumbnail and badges */}
              <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
                <img 
                  src={product.imageUrl} 
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80');
                  }}
                />
                <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  {getSourceBadge(product.source)}
                </div>
                {product.imageUrls && product.imageUrls.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Layers size={10} />
                    <span>{product.imageUrls.length} photos</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                  ${product.price.toFixed(2)}
                </div>
              </div>

              {/* Product Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                    {product.title}
                  </h4>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Vendor: {product.vendor || 'Standard'} • In Stock: {product.inventoryCount ?? '99+'}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                  {product.description || 'No description provided.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                {product.externalUrl ? (
                  <a
                    href={product.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <span>Store Link</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct Checkout</span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsCreateModalOpen(true);
                    }}
                    title="Edit product & gallery"
                    style={{ color: 'var(--accent-teal)', width: '28px', height: '28px' }}
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => handleDelete(product.id)}
                    title="Remove from catalog"
                    style={{ color: 'var(--accent-red)', width: '28px', height: '28px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Instant URL Resolver */}
      {isUrlModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUrlModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Import Product from URL
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setIsUrlModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleResolveUrl}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Product Page URL (Shopify, Amazon, Stripe, Etsy, etc.)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://shop.allbirds.com/products/wool-runners..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={isResolvingUrl} style={{ whiteSpace: 'nowrap' }}>
                    {isResolvingUrl ? <RefreshCw size={14} className="spin" /> : 'Scrape'}
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Open Graph & Schema.org automatically detects title, high-res image, price, and currency.
                </span>
              </div>
            </form>

            {/* Resolved Preview Card */}
            {resolvedPreview && (
              <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', marginTop: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img 
                    src={resolvedPreview.imageUrl} 
                    alt="Preview" 
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{resolvedPreview.title}</div>
                    <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                      ${resolvedPreview.price?.toFixed(2)} {resolvedPreview.currency || 'USD'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Source: {resolvedPreview.source}</div>
                  </div>
                </div>

                <button 
                  className="btn btn-success" 
                  onClick={handleSaveResolvedProduct} 
                  style={{ width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Add to Central Catalog</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Shopify Storefront Sync */}
      {isShopifyModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsShopifyModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={18} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Sync Shopify Store Catalog
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setIsShopifyModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSyncShopify}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Shopify Store Domain</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. your-store.myshopify.com or brand.com"
                  value={shopifyStoreInput}
                  onChange={(e) => setShopifyStoreInput(e.target.value)}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Connects to the Shopify Storefront API and imports inventory with 1-click checkout permalinks.
                </span>
              </div>

              {shopifySyncSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#10B981', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} />
                  <span>{shopifySyncSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsShopifyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSyncingShopify} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSyncingShopify ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}
                  <span>{isSyncingShopify ? 'Syncing...' : 'Start Sync'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Polish Reusable Modal: Custom Product Create / Edit */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        initialValues={editingProduct || undefined}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProduct(null);
        }}
        onProductCreated={(saved) => {
          if (editingProduct) {
            onProductsUpdated(products.map((p) => (p.id === saved.id ? saved : p)));
          } else {
            onProductsUpdated([saved, ...products]);
          }
          setEditingProduct(null);
        }}
      />
    </div>
  );
}
