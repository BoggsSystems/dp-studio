import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CreatorAccentColor = "sky" | "blue" | "pink" | "amber" | "emerald" | "purple";

export interface BrandChannel {
  id: string;
  handle: string;
  displayName: string;
  category: string;
  accentColor: CreatorAccentColor;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  isDefault?: boolean;
}

const DEFAULT_CHANNELS: BrandChannel[] = [
  {
    id: "chan-jeffboggs",
    handle: "jeffboggs",
    displayName: "Jeffrey Boggs",
    category: "AI Engineering & Systems Architecture",
    accentColor: "sky",
    avatarUrl: "https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/thumbnails/opportunity-os-about.jpg",
    bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    bio: "Founder & Systems Architect @ Opportunity OS & ShopVideo.tv. Building high-velocity autonomous agent systems.",
    isDefault: true,
  },
  {
    id: "chan-chefboyarjeff",
    handle: "chefboyarjeff",
    displayName: "Chef Boyarjeff",
    category: "Culinary & Smart Kitchen",
    accentColor: "amber",
    avatarUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=80",
    bio: "Culinary innovator & kitchen tech enthusiast. Transforming home cooking with precision equipment and live shoppable masterclasses.",
    isDefault: false,
  },
];

interface ChannelContextType {
  channels: BrandChannel[];
  activeChannel: BrandChannel;
  setActiveChannel: (channel: BrandChannel) => void;
  switchChannelByHandle: (handle: string) => void;
  createNewChannel: (dto: Partial<BrandChannel>) => Promise<BrandChannel>;
  updateChannel: (handle: string, patch: Partial<BrandChannel>) => Promise<BrandChannel>;
  isLoading: boolean;
  isManagerModalOpen: boolean;
  setIsManagerModalOpen: (open: boolean) => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<BrandChannel[]>(() => {
    try {
      const saved = localStorage.getItem("dp_studio_channels");
      return saved ? JSON.parse(saved) : DEFAULT_CHANNELS;
    } catch {
      return DEFAULT_CHANNELS;
    }
  });

  const [activeChannel, setActiveChannelState] = useState<BrandChannel>(() => {
    try {
      const savedHandle = localStorage.getItem("dp_studio_active_channel_handle");
      if (savedHandle) {
        const found = channels.find((c) => c.handle === savedHandle);
        if (found) return found;
      }
    } catch {}
    return channels[0] || DEFAULT_CHANNELS[0];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  const apiBase = (
    (import.meta as any).env?.VITE_API_URL ||
    (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:9000"
      : "https://digitpop.opportunity-system.com")
  ).replace(/\/+$/, "");

  // Fetch channels from server on mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch(apiBase + "/api/publisher/channels");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setChannels(data);
            localStorage.setItem("dp_studio_channels", JSON.stringify(data));
            // Ensure activeChannel is synced
            setActiveChannelState((prev) => {
              const matched = data.find((c: BrandChannel) => c.handle === prev.handle);
              return matched || data[0];
            });
          }
        }
      } catch (e) {
        console.warn("Could not load channels from server, using local defaults:", e);
      }
    };
    fetchChannels();
  }, [apiBase]);

  const setActiveChannel = (channel: BrandChannel) => {
    setActiveChannelState(channel);
    try {
      localStorage.setItem("dp_studio_active_channel_handle", channel.handle);
    } catch {}
  };

  const switchChannelByHandle = (handle: string) => {
    const clean = handle.replace(/^@/, "").toLowerCase();
    const found = channels.find((c) => c.handle === clean);
    if (found) {
      setActiveChannel(found);
    }
  };

  const createNewChannel = async (dto: Partial<BrandChannel>): Promise<BrandChannel> => {
    setIsLoading(true);
    try {
      const res = await fetch(apiBase + "/api/publisher/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });

      if (res.ok) {
        const newChan = await res.json();
        const updatedList = [...channels.filter((c) => c.handle !== newChan.handle), newChan];
        setChannels(updatedList);
        localStorage.setItem("dp_studio_channels", JSON.stringify(updatedList));
        setActiveChannel(newChan);
        return newChan;
      }
    } catch (err) {
      console.error("Failed to create brand channel:", err);
    } finally {
      setIsLoading(false);
    }

    // Local fallback
    const fallbackHandle = (dto.handle || "newbrand").replace(/^@/, "").toLowerCase();
    const fallbackChan: BrandChannel = {
      id: "chan-" + fallbackHandle + "-" + Date.now(),
      handle: fallbackHandle,
      displayName: dto.displayName || fallbackHandle,
      category: dto.category || "Shoppable Creator",
      accentColor: dto.accentColor || "sky",
      avatarUrl: dto.avatarUrl || "https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/thumbnails/opportunity-os-about.jpg",
      bannerUrl: dto.bannerUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
      bio: dto.bio || ("Official channel for @" + fallbackHandle),
    };
    const updated = [...channels, fallbackChan];
    setChannels(updated);
    localStorage.setItem("dp_studio_channels", JSON.stringify(updated));
    setActiveChannel(fallbackChan);
    return fallbackChan;
  };

  const updateChannel = async (handle: string, patch: Partial<BrandChannel>): Promise<BrandChannel> => {
    const clean = handle.replace(/^@/, "").toLowerCase();
    try {
      const res = await fetch(apiBase + "/api/publisher/channels/" + clean, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updatedChan = await res.json();
        const updatedList = channels.map((c) => (c.handle === clean ? { ...c, ...updatedChan } : c));
        setChannels(updatedList);
        localStorage.setItem("dp_studio_channels", JSON.stringify(updatedList));
        if (activeChannel.handle === clean) {
          setActiveChannel({ ...activeChannel, ...updatedChan });
        }
        return updatedChan;
      }
    } catch (err) {
      console.warn("Could not sync channel update to server:", err);
    }

    const localUpdated = channels.map((c) => (c.handle === clean ? { ...c, ...patch } : c));
    setChannels(localUpdated);
    localStorage.setItem("dp_studio_channels", JSON.stringify(localUpdated));
    const target = localUpdated.find((c) => c.handle === clean) || activeChannel;
    if (activeChannel.handle === clean) {
      setActiveChannel(target);
    }
    return target;
  };

  return (
    <ChannelContext.Provider
      value={{
        channels,
        activeChannel,
        setActiveChannel,
        switchChannelByHandle,
        createNewChannel,
        updateChannel,
        isLoading,
        isManagerModalOpen,
        setIsManagerModalOpen,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannels() {
  const ctx = useContext(ChannelContext);
  if (!ctx) {
    throw new Error("useChannels must be used within a ChannelProvider");
  }
  return ctx;
}
