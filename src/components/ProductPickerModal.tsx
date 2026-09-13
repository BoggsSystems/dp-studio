import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Check, 
  Globe, 
  Store, 
  RefreshCw,
  Tag,
  Sparkles,
  X
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts: Product[];
  currentlyAttachedProductIds: string[];
  onAttachProducts: (productsToAttach: Product[]) => void;
  onCatalogUpdated: (newCatalog: Product[]) => void;
}

export default function ProductPickerModal({
  isOpen,
  onClose,
  catalogProducts,
  currentlyAttachedProductIds,
  onAttachProducts,
  onCatalogUpdated,
}: ProductPickerModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'catalog' | 'url' | 'create'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(currentlyAttachedProductIds)
  );

  // Tab 2: URL Scrape State
  const [urlInput, setUrlInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [scrapedProduct, setScrapedProduct] = useState<Partial<Product> | null>(null);

  // Tab 3: Quick Create State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPrice, setQuickPrice] = useState('29.99');
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [quickExternalUrl, setQuickExternalUrl] = useState('');

  // Toggle selection in catalog tab
  const toggleSelect = (product: Product) => {
    const next = new Set(selectedIds);
    if (next.has(product.id)) {
      next.delete(product.id);
    } else {
      next.add(product.id);
    }
    setSelectedIds(next);
  };

  const handleConfirmAttach = () => {
    const selected = catalogProducts.filter((p) => selectedIds.has(p.id));
    onAttachProducts(selected);
    onClose();
  };

  // Scrape and attach
  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsResolving(true);
    setScrapedProduct(null);
    try {
      const data = await api.resolveProductUrl(urlInput.trim());
      setScrapedProduct(data);
    } catch (e: any) {
      alert(`Scrape error: ${e.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleSaveAndAttachScraped = async () => {
    if (!scrapedProduct) return;
    const created = await api.createProduct(scrapedProduct);
    onCatalogUpdated([created, ...catalogProducts]);
    onAttachProducts([
      ...catalogProducts.filter((p) => selectedIds.has(p.id)),
      created,
    ]);
    onClose();
  };

  // Quick create and attach
  const handleQuickCreateAndAttach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const created = await api.createProduct({
      title: quickTitle.trim(),
      price: parseFloat(quickPrice) || 0,
      imageUrl: quickImageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      externalUrl: quickExternalUrl.trim(),
      currency: 'USD',
      source: 'CUSTOM',
    });
    onCatalogUpdated([created, ...catalogProducts]);
    onAttachProducts([
      ...catalogProducts.filter((p) => selectedIds.has(p.id)),
      created,
    ]);
    onClose();
  };

  const filteredCatalog = catalogProducts.filter((p) => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'SHOPIFY':
        return <span className="badge badge-emerald" style={{ fontSize: '10px' }}><Store size={9} style={{ marginRight: '2px' }} /> Shopify</span>;
      case 'AMAZON':
        return <span className="badge badge-amber" style={{ fontSize: '10px' }}><Tag size={9} style={{ marginRight: '2px' }} /> Amazon</span>;
      case 'STRIPE':
        return <span className="badge badge-purple" style={{ fontSize: '10px' }}><Sparkles size={9} style={{ marginRight: '2px' }} /> Stripe</span>;
      default:
        return <span className="badge badge-teal" style={{ fontSize: '10px' }}>Custom</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="var(--accent-teal)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Attach Products to Timeline Group
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'catalog' ? '2px solid var(--accent-teal)' : '2px solid transparent',
              color: activeTab === 'catalog' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            My Catalog ({catalogProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'url' ? '2px solid var(--accent-teal)' : '2px solid transparent',
              color: activeTab === 'url' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Import from URL / Shopify
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'create' ? '2px solid var(--accent-teal)' : '2px solid transparent',
              color: activeTab === 'create' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Quick Create
          </button>
        </div>

        {/* TAB 1: Master Catalog List */}
        {activeTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '13px' }}
                placeholder="Search catalog products to attach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', paddingRight: '4px' }}>
              {filteredCatalog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No catalog products found. Try importing from URL or quick creating one.
                </div>
              ) : (
                filteredCatalog.map((product) => {
                  const isChecked = selectedIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleSelect(product)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        background: isChecked ? 'rgba(20, 184, 166, 0.1)' : 'var(--bg-canvas)',
                        border: `1px solid ${isChecked ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Checkbox indicator */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `1px solid ${isChecked ? 'var(--accent-teal)' : 'var(--border-medium)'}`,
                          background: isChecked ? 'var(--accent-teal)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>

                      {/* Image */}
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{ width: '42px', height: '42px', borderRadius: '4px', objectFit: 'cover' }}
                      />

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
                            ${product.price.toFixed(2)}
                          </span>
                          {getSourceBadge(product.source)}
                          {product.vendor && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              • {product.vendor}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>{selectedIds.size}</strong> product(s) selected
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleConfirmAttach}>
                  Attach Selected to Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Instant URL / Shopify */}
        {activeTab === 'url' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <form onSubmit={handleScrapeUrl}>
              <label className="form-label">Shopify, Amazon, or Product Page URL</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://brand.myshopify.com/products/jacket..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={isResolving} style={{ whiteSpace: 'nowrap' }}>
                  {isResolving ? <RefreshCw size={14} className="spin" /> : 'Scrape'}
                </button>
              </div>
            </form>

            {scrapedProduct && (
              <div style={{ background: 'var(--bg-canvas)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <img src={scrapedProduct.imageUrl} alt="Preview" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{scrapedProduct.title}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>${scrapedProduct.price?.toFixed(2)} USD</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Source: {scrapedProduct.source}</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleSaveAndAttachScraped}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Import & Attach to Timeline Group</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Quick Create */}
        {activeTab === 'create' && (
          <form onSubmit={handleQuickCreateAndAttach} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label">Product Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vintage Leather Watch"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Price (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={quickImageUrl}
                  onChange={(e) => setQuickImageUrl(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Checkout / External URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://checkout.stripe.com/... or https://store.com/..."
                value={quickExternalUrl}
                onChange={(e) => setQuickExternalUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create & Attach</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
