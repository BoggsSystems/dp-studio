import React, { useState, useRef } from 'react';
import { 
  ShoppingBag, 
  Upload, 
  Globe, 
  Sparkles, 
  X, 
  Check, 
  Tag, 
  Store, 
  CreditCard, 
  DollarSign, 
  Eye, 
  Image as ImageIcon,
  ExternalLink,
  Layers,
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: Product) => void;
  initialValues?: Partial<Product>;
}

const SAMPLE_PRESETS = [
  {
    title: 'Minimalist Obsidian Watch',
    price: '89.00',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    vendor: 'Chronos Studio',
    source: 'CUSTOM' as const,
    description: 'Precision Japanese quartz movement with sapphire glass and Italian leather band.',
    externalUrl: 'https://shop.example.com/watch',
  },
  {
    title: 'DigitPop Founder Heavyweight Hoodie',
    price: '54.00',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    vendor: 'DigitPop Apparel',
    source: 'SHOPIFY' as const,
    description: '450gsm ultra-dense fleece hoodie with reflective silicone crest.',
    externalUrl: 'https://brand.myshopify.com/cart/412351:1',
  },
  {
    title: 'Pro ANC Wireless Earbuds',
    price: '79.00',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    vendor: 'Acoustics Lab',
    source: 'STRIPE' as const,
    description: 'Spatial audio with 42dB active noise cancellation and 36-hour battery case.',
    externalUrl: 'https://buy.stripe.com/demo_earbuds',
  },
  {
    title: 'Bi-Color Studio Key Light',
    price: '119.00',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
    vendor: 'StreamCraft',
    source: 'AMAZON' as const,
    description: 'App-controlled 2800K-7000K edge-lit broadcast panel with desk clamp.',
    externalUrl: 'https://amazon.com/dp/B082QHRZHM',
  },
  {
    title: 'Matte Waterproof Commuter Bag',
    price: '68.00',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    vendor: 'Nomad Gear',
    source: 'SHOPIFY' as const,
    description: 'Cordura ballistic nylon with magnetic Fidlock closures and 16" laptop sleeve.',
    externalUrl: 'https://brand.myshopify.com/cart/994120:1',
  },
  {
    title: 'Single-Origin Ethiopian Roast',
    price: '22.00',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    vendor: 'Apex Roasters',
    source: 'CUSTOM' as const,
    description: 'Notes of wild blueberry, jasmine flower, and Meyer lemon. Fresh whole bean.',
    externalUrl: 'https://shop.example.com/coffee',
  },
];

const PRICE_QUICK_PRESETS = ['19.00', '29.99', '49.00', '79.00', '99.00', '149.00'];

