# DigitPop Studio (`dp-studio`)

The official **AI-Native Shoppable Video Creation Studio** for DigitPop & Opportunity OS.

---

## ⚡ Core Capabilities

- **Cloudflare R2 Direct Edge Storage**: S3-compatible SigV4 direct video and asset ingest with zero-egress fee edge CDN streaming (`https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev`).
- **Interactive Dual-Track Timeline Scrubber**: Precision visual scrubber with playhead synchronization and drag-and-drop Shoppable Pin triggers.
- **AI Autopilot Product & Entity Scanner**: Real-time computer vision frame sampling and speech transcript entity extraction for 1-click pin placement.
- **Stripe 1-Click Multi-Item Checkout**: In-player payment flows with bundle discounts and variant selectors.
- **AI Content Repurposing (9:16 Shorts)**: Automatic vertical video extraction with virality scoring and multi-social auto-publishing (TikTok, Shorts, Reels, X).
- **Watch-to-Earn Quiz Engine**: Proof-of-attention multiple choice challenges with PopCoin token awards and sponsor CPC billing.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (Port 4205)
npm run dev

# 3. Compile and typecheck
npm run typecheck
npm run build
```

---

## 📦 System Architecture

- **Framework**: React 18 + Vite + TypeScript 5
- **Icons**: Lucide React
- **Design System**: HSL Tailored Precision Slate Tokens (`src/index.css`)
- **Backend**: `DigitPopServer` (NestJS + Prisma PostgreSQL on port 9000)
- **Object Storage**: Cloudflare R2 (`digitpop-media`)
