import React, { useState, useEffect } from "react";
import { 
  Globe, 
  ExternalLink, 
  Save, 
  Sparkles, 
  Pin, 
  Check, 
  RefreshCw,
  Video,
  Palette
} from "lucide-react";
import { Project } from "../types";

export type CreatorAccentColor = "sky" | "blue" | "pink" | "amber" | "emerald" | "purple";

export interface SocialProfile {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  isVerified: boolean;
  category: string;
  accentColor?: CreatorAccentColor;
  stats?: {
    followers: number;
    following: number;
    totalLikes: number;
    totalViews: number;
    curatedProductsCount: number;
  };
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
}

interface VideoDistributionItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  durationSeconds?: number;
  status: string;
  isPublishedToSocial: boolean;
  isPinned: boolean;
  productsCount: number;
  createdAt: string;
}

interface StorefrontManagerProps {
  creatorHandle?: string;
  onNavigateToShorts?: (project: Project) => void;
}

const ACCENT_COLORS: { id: CreatorAccentColor; name: string; hex: string }[] = [
  { id: "sky", name: "Sky Blue", hex: "#0284c7" },
  { id: "blue", name: "Deep Royal", hex: "#2563eb" },
  { id: "pink", name: "Neon Rose", hex: "#e11d48" },
  { id: "amber", name: "Warm Amber", hex: "#d97706" },
  { id: "emerald", name: "Emerald", hex: "#059669" },
  { id: "purple", name: "Electric Violet", hex: "#7c3aed" },
];