export default function CreateProductModal({
  isOpen,
  onClose,
  onProductCreated,
  initialValues,
}: CreateProductModalProps) {
  if (!isOpen) return null;

  // Form State
  const [title, setTitle] = useState(initialValues?.title || '');
  const [price, setPrice] = useState(initialValues?.price ? String(initialValues.price) : '29.99');
  const [source, setSource] = useState<'CUSTOM' | 'SHOPIFY' | 'STRIPE' | 'AMAZON'>(
    initialValues?.source || 'CUSTOM'
  );
  const [vendor, setVendor] = useState(initialValues?.vendor || 'In-House');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [externalUrl, setExternalUrl] = useState(initialValues?.externalUrl || '');
  const [stripePriceId, setStripePriceId] = useState(initialValues?.stripePriceId || '');
  const [inventoryCount, setInventoryCount] = useState<number>(initialValues?.inventoryCount ?? 100);

  // Image handling
  const [imageMode, setImageMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [imageUrl, setImageUrl] = useState(
    initialValues?.imageUrl || SAMPLE_PRESETS[0].imageUrl
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Preview Mode
  const [previewTab, setPreviewTab] = useState<'drawer' | 'inspect' | 'catalog'>('drawer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file selection or drag-drop
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WEBP).');
      return;
    }

    // Immediate local base64 preview
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Upload to Cloudflare R2
    setIsUploading(true);
    setUploadProgress(15);
    try {
      const { url } = await api.uploadMedia(file, 'products', (pct) => {
        setUploadProgress(pct);
      });
      setImageUrl(url);
    } catch (err) {
      console.warn('R2 upload notice, keeping local preview');
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setTitle(preset.title);
    setPrice(preset.price);
    setImageUrl(preset.imageUrl);
    setVendor(preset.vendor);
    setSource(preset.source);
    setDescription(preset.description);
    setExternalUrl(preset.externalUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a product title');
      return;
    }

    const newProd = await api.createProduct({
      title: title.trim(),
      price: parseFloat(price) || 0,
      currency: 'USD',
      imageUrl: imageUrl.trim(),
      source,
      vendor: vendor.trim() || (source === 'CUSTOM' ? 'In-House' : source),
      description: description.trim(),
      externalUrl: externalUrl.trim(),
      stripePriceId: source === 'STRIPE' ? stripePriceId.trim() : undefined,
      inventoryCount,
    });

    onProductCreated(newProd);
    onClose();
  };

  const getSourceBadge = (src: string) => {
    switch (src) {
      case 'SHOPIFY':
        return <span className="badge badge-emerald"><Store size={10} style={{ marginRight: '3px' }} /> Shopify</span>;
      case 'AMAZON':
        return <span className="badge badge-amber"><Tag size={10} style={{ marginRight: '3px' }} /> Amazon</span>;
      case 'STRIPE':
        return <span className="badge badge-purple"><Sparkles size={10} style={{ marginRight: '3px' }} /> Stripe</span>;
      default:
        return <span className="badge badge-teal">Custom</span>;
    }
  };

  const parsedPrice = parseFloat(price) || 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '920px', 
          width: '94vw', 
          maxHeight: '92vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-strong)',
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ 
          padding: '18px 24px', 
          borderBottom: '1px solid var(--border-subtle)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(13, 148, 136, 0.18)', 
              border: '1px solid rgba(20, 184, 166, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent-teal-light)'
            }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Create Shoppable Product
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Add an item to your central catalog with live video drawer preview
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="icon-btn" 
            onClick={onClose}
            aria-label="Close modal"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body - 2 Column Split Layout */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.25fr 0.95fr', 
            gap: '24px', 
            padding: '24px',
            overflowY: 'auto',
            maxHeight: 'calc(92vh - 130px)',
          }}>
            {/* LEFT COLUMN: Input Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Preset Sample Helper Banner */}
              <div style={{ 
                background: 'rgba(30, 41, 59, 0.6)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={14} color="var(--accent-teal)" />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Want a quick demo item?
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(SAMPLE_PRESETS[0])}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    Watch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(SAMPLE_PRESETS[1])}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    Hoodie
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(SAMPLE_PRESETS[2])}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    Earbuds
                  </button>
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Product Title *</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'none' }}>
                    {title.length}/80
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Signature Italian Leather Watch"
                  value={title}
                  maxLength={80}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Price & Quick Chips */}
              <div>
                <label className="form-label">Price (USD) *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      style={{ paddingLeft: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>USD</span>
                </div>

                {/* Quick Price Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRICE_QUICK_PRESETS.map((pVal) => (
                    <button
                      key={pVal}
                      type="button"
                      onClick={() => setPrice(pVal)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: price === pVal ? 'var(--accent-teal)' : 'var(--bg-surface)',
                        color: price === pVal ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${price === pVal ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      ${pVal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Type & Vendor / Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">E-Commerce Source</label>
                  <select
                    className="form-select"
                    value={source}
                    onChange={(e) => {
                      const newSrc = e.target.value as any;
                      setSource(newSrc);
                      if (vendor === 'In-House' || vendor === 'Shopify' || vendor === 'Stripe' || vendor === 'Amazon') {
                        setVendor(newSrc === 'CUSTOM' ? 'In-House' : newSrc);
                      }
                    }}
                  >
                    <option value="CUSTOM">In-House / Direct</option>
                    <option value="SHOPIFY">Shopify Storefront</option>
                    <option value="STRIPE">Stripe Payment Link</option>
                    <option value="AMAZON">Amazon Affiliate</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Brand / Vendor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Allbirds, Apple, Nike"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  />
                </div>
              </div>

              {/* Media & Image Picker */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Product Imagery</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        background: imageMode === 'upload' ? 'var(--bg-surface-elevated)' : 'transparent',
                        color: imageMode === 'upload' ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        background: imageMode === 'url' ? 'var(--bg-surface-elevated)' : 'transparent',
                        color: imageMode === 'url' ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('presets')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        background: imageMode === 'presets' ? 'var(--bg-surface-elevated)' : 'transparent',
                        color: imageMode === 'presets' ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Gallery
                    </button>
                  </div>
                </div>

                {/* Sub-view: Upload File */}
                {imageMode === 'upload' && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? 'var(--accent-teal)' : 'var(--border-medium)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '20px 14px',
                      textAlign: 'center',
                      background: isDragging ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <Upload size={22} color="var(--accent-teal)" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {isUploading ? `Uploading to R2 (${uploadProgress}%)...` : 'Click or drop product photo here'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      PNG, JPG, WEBP up to 10MB
                    </div>
                  </div>
                )}

                {/* Sub-view: URL Input */}
                {imageMode === 'url' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://images.unsplash.com/... or CDN link"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                )}

                {/* Sub-view: Presets Gallery */}
                {imageMode === 'presets' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setImageUrl(preset.imageUrl)}
                        style={{
                          height: '56px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: `2px solid ${imageUrl === preset.imageUrl ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        title={preset.title}
                      >
                        <img src={preset.imageUrl} alt="preset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {imageUrl === preset.imageUrl && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(20, 184, 166, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout / External Link */}
              <div>
                <label className="form-label">
                  Checkout / Destination Link
                </label>
                <div style={{ position: 'relative' }}>
                  <ExternalLink size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="url"
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder={
                      source === 'SHOPIFY' 
                        ? 'https://store.myshopify.com/cart/{variant_id}:1'
                        : source === 'STRIPE'
                        ? 'https://buy.stripe.com/...'
                        : source === 'AMAZON'
                        ? 'https://amazon.com/dp/...'
                        : 'https://store.com/product/...'
                    }
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* If Stripe, show Stripe Price ID */}
              {source === 'STRIPE' && (
                <div>
                  <label className="form-label">Stripe Price ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="price_1N..."
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    value={stripePriceId}
                    onChange={(e) => setStripePriceId(e.target.value)}
                  />
                </div>
              )}

              {/* Short Description */}
              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Short Description</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'none' }}>
                    {description.length}/250
                  </span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  maxLength={250}
                  placeholder="Details shown to viewer when paused or inspected..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Live Shoppable Card Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="var(--accent-teal)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                    Live Customer Card Preview
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('drawer')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      background: previewTab === 'drawer' ? 'var(--accent-teal)' : 'var(--bg-surface)',
                      color: previewTab === 'drawer' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Drawer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('inspect')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      background: previewTab === 'inspect' ? 'var(--accent-teal)' : 'var(--bg-surface)',
                      color: previewTab === 'inspect' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Inspect
                  </button>
                </div>
              </div>

              {/* Preview Canvas Simulated Frame */}
              <div style={{ 
                background: 'radial-gradient(circle at 50% 10%, #1e293b 0%, #080d16 100%)', 
                border: '1px solid var(--border-medium)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '340px',
              }}>
                
                {/* Subtle video indicator badge in background */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                  ● PLAYER OVERLAY SIMULATOR
                </div>

                {/* THE ACTUAL LIVE CARD */}
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.95)', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 'var(--radius-md)', 
                  width: '100%',
                  maxWidth: '320px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  {/* Card Image Container */}
                  <div style={{ position: 'relative', width: '100%', height: '170px', background: '#000', overflow: 'hidden' }}>
                    <img
                      src={imageUrl}
                      alt={title || 'Product preview'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute('src', SAMPLE_PRESETS[0].imageUrl);
                      }}
                    />
                    <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                      {getSourceBadge(source)}
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '8px', 
                      right: '8px', 
                      background: 'rgba(0,0,0,0.8)', 
                      backdropFilter: 'blur(8px)',
                      color: '#10B981', 
                      fontWeight: 800, 
                      fontSize: '13px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ${parsedPrice.toFixed(2)}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {vendor || 'In-House'}
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                        {title || 'Untitled Product'}
                      </h4>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, minHeight: '32px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {description || 'Interactive product preview as seen by live broadcast viewers.'}
                    </p>

                    {/* 1-Click Buy button preview */}
                    <button
                      type="button"
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '9px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        marginTop: '4px',
                      }}
                    >
                      <CreditCard size={13} />
                      <span>1-Click Buy (${parsedPrice.toFixed(2)})</span>
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', maxWidth: '280px' }}>
                  ⚡ Updates dynamically as you type. Attached to video timeline groups without re-rendering the media stream.
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer */}
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border-subtle)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.5)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PackageCheck size={14} color="var(--accent-teal)" />
              Saves to Central Catalog for reusable timeline placement
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!title.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: title.trim() ? 1 : 0.5 }}
              >
                <Check size={14} />
                <span>Save to Catalog</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
