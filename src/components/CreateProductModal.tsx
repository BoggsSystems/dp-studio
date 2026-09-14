import React, { useState, useRef, useEffect } from 'react';
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
  PackageCheck,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Product, CheckoutType } from '../types';
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
    imageUrls: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600&auto=format&fit=crop&q=80',
    ],
    vendor: 'Chronos Studio',
    source: 'CUSTOM' as const,
    description: 'Precision Japanese quartz movement with sapphire glass and Italian leather band.',
    externalUrl: 'https://shop.example.com/watch',
  },
  {
    title: 'DigitPop Founder Heavyweight Hoodie',
    price: '54.00',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    ],
    vendor: 'DigitPop Apparel',
    source: 'SHOPIFY' as const,
    description: '450gsm ultra-dense fleece hoodie with reflective silicone crest.',
    externalUrl: 'https://brand.myshopify.com/cart/412351:1',
  },
  {
    title: 'Pro ANC Wireless Earbuds',
    price: '79.00',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
    ],
    vendor: 'Acoustics Lab',
    source: 'STRIPE' as const,
    description: 'Spatial audio with 42dB active noise cancellation and 36-hour battery case.',
    externalUrl: 'https://buy.stripe.com/demo_earbuds',
  },
  {
    title: 'Bi-Color Studio Key Light',
    price: '119.00',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    ],
    vendor: 'StreamCraft',
    source: 'AMAZON' as const,
    description: 'App-controlled 2800K-7000K edge-lit broadcast panel with desk clamp.',
    externalUrl: 'https://amazon.com/dp/B082QHRZHM',
  },
  {
    title: 'Matte Waterproof Commuter Bag',
    price: '68.00',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    ],
    vendor: 'Nomad Gear',
    source: 'SHOPIFY' as const,
    description: 'Cordura ballistic nylon with magnetic Fidlock closures and 16" laptop sleeve.',
    externalUrl: 'https://brand.myshopify.com/cart/994120:1',
  },
  {
    title: 'Single-Origin Ethiopian Roast',
    price: '22.00',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
    ],
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
  // Form State
  const [title, setTitle] = useState(initialValues?.title || '');
  const [price, setPrice] = useState(initialValues?.price ? String(initialValues.price) : '29.99');
  const [source, setSource] = useState<'CUSTOM' | 'SHOPIFY' | 'STRIPE' | 'AMAZON'>(
    initialValues?.source || 'CUSTOM'
  );
  const [checkoutType, setCheckoutType] = useState<CheckoutType>(
    initialValues?.checkoutType || (initialValues?.source === 'AMAZON' ? 'AMAZON' : initialValues?.source === 'SHOPIFY' ? 'SHOPIFY' : 'NATIVE_STRIPE')
  );
  const [buttonTextOverride, setButtonTextOverride] = useState<string>(initialValues?.buttonTextOverride || '');
  const [vendor, setVendor] = useState(initialValues?.vendor || 'In-House');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [externalUrl, setExternalUrl] = useState(initialValues?.externalUrl || '');
  const [stripePriceId, setStripePriceId] = useState(initialValues?.stripePriceId || '');
  const [inventoryCount, setInventoryCount] = useState<number>(initialValues?.inventoryCount ?? 100);

  // Multi-Image Handling
  const [imageMode, setImageMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (initialValues?.imageUrls && initialValues.imageUrls.length > 0) {
      return initialValues.imageUrls;
    }
    if (initialValues?.imageUrl) {
      return [initialValues.imageUrl];
    }
    return SAMPLE_PRESETS[0].imageUrls;
  });
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Preview Mode
  const [previewTab, setPreviewTab] = useState<'drawer' | 'inspect' | 'catalog'>('drawer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or initialValues change
  useEffect(() => {
    if (isOpen) {
      setTitle(initialValues?.title || '');
      setPrice(initialValues?.price ? String(initialValues.price) : '29.99');
      setSource(initialValues?.source || 'CUSTOM');
      setCheckoutType(initialValues?.checkoutType || (initialValues?.source === 'AMAZON' ? 'AMAZON' : initialValues?.source === 'SHOPIFY' ? 'SHOPIFY' : 'NATIVE_STRIPE'));
      setButtonTextOverride(initialValues?.buttonTextOverride || '');
      setVendor(initialValues?.vendor || 'In-House');
      setDescription(initialValues?.description || '');
      setExternalUrl(initialValues?.externalUrl || '');
      setStripePriceId(initialValues?.stripePriceId || '');
      setInventoryCount(initialValues?.inventoryCount ?? 100);
      if (initialValues?.imageUrls && initialValues.imageUrls.length > 0) {
        setImageUrls(initialValues.imageUrls);
      } else if (initialValues?.imageUrl) {
        setImageUrls([initialValues.imageUrl]);
      } else {
        setImageUrls(SAMPLE_PRESETS[0].imageUrls);
      }
      setActivePreviewIdx(0);
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  // Handle multi-file select or drag-drop
  const handleFilesSelect = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Please select image files (JPG, PNG, WEBP).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    // Read base64 previews immediately
    const localPreviews = await Promise.all(
      validFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          })
      )
    );
    setImageUrls((prev) => [...prev, ...localPreviews]);

    // Perform background R2 cloud upload
    try {
      let completed = 0;
      const uploadedUrls: string[] = [];
      for (const file of validFiles) {
        const { url } = await api.uploadMedia(file, 'products', (pct) => {
          const overall = Math.round((completed * 100 + pct) / validFiles.length);
          setUploadProgress(overall);
        });
        uploadedUrls.push(url);
        completed++;
      }

      // Replace local base64 previews with real R2 URLs
      setImageUrls((prev) => {
        const kept = prev.filter((u) => !localPreviews.includes(u));
        return [...kept, ...uploadedUrls];
      });
    } catch (err) {
      console.warn('R2 upload notice, keeping preview images');
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
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customUrlInput.trim()) return;
    setImageUrls((prev) => [...prev, customUrlInput.trim()]);
    setCustomUrlInput('');
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setImageUrls((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    setActivePreviewIdx(0);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [SAMPLE_PRESETS[0].imageUrl];
    });
    if (activePreviewIdx >= index && activePreviewIdx > 0) {
      setActivePreviewIdx((prev) => prev - 1);
    }
  };

  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setTitle(preset.title);
    setPrice(preset.price);
    setImageUrls(preset.imageUrls);
    setActivePreviewIdx(0);
    setVendor(preset.vendor);
    setSource(preset.source);
    const cType: CheckoutType = preset.source === 'AMAZON' ? 'AMAZON' : preset.source === 'SHOPIFY' ? 'SHOPIFY' : preset.source === 'STRIPE' ? 'NATIVE_STRIPE' : 'EXTERNAL_LINK';
    setCheckoutType(cType);
    setButtonTextOverride('');
    setDescription(preset.description);
    setExternalUrl(preset.externalUrl);
  };

  const isEditMode = Boolean(initialValues?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a product title');
      return;
    }

    const primaryImg = imageUrls[0] || SAMPLE_PRESETS[0].imageUrl;
    let resultProd: Product;

    if (initialValues?.id) {
      resultProd = await api.updateProduct(initialValues.id, {
        title: title.trim(),
        price: parseFloat(price) || 0,
        currency: 'USD',
        imageUrl: primaryImg,
        imageUrls: imageUrls.length > 0 ? imageUrls : [primaryImg],
        source,
        checkoutType,
        buttonTextOverride: buttonTextOverride.trim() || undefined,
        vendor: vendor.trim() || (source === 'CUSTOM' ? 'In-House' : source),
        description: description.trim(),
        externalUrl: externalUrl.trim(),
        stripePriceId: source === 'STRIPE' ? stripePriceId.trim() : undefined,
        inventoryCount,
      });
    } else {
      resultProd = await api.createProduct({
        title: title.trim(),
        price: parseFloat(price) || 0,
        currency: 'USD',
        imageUrl: primaryImg,
        imageUrls: imageUrls.length > 0 ? imageUrls : [primaryImg],
        source,
        checkoutType,
        buttonTextOverride: buttonTextOverride.trim() || undefined,
        vendor: vendor.trim() || (source === 'CUSTOM' ? 'In-House' : source),
        description: description.trim(),
        externalUrl: externalUrl.trim(),
        stripePriceId: source === 'STRIPE' ? stripePriceId.trim() : undefined,
        inventoryCount,
      });
    }

    onProductCreated(resultProd);
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
  const currentPreviewUrl = imageUrls[activePreviewIdx] || imageUrls[0] || SAMPLE_PRESETS[0].imageUrl;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '960px', 
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
              border: '1px solid rgba(13, 148, 136, 0.35)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent-teal)'
            }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {isEditMode ? 'Edit Shoppable Product' : 'Create Shoppable Product'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {isEditMode ? 'Update multi-photo gallery, pricing, and live interactive video preview' : 'Add an item to your central catalog with multi-photo gallery and live video drawer preview'}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Container with 2-Column Split Layout */}
        <form onSubmit={handleSubmit}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.25fr 1fr', 
            gap: '24px', 
            padding: '24px',
            maxHeight: 'calc(92vh - 145px)',
            overflowY: 'auto'
          }}>
            
            {/* LEFT COLUMN: Input Fields */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Price (USD) *</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PRICE_QUICK_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrice(p)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: price === p ? 'var(--accent-teal)' : 'var(--bg-surface)',
                          color: price === p ? '#ffffff' : 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        ${p}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    style={{ paddingLeft: '28px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Source and Vendor Dual Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">E-Commerce Source</label>
                  <select
                    className="form-select"
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
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

              {/* MULTI-IMAGE GALLERY MANAGER */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Product Imagery</label>
                    <span style={{ fontSize: '11px', color: 'var(--accent-teal)', fontWeight: 600 }}>
                      ({imageUrls.length} {imageUrls.length === 1 ? 'photo' : 'photos'})
                    </span>
                  </div>
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
                      Upload File(s)
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
                      Preset Galleries
                    </button>
                  </div>
                </div>

                {/* Sub-view: Upload File(s) Dropzone */}
                {imageMode === 'upload' && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? 'var(--accent-teal)' : 'var(--border-medium)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px 14px',
                      textAlign: 'center',
                      background: isDragging ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginBottom: '10px'
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFilesSelect(e.target.files);
                        }
                      }}
                    />
                    <Upload size={20} color="var(--accent-teal)" style={{ margin: '0 auto 6px', opacity: 0.8 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {isUploading ? `Uploading photos to R2 (${uploadProgress}%)...` : 'Click or drop multiple product photos here'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Drag 1 or more PNG, JPG, WEBP photos up to 10MB each
                    </div>
                  </div>
                )}

                {/* Sub-view: URL Input with Add Button */}
                {imageMode === 'url' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Paste image URL (Unsplash, CDN, or Web link)..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleAddUrl()}
                      disabled={!customUrlInput.trim()}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                )}

                {/* Sub-view: Presets Gallery */}
                {imageMode === 'presets' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '10px' }}>
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setImageUrls(preset.imageUrls);
                          setActivePreviewIdx(0);
                        }}
                        style={{
                          height: '52px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: `2px solid ${imageUrls === preset.imageUrls ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        title={`${preset.title} (${preset.imageUrls.length} photos)`}
                      >
                        <img src={preset.imageUrl} alt="preset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', fontSize: '9px', padding: '1px 3px', borderRadius: '2px', color: '#fff' }}>
                          {preset.imageUrls.length}p
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ATTACHED GALLERY THUMBNAIL STRIP */}
                <div style={{ 
                  background: 'var(--bg-canvas)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Attached Gallery ({imageUrls.length} photos) • Star to set cover</span>
                    <span>Click photo to preview</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {imageUrls.map((url, idx) => {
                      const isCover = idx === 0;
                      const isActive = idx === activePreviewIdx;
                      return (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '68px',
                            height: '68px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: `2px solid ${isActive ? 'var(--accent-teal)' : isCover ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            background: '#000',
                          }}
                          onClick={() => setActivePreviewIdx(idx)}
                        >
                          <img 
                            src={url} 
                            alt={`Photo ${idx + 1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />

                          {/* Cover Badge */}
                          {isCover && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '2px', 
                              left: '2px', 
                              background: '#F59E0B', 
                              color: '#000', 
                              fontSize: '8px', 
                              fontWeight: 800, 
                              padding: '1px 3px', 
                              borderRadius: '2px' 
                            }}>
                              COVER
                            </div>
                          )}

                          {/* Action Overlay */}
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '0', 
                            left: '0', 
                            right: '0', 
                            background: 'rgba(0,0,0,0.7)', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '2px 4px' 
                          }}>
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMakeCover(idx);
                                }}
                                title="Set as primary cover"
                                style={{ background: 'transparent', border: 'none', color: '#F59E0B', cursor: 'pointer', padding: 0 }}
                              >
                                <Star size={11} />
                              </button>
                            ) : <span />}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(idx);
                              }}
                              title="Delete photo"
                              style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick Add Button */}
                    <div
                      onClick={() => {
                        if (imageMode !== 'upload') setImageMode('upload');
                        fileInputRef.current?.click();
                      }}
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '4px',
                        border: '2px dashed var(--border-medium)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: 'rgba(255,255,255,0.02)'
                      }}
                      title="Add more photos"
                    >
                      <Plus size={16} />
                      <span style={{ fontSize: '9px', marginTop: '2px' }}>Add</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Destination & Call-To-Action Settings */}
              <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>
                    Checkout Destination / Gateway
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { type: 'NATIVE_STRIPE' as const, label: 'Stripe Direct', icon: CreditCard },
                      { type: 'AMAZON' as const, label: 'Amazon', icon: Tag },
                      { type: 'SHOPIFY' as const, label: 'Shopify', icon: Store },
                      { type: 'EXTERNAL_LINK' as const, label: 'Web Store', icon: ExternalLink },
                    ].map((dest) => {
                      const Icon = dest.icon;
                      const active = checkoutType === dest.type;
                      return (
                        <button
                          key={dest.type}
                          type="button"
                          onClick={() => {
                            setCheckoutType(dest.type);
                            if (dest.type === 'AMAZON') setSource('AMAZON');
                            else if (dest.type === 'SHOPIFY') setSource('SHOPIFY');
                            else if (dest.type === 'NATIVE_STRIPE') setSource('STRIPE');
                            else setSource('CUSTOM');
                          }}
                          style={{
                            padding: '6px 4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: `1px solid ${active ? 'var(--accent-teal)' : 'var(--border-medium)'}`,
                            background: active ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-surface)',
                            color: active ? 'var(--accent-teal)' : 'var(--text-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <Icon size={14} />
                          <span>{dest.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* External / Checkout URL */}
                <div>
                  <label className="form-label" style={{ marginBottom: '4px' }}>
                    {checkoutType === 'AMAZON' ? 'Amazon Affiliate / Product Link' : checkoutType === 'SHOPIFY' ? 'Shopify Cart / Store Link' : checkoutType === 'EXTERNAL_LINK' ? 'Store Website URL' : 'Optional Direct Link (Fallback)'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ExternalLink size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="url"
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                      placeholder={
                        checkoutType === 'AMAZON'
                          ? 'https://amazon.com/dp/B08...?tag=creator-20'
                          : checkoutType === 'SHOPIFY'
                          ? 'https://store.myshopify.com/cart/{variant_id}:1'
                          : checkoutType === 'EXTERNAL_LINK'
                          ? 'https://store.example.com/products/item'
                          : 'https://buy.stripe.com/... (optional fallback)'
                      }
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                    />
                  </div>
                </div>

                {/* Button Text Override */}
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Button CTA Override (Optional)</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Default: {checkoutType === 'AMAZON' ? 'BUY ON AMAZON' : checkoutType === 'SHOPIFY' ? 'BUY ON SHOPIFY' : checkoutType === 'EXTERNAL_LINK' ? 'VISIT STORE' : 'BUY NOW'}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={
                      checkoutType === 'AMAZON'
                        ? 'BUY ON AMAZON'
                        : checkoutType === 'SHOPIFY'
                        ? 'BUY ON SHOPIFY'
                        : checkoutType === 'EXTERNAL_LINK'
                        ? 'SHOP ON NIKE'
                        : 'BUY NOW'
                    }
                    value={buttonTextOverride}
                    onChange={(e) => setButtonTextOverride(e.target.value)}
                  />
                </div>

                {/* If Stripe, show Stripe Price ID */}
                {checkoutType === 'NATIVE_STRIPE' && (
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
              </div>

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
                  placeholder="Details shown to viewer when paused or Inspected..."
                  rows={2}
                  maxLength={250}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Interactive Live Card Preview Simulator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Preview Header Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="var(--accent-teal)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                    Live Customer Card Preview
                  </span>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('drawer')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      background: previewTab === 'drawer' ? 'var(--accent-teal)' : 'transparent',
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
                      background: previewTab === 'inspect' ? 'var(--accent-teal)' : 'transparent',
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
                minHeight: '380px',
              }}>
                
                {/* Video indicator badge */}
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
                  {/* Card Image Container with Gallery Navigation */}
                  <div style={{ position: 'relative', width: '100%', height: '170px', background: '#000', overflow: 'hidden' }}>
                    <img
                      src={currentPreviewUrl}
                      alt={title || 'Product preview'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.2s ease' }}
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute('src', SAMPLE_PRESETS[0].imageUrl);
                      }}
                    />

                    {/* Source Tag Badge */}
                    <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                      {getSourceBadge(source)}
                    </div>

                    {/* Multi-Photo Counter Badge */}
                    {imageUrls.length > 1 && (
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
                        gap: '3px'
                      }}>
                        <ImageIcon size={10} />
                        <span>{activePreviewIdx + 1}/{imageUrls.length}</span>
                      </div>
                    )}

                    {/* Left / Right Carousel Controls */}
                    {imageUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePreviewIdx((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
                          }}
                          style={{
                            position: 'absolute',
                            left: '4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePreviewIdx((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
                          }}
                          style={{
                            position: 'absolute',
                            right: '4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </>
                    )}

                    {/* Price Tag */}
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

                  {/* Micro Thumbnail Navigation inside Card */}
                  {imageUrls.length > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '6px 8px 0',
                      background: 'rgba(15, 23, 42, 0.6)'
                    }}>
                      {imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePreviewIdx(idx)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            border: `1px solid ${idx === activePreviewIdx ? 'var(--accent-teal)' : 'rgba(255,255,255,0.2)'}`,
                            cursor: 'pointer',
                            opacity: idx === activePreviewIdx ? 1 : 0.6,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <img src={url} alt="dot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}

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
                  ⚡ Viewer can browse all {imageUrls.length} angles seamlessly during live broadcast or VOD playback.
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
              Saves {imageUrls.length} photos to Central Catalog for reusable timeline placement
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
                disabled={!title.trim() || isUploading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: (title.trim() && !isUploading) ? 1 : 0.5 }}
              >
                <Check size={14} />
                <span>{isEditMode ? 'Save Changes' : 'Save to Catalog'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
