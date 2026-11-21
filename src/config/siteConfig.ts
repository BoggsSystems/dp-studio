/**
 * ShopVideo.tv Platform Configuration
 * Centralized brand, domain, and commercial pricing configuration.
 * All customer-facing text, URLs, and plan tiers are decoupled to ensure
 * seamless custom domain and brand consistency.
 */

export interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  playsPerMonth: string;
  hostedVideos: string;
  storage: string;
  liveStreaming: string;
  features: string[];
  ctaText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
}

export interface FeatureComparisonRow {
  category: string;
  feature: string;
  free: string | boolean;
  growth: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export const siteConfig = {
  brand: {
    name: import.meta.env.VITE_BRAND_NAME || 'ShopVideo',
    domainSuffix: '.tv',
    fullName: 'ShopVideo.tv',
    tagline: 'Next-Gen Interactive Shoppable Video Hosting & Live Streaming',
    headline: 'Turn Any Video Into An Interactive 1-Click Storefront',
    subheadline:
      'Ultra-fast global video hosting, frame-synchronized product drawers, and 1-click checkout powered by shopvideo.tv. Boost engagement by 34% with zero buffering, zero revenue share, and zero surprise overages.',
    domain: import.meta.env.VITE_APP_DOMAIN || 'shopvideo.tv',
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@shopvideo.tv',
    playerCdnUrl: import.meta.env.VITE_PLAYER_URL || 'http://localhost:4201',
    serverApiUrl: import.meta.env.VITE_API_URL || 'http://localhost:9000',
    studioUrl: import.meta.env.VITE_STUDIO_URL || 'http://localhost:4205',
  },

  trustBadges: [
    { label: '0% GMV Take Rate — Keep 100% of Sales', icon: 'ShieldCheck' },
    { label: '14-Day Free Trial — No Credit Card Needed', icon: 'CreditCard' },
    { label: 'Works with Shopify, WooCommerce & Custom Web', icon: 'ShoppingBag' },
    { label: 'Cloudflare Global Edge — <30ms Cold-Start', icon: 'Zap' },
  ],

  stats: [
    { value: '+34%', label: 'Average CTR Boost' },
    { value: '2.8x', label: 'Longer Session Watch Time' },
    { value: '<30ms', label: 'Global Edge Video Seek' },
    { value: '0%', label: 'Platform Sales Commission' },
  ],

  pricingTiers: [
    {
      id: 'trial',
      name: 'Free Trial',
      tagline: 'Explore the platform and test shoppable video on your store.',
      priceMonthly: 0,
      priceAnnual: 0,
      playsPerMonth: '1,000 active plays',
      hostedVideos: '5 videos',
      storage: '10 GB Cloud Storage',
      liveStreaming: 'Viewer Only',
      ctaText: 'Start Free Trial',
      buttonVariant: 'outline',
      features: [
        '1,000 engaged video plays / mo',
        'Up to 5 hosted videos',
        'Timeline Pins & Shoppable Drawers',
        'Shopify & Amazon catalog links',
        'Standard ShopVideo player embed',
        'Basic views & click analytics',
        'ShopVideo.tv watermark',
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      popular: true,
      badge: 'Most Popular',
      tagline: 'Ideal for growing Shopify brands and direct-to-consumer creators.',
      priceMonthly: 49,
      priceAnnual: 39,
      playsPerMonth: '15,000 active plays',
      hostedVideos: '50 videos',
      storage: '100 GB Cloud Storage',
      liveStreaming: '2 Live Drops / mo (45 min each)',
      ctaText: 'Start 14-Day Free Trial',
      buttonVariant: 'primary',
      features: [
        '15,000 engaged video plays / mo',
        'Up to 50 hosted videos',
        'ShopVideo Watermark Removed',
        'Stripe 1-Click Native Checkout',
        'Split-Panel Co-Pilot Product Rail',
        'Pause-to-Inspect Freeze Frame',
        '2 Live Shoppable Drops / month',
        'Shopify product catalog auto-sync',
        'Product-level drop-off analytics',
        'Viral Spike Protection guarantee',
      ],
    },
    {
      id: 'pro',
      name: 'Scale / Pro',
      badge: 'Best Value',
      tagline: 'For high-velocity e-commerce brands and multi-channel creators.',
      priceMonthly: 179,
      priceAnnual: 149,
      playsPerMonth: '75,000 active plays',
      hostedVideos: '250 videos',
      storage: '500 GB Cloud Storage',
      liveStreaming: 'Unlimited Live Broadcasts',
      ctaText: 'Start 14-Day Free Trial',
      buttonVariant: 'secondary',
      features: [
        '75,000 engaged video plays / mo',
        'Up to 250 hosted videos',
        'Unlimited Live Shopping Broadcasts',
        'In-Browser Studio Master Control',
        'AI Product Catalog Auto-Tagging',
        'Dynamic Product Variants & Bundles',
        'Klaviyo CRM & Webhook Automation',
        'Custom Player Colors & CSS Theme',
        '3 Team Member Seats',
        'Priority Global Edge CDN routing',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'Custom infrastructure for top-tier retailers, agencies, and marketplaces.',
      priceMonthly: 599,
      priceAnnual: 499,
      playsPerMonth: '300,000+ active plays',
      hostedVideos: 'Unlimited videos',
      storage: '2 TB+ Dedicated Storage',
      liveStreaming: 'Multi-Host RTMP Relay',
      ctaText: 'Contact Enterprise',
      buttonVariant: 'outline',
      features: [
        '300,000+ engaged video plays / mo',
        'Unlimited hosted videos & storage',
        'Full Whitelabel & Custom Domain CDN',
        'Multi-Host RTMP (YouTube & Twitch relay)',
        'Custom Player React SDK & Web Component',
        'Dedicated Solutions Architect & SLA',
        'Enterprise Single Sign-On (SSO)',
        'Custom ERP & Inventory Integration',
        'Unlimited Team Workspaces',
      ],
    },
  ] as PricingTier[],

  overagePolicy: {
    rate: '$15 per 10,000 extra engaged plays',
    costPerPlay: '$0.0015',
    guarantee:
      'Viral Spike Protection: We never cut off your video streams during a traffic surge. You receive soft alerts at 80% and 100% capacity with 48-hour grace periods to upgrade or pay low, flat overages.',
  },

  comparisonMatrix: [
    // Video Hosting & Delivery
    { category: 'Hosting & Streaming', feature: 'Cloudflare Stream & R2 Multi-Bitrate HLS', free: true, growth: true, pro: true, enterprise: true },
    { category: 'Hosting & Streaming', feature: 'Engaged Plays Included / mo', free: '1,000', growth: '15,000', pro: '75,000', enterprise: '300,000+' },
    { category: 'Hosting & Streaming', feature: 'Hosted Video Storage', free: '10 GB', growth: '100 GB', pro: '500 GB', enterprise: '2 TB+' },
    { category: 'Hosting & Streaming', feature: 'Global Edge Cold-Start (<30ms)', free: true, growth: true, pro: true, enterprise: true },
    { category: 'Hosting & Streaming', feature: 'Overage Cost per 10k Plays', free: 'N/A', growth: '$15', pro: '$15', enterprise: 'Custom' },
    
    // Shoppable Video UX
    { category: 'Interactive Commerce', feature: 'Timeline Pins & Product Groups', free: true, growth: true, pro: true, enterprise: true },
    { category: 'Interactive Commerce', feature: 'Shoppable Slide-Out Drawers', free: true, growth: true, pro: true, enterprise: true },
    { category: 'Interactive Commerce', feature: 'Split-Panel Co-Pilot Product Rail', free: false, growth: true, pro: true, enterprise: true },
    { category: 'Interactive Commerce', feature: 'Pause-to-Inspect Freeze Frame', free: false, growth: true, pro: true, enterprise: true },
    { category: 'Interactive Commerce', feature: 'Native Stripe 1-Click Checkout', free: false, growth: true, pro: true, enterprise: true },
    { category: 'Interactive Commerce', feature: 'Platform GMV Take Rate', free: '0%', growth: '0%', pro: '0%', enterprise: '0%' },
    
    // Live Shopping
    { category: 'Live Shopping Studio', feature: 'Live Stream Shopping Events', free: 'Viewer Only', growth: '2 / month', pro: 'Unlimited', enterprise: 'Unlimited' },
    { category: 'Live Shopping Studio', feature: 'Webcam & OBS Studio Control', free: false, growth: true, pro: true, enterprise: true },
    { category: 'Live Shopping Studio', feature: 'RTMP Relay to YouTube & Twitch', free: false, growth: false, pro: true, enterprise: true },
    
    // Customization & Branding
    { category: 'Branding & Embeds', feature: 'Universal 1-Line Script Embed', free: true, growth: true, pro: true, enterprise: true },
    { category: 'Branding & Embeds', feature: 'Remove ShopVideo Watermark', free: false, growth: true, pro: true, enterprise: true },
    { category: 'Branding & Embeds', feature: 'Custom Domain Player CDN', free: false, growth: false, pro: false, enterprise: true },
    { category: 'Branding & Embeds', feature: 'Team Member Seats', free: '1', growth: '1', pro: '3', enterprise: 'Unlimited' },
  ] as FeatureComparisonRow[],

  faq: [
    {
      question: 'How is ShopVideo.tv different from Tolstoy or Videowise?',
      answer:
        'Competitors charge for passive "impressions" — meaning every time a page loads or someone scrolls past a widget, your monthly quota is burned. ShopVideo.tv only counts engaged plays (>3 seconds watched). Furthermore, we bundle full high-performance video hosting and live studio broadcasting without forcing you to pay $1,300+/month like Bambuser.',
    },
    {
      question: 'Do you charge a percentage of sales (GMV fee)?',
      answer:
        'No. We charge a flat, predictable SaaS fee and take 0% of your sales. You connect your own Stripe or Shopify checkout, and 100% of purchase revenue goes directly into your merchant account.',
    },
    {
      question: 'What happens if my video goes viral and exceeds plan quotas?',
      answer:
        'With our Viral Spike Protection, we never cut off or degrade your videos mid-campaign. You receive automated notifications at 80% and 100% capacity, and any excess traffic is billed at a transparent rate of just $15 per 10,000 extra engaged plays (over 50% cheaper than industry averages).',
    },
    {
      question: 'Can I embed ShopVideo videos onto Shopify, Webflow, or custom sites?',
      answer:
        'Yes. You can embed our interactive shoppable video player anywhere with a single line of JavaScript (<script>) or an iframe. We also offer a modern React 18 component package (@shopvideo/player-react) for custom headless storefronts.',
    },
    {
      question: 'Can I cancel or change my plan anytime?',
      answer:
        'Yes, you can upgrade, downgrade, or cancel your subscription at any time directly through the Stripe Customer Billing Portal in your studio settings.',
    },
  ] as FAQItem[],
};