export default function StorefrontManager({ creatorHandle = "jeffboggs" }: StorefrontManagerProps) {
  const [handle, setHandle] = useState(creatorHandle.toLowerCase().replace(/^@/, ""));
  const [profile, setProfile] = useState<SocialProfile>({
    id: "creator-" + handle,
    handle,
    displayName: "Jeffrey Boggs",
    avatarUrl: "https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/thumbnails/opportunity-os-about.jpg",
    bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    bio: "Founder & Systems Architect @ Opportunity OS & ShopVideo.tv. Building high-velocity autonomous agent systems and shoppable video infrastructure.",
    isVerified: true,
    category: "AI Engineering & Systems Architecture",
    accentColor: "sky",
    socialLinks: {
      website: "https://boggs.build",
      youtube: "https://youtube.com/@jeffreyboggs",
      tiktok: "https://tiktok.com/@boggs.build",
    },
  });

  const [videos, setVideos] = useState<VideoDistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const apiBase = (
    (import.meta as any).env?.VITE_API_URL ||
    (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:9000"
      : "https://digitpop.opportunity-system.com")
  ).replace(/\/+$/, "");

  const liveStorefrontUrl = "https://shop.shopvideo.tv/@" + handle;

  // Fetch creator profile and library videos
  const loadStorefrontData = async () => {
    setIsLoading(true);
    try {
      const profileRes = await fetch(apiBase + "/api/public/social/creators/" + handle);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      const libraryRes = await fetch(apiBase + "/api/publisher/shorts/library?creatorSlug=" + handle);
      if (libraryRes.ok) {
        const libData = await libraryRes.json();
        if (libData && Array.isArray(libData.shorts)) {
          const items: VideoDistributionItem[] = libData.shorts.map((s: any) => {
            const meta = s.metadata || {};
            const socialDist = meta.distributions?.socialPage;
            const isSocialPub = socialDist
              ? socialDist.status === "PUBLISHED"
              : meta.isPublishedToSocial === true || ((handle === "jeffboggs" || handle === "opportunity-system") && s.status === "READY");

            return {
              id: s.id,
              title: s.title || "Untitled Short",
              thumbnailUrl: s.thumbnailUrl || "",
              videoUrl: s.videoUrl,
              durationSeconds: s.durationSeconds || 30,
              status: s.status,
              isPublishedToSocial: Boolean(isSocialPub),
              isPinned: Boolean(socialDist?.isPinned || meta.isPinned),
              productsCount: meta.productTitle ? 1 : 0,
              createdAt: s.createdAt,
            };
          });
          setVideos(items);
        }
      }
    } catch (err) {
      console.warn("[StorefrontManager] Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorefrontData();
  }, [handle]);

  // Save profile updates
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(apiBase + "/api/publisher/social/creators/" + handle + "/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("[StorefrontManager] Error updating profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle video publishing to Social storefront
  const handleTogglePublish = async (videoId: string, currentPublished: boolean, isPinned: boolean) => {
    setActionInProgressId(videoId);
    const newPublished = !currentPublished;

    try {
      const res = await fetch(apiBase + "/api/publisher/social/videos/" + videoId + "/distribution", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublishedToSocial: newPublished,
          isPinned,
        }),
      });

      if (res.ok) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId ? { ...v, isPublishedToSocial: newPublished } : v
          )
        );
      }
    } catch (err) {
      console.error("[StorefrontManager] Failed to toggle publish status:", err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Toggle video pinned status
  const handleTogglePin = async (videoId: string, isPublished: boolean, currentPinned: boolean) => {
    setActionInProgressId(videoId);
    const newPinned = !currentPinned;

    try {
      const res = await fetch(apiBase + "/api/publisher/social/videos/" + videoId + "/distribution", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublishedToSocial: isPublished,
          isPinned: newPinned,
        }),
      });

      if (res.ok) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId ? { ...v, isPinned: newPinned } : v
          )
        );
      }
    } catch (err) {
      console.error("[StorefrontManager] Failed to toggle pin status:", err);
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Top Banner / Live Link Preview */}
      <div 
        style={{
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "28px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div 
            style={{ 
              width: "56px", 
              height: "56px", 
              borderRadius: "16px", 
              background: "rgba(56, 189, 248, 0.12)", 
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8"
            }}
          >
            <Globe size={28} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                My ShopVideo Social Storefront
              </h1>
              <span 
                style={{ 
                  background: "rgba(34, 197, 94, 0.15)", 
                  color: "#4ade80", 
                  border: "1px solid rgba(34, 197, 94, 0.3)", 
                  fontSize: "11px", 
                  fontWeight: 700, 
                  padding: "2px 8px", 
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
                LIVE
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0 0" }}>
              Customize your public creator storefront on <strong style={{ color: "#e2e8f0" }}>ShopVideo Social</strong> and manage instant 1-click video distribution.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href={liveStorefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "#0284c7",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
          >
            <span>Open Live: shop.shopvideo.tv/@{handle}</span>
            <ExternalLink size={14} />
          </a>
          <button
            onClick={loadStorefrontData}
            title="Refresh Data"
            style={{
              padding: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        {/* Left Column: Creator Profile Customizer */}
        <div 
          style={{
            background: "var(--bg-secondary, #0f172a)",
            border: "1px solid var(--border-medium, rgba(255,255,255,0.08))",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Palette size={18} color="#38bdf8" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Storefront Branding & Theme
            </h2>
          </div>

          {/* Accent Color Swatches */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
              Brand Accent Color
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {ACCENT_COLORS.map((c) => {
                const isSelected = profile.accentColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, accentColor: c.id })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: isSelected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                      border: isSelected ? "2px solid " + c.hex : "1px solid rgba(255,255,255,0.08)",
                      color: isSelected ? "#ffffff" : "#94a3b8",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    <span 
                      style={{ 
                        width: "14px", 
                        height: "14px", 
                        borderRadius: "50%", 
                        background: c.hex,
                        boxShadow: isSelected ? "0 0 10px " + c.hex : "none"
                      }} 
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Handle & Display Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                Storefront Handle
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b", fontSize: "13px" }}>@</span>
                <input
                  type="text"
                  value={profile.handle}
                  onChange={(e) => {
                    const h = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                    setHandle(h);
                    setProfile({ ...profile, handle: h });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px 8px 24px",
                    borderRadius: "8px",
                    background: "#020617",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                Display Name
              </label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "#020617",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f8fafc",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
              Category & Focus
            </label>
            <input
              type="text"
              value={profile.category}
              onChange={(e) => setProfile({ ...profile, category: e.target.value })}
              placeholder="e.g. AI Engineering & Systems Architecture"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f8fafc",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
              Bio Description
            </label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Write a brief introduction for your storefront visitors..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f8fafc",
                fontSize: "13px",
                resize: "vertical",
              }}
            />
          </div>

          {/* Media Links */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                Avatar Image URL
              </label>
              <input
                type="text"
                value={profile.avatarUrl}
                onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "#020617",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                Banner Header URL
              </label>
              <input
                type="text"
                value={profile.bannerUrl}
                onChange={(e) => setProfile({ ...profile, bannerUrl: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "#020617",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          {/* External Links */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
              Creator Website / Portfolio Link
            </label>
            <input
              type="text"
              value={profile.socialLinks?.website || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  socialLinks: { ...profile.socialLinks, website: e.target.value },
                })
              }
              placeholder="https://boggs.build"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f8fafc",
                fontSize: "12px",
              }}
            />
          </div>

          {/* Save Action */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "#0284c7",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <Save size={14} />
              <span>{isSaving ? "Saving Changes..." : "Save Storefront Profile"}</span>
            </button>

            {saveSuccess && (
              <span style={{ fontSize: "12px", color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}>
                <Check size={14} /> Saved & Synced Live!
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Video Distribution Grid */}
        <div 
          style={{
            background: "var(--bg-secondary, #0f172a)",
            border: "1px solid var(--border-medium, rgba(255,255,255,0.08))",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Video size={18} color="#38bdf8" />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                Storefront Video Catalog ({videos.filter(v => v.isPublishedToSocial).length} Active)
              </h2>
            </div>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {videos.length} Shorts in Library
            </span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
              <div 
                style={{
                  width: "28px",
                  height: "28px",
                  border: "3px solid rgba(255,255,255,0.1)",
                  borderTopColor: "#38bdf8",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <span style={{ fontSize: "13px" }}>Loading creator videos...</span>
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
              <p style={{ fontSize: "14px", marginBottom: "12px" }}>No shorts recorded or imported yet.</p>
              <p style={{ fontSize: "12px", color: "#64748b" }}>
                Create videos in the 9:16 Shorts Studio or Teleprompter to distribute them here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "520px", overflowY: "auto" }}>
              {videos.map((vid) => {
                const isOperating = actionInProgressId === vid.id;
                return (
                  <div
                    key={vid.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: vid.isPublishedToSocial ? "rgba(2, 132, 199, 0.08)" : "rgba(255,255,255,0.02)",
                      border: vid.isPublishedToSocial ? "1px solid rgba(56, 189, 248, 0.25)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      gap: "12px",
                    }}
                  >
                    {/* Thumbnail & Title */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                      <div 
                        style={{
                          width: "44px",
                          height: "66px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "#020617",
                          flexShrink: 0,
                          position: "relative",
                        }}
                      >
                        {vid.thumbnailUrl ? (
                          <img 
                            src={vid.thumbnailUrl} 
                            alt={vid.title} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                            <Video size={16} />
                          </div>
                        )}
                        {vid.isPinned && (
                          <div 
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              background: "#38bdf8",
                              color: "#020617",
                              borderRadius: "4px",
                              padding: "2px",
                            }}
                            title="Pinned to top of storefront"
                          >
                            <Pin size={10} />
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 
                          style={{ 
                            fontSize: "13px", 
                            fontWeight: 600, 
                            color: "#f8fafc", 
                            margin: "0 0 4px 0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis" 
                          }}
                        >
                          {vid.title}
                        </h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#94a3b8" }}>
                          <span>{vid.durationSeconds}s</span>
                          <span>•</span>
                          <span 
                            style={{ 
                              color: vid.isPublishedToSocial ? "#38bdf8" : "#94a3b8",
                              fontWeight: vid.isPublishedToSocial ? 700 : 500,
                            }}
                          >
                            {vid.isPublishedToSocial ? "Live on Social" : "Draft / Off-air"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controls: Pin & Toggle Publish */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(vid.id, vid.isPublishedToSocial, vid.isPinned)}
                        disabled={isOperating}
                        title={vid.isPinned ? "Unpin from Top" : "Pin to Top of Storefront"}
                        style={{
                          padding: "6px 10px",
                          background: vid.isPinned ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.05)",
                          border: vid.isPinned ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          color: vid.isPinned ? "#38bdf8" : "#94a3b8",
                          cursor: isOperating ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        <Pin size={12} />
                        <span>{vid.isPinned ? "Pinned" : "Pin"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(vid.id, vid.isPublishedToSocial, vid.isPinned)}
                        disabled={isOperating}
                        style={{
                          padding: "6px 12px",
                          background: vid.isPublishedToSocial ? "rgba(239, 68, 68, 0.15)" : "rgba(2, 132, 199, 0.8)",
                          border: vid.isPublishedToSocial ? "1px solid rgba(239, 68, 68, 0.4)" : "none",
                          borderRadius: "6px",
                          color: vid.isPublishedToSocial ? "#f87171" : "#ffffff",
                          cursor: isOperating ? "not-allowed" : "pointer",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {vid.isPublishedToSocial ? "Remove" : "Publish to Social"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
