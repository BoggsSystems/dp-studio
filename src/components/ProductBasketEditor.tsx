import { useState } from 'react';
import { 
  Tag, 
  Trash2, 
  Plus, 
  CreditCard, 
  ShoppingBag,
  ExternalLink,
  Store,
  Sparkles,
  Layers,
  Edit3
} from 'lucide-react';
import { ProductGroup, Product, ViewingMode } from '../types';
import ProductPickerModal from './ProductPickerModal';
import CreateProductModal from './CreateProductModal';

interface ProductBasketEditorProps {
  selectedGroup: ProductGroup | null;
  onUpdateGroup: (group: ProductGroup) => void;
  onDeleteGroup: (id: string) => void;
  currentTime: number;
  catalogProducts: Product[];
  onCatalogUpdated: (newCatalog: Product[]) => void;
}

export default function ProductBasketEditor({
  selectedGroup,
  onUpdateGroup,
  onDeleteGroup,
  currentTime,
  catalogProducts,
  onCatalogUpdated,
}: ProductBasketEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingProductIdx, setEditingProductIdx] = useState<number | null>(null);
  if (!selectedGroup) {
    return (
      <div
        className="surface-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }}
        >
          <Tag size={20} />
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          No Shoppable Pin Selected
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px' }}>
          Click an existing pin on the timeline or click <strong>Drop Shoppable Pin</strong> to attach products to this moment in your video.
        </div>
      </div>
    );
  }

  const handleFieldChange = (field: keyof ProductGroup, value: any) => {
    onUpdateGroup({ ...selectedGroup, [field]: value });
  };

  const handleAddProduct = () => {
    const defaultImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      title: 'New Featured Product',
      price: 29.99,
      currency: 'USD',
      imageUrl: defaultImg,
      imageUrls: [defaultImg],
      stripePriceId: '',
      description: '',
    };
    onUpdateGroup({
      ...selectedGroup,
      products: [...selectedGroup.products, newProduct],
    });
  };

  const handleUpdateProduct = (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...selectedGroup.products];
    const current = { ...updatedProducts[index], [field]: value };
    if (field === 'imageUrl') {
      const currentGallery = current.imageUrls && current.imageUrls.length > 0 ? [...current.imageUrls] : [];
      if (currentGallery.length > 0) {
        currentGallery[0] = value;
      } else {
        currentGallery.push(value);
      }
      current.imageUrls = currentGallery;
    }
    updatedProducts[index] = current;
    onUpdateGroup({ ...selectedGroup, products: updatedProducts });
  };

  const handleProductSavedFromModal = (saved: Product) => {
    if (editingProductIdx !== null) {
      const updatedProducts = [...selectedGroup.products];
      updatedProducts[editingProductIdx] = saved;
      onUpdateGroup({ ...selectedGroup, products: updatedProducts });
      if (catalogProducts.some((p) => p.id === saved.id)) {
        onCatalogUpdated(catalogProducts.map((p) => (p.id === saved.id ? saved : p)));
      }
      setEditingProductIdx(null);
    }
  };

  const handleDeleteProduct = (index: number) => {
    const updatedProducts = selectedGroup.products.filter((_, i) => i !== index);
    onUpdateGroup({ ...selectedGroup, products: updatedProducts });
  };

  return (
    <div className="surface-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <div className="panel-title">
            <Tag size={16} color="var(--accent-teal)" />
            <span>Shoppable Overlay Pin</span>
          </div>
          <div className="panel-desc">
            Configure the trigger timing, viewing mode, and 1-click Stripe products for this overlay.
          </div>
        </div>

        <button
          className="btn btn-ghost"
          style={{ color: 'var(--accent-rose)', padding: '6px' }}
          onClick={() => onDeleteGroup(selectedGroup.id)}
          title="Delete this Shoppable Pin"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Pin Meta Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Pin Title / Showcase Header</label>
          <input
            type="text"
            className="form-input"
            value={selectedGroup.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="e.g. Featured Keynote Bundle"
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">Trigger Time (Sec)</label>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '10px', padding: '0 4px', height: '16px' }}
              onClick={() => handleFieldChange('timestampSeconds', parseFloat(currentTime.toFixed(1)))}
              title="Snap to current playhead"
            >
              Use Playhead ({currentTime.toFixed(1)}s)
            </button>
          </div>
          <input
            type="number"
            step="0.1"
            className="form-input"
            style={{ fontFamily: 'var(--font-mono)' }}
            value={selectedGroup.timestampSeconds}
            onChange={(e) => handleFieldChange('timestampSeconds', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Subtitle & Viewing Mode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Subtitle / Promotion Hook</label>
          <input
            type="text"
            className="form-input"
            value={selectedGroup.subtitle || ''}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            placeholder="e.g. Instant 1-Click Checkout Available"
          />
        </div>

        <div className="form-group">
          <label className="form-label">In-Player Viewing Mode</label>
          <select
            className="form-select"
            value={selectedGroup.viewingMode}
            onChange={(e) => handleFieldChange('viewingMode', e.target.value as ViewingMode)}
          >
            <option value="SIDE_PANEL">Side Panel (Non-intrusive drawer)</option>
            <option value="TAP_TO_REVEAL">Tap to Reveal (Interactive hotspot)</option>
            <option value="PAUSE_INSPECT">Pause & Inspect (Full showcase)</option>
          </select>
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '18px 0' }} />

      {/* Products inside this Pin */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingBag size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Products in this Pin ({selectedGroup.products.length})
          </span>
        </div>

        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setIsPickerOpen(true)}>
          <Plus size={13} /> Select from Catalog / Import
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {selectedGroup.products.map((product, idx) => (
          <div
            key={product.id}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {/* Product Thumbnail Preview with Multi-Image Indicator */}
              <div
                style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
                onClick={() => setEditingProductIdx(idx)}
                title="Click to edit gallery and photos in Product Studio"
              >
                {(product.imageUrl || product.imageUrls?.[0]) ? (
                  <img
                    src={product.imageUrl || product.imageUrls?.[0]}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    <ShoppingBag size={20} />
                  </div>
                )}

                {product.imageUrls && product.imageUrls.length > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: 'var(--accent-teal)',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                    }}
                  >
                    <Layers size={8} />
                    <span>{product.imageUrls.length}</span>
                  </div>
                )}
              </div>

              {/* Product Fields */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                    value={product.title}
                    onChange={(e) => handleUpdateProduct(idx, 'title', e.target.value)}
                    placeholder="Product Title"
                  />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '9px', fontSize: '12px', color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ paddingLeft: '20px', fontFamily: 'var(--font-mono)' }}
                      value={product.price}
                      onChange={(e) => handleUpdateProduct(idx, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCard size={12} color="var(--accent-teal)" />
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                      value={product.stripePriceId || ''}
                      onChange={(e) => handleUpdateProduct(idx, 'stripePriceId', e.target.value)}
                      placeholder="Stripe Price ID (price_...)"
                    />
                  </div>

                  <input
                    type="url"
                    className="form-input"
                    style={{ fontSize: '11px' }}
                    value={product.imageUrl}
                    onChange={(e) => handleUpdateProduct(idx, 'imageUrl', e.target.value)}
                    placeholder="Image URL"
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px', color: 'var(--accent-teal)' }}
                  onClick={() => setEditingProductIdx(idx)}
                  title="Edit Product & Multi-Image Gallery in Studio"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px', color: 'var(--text-muted)' }}
                  onClick={() => handleDeleteProduct(idx)}
                  title="Remove Product"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reusable Product Picker Modal */}
      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        catalogProducts={catalogProducts}
        currentlyAttachedProductIds={selectedGroup.products.map((p) => p.id)}
        onAttachProducts={(attached) => {
          onUpdateGroup({ ...selectedGroup, products: attached });
        }}
        onCatalogUpdated={onCatalogUpdated}
      />

      {/* Product Studio Creator / Multi-Photo Gallery Modal */}
      {editingProductIdx !== null && selectedGroup.products[editingProductIdx] && (
        <CreateProductModal
          isOpen={true}
          initialValues={selectedGroup.products[editingProductIdx]}
          onClose={() => setEditingProductIdx(null)}
          onProductCreated={handleProductSavedFromModal}
        />
      )}
    </div>
  );
}
