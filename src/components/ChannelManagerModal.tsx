import React, { useState } from "react";
import { X, Plus, Check, Globe, Palette } from "lucide-react";
import { useChannels, CreatorAccentColor } from "../context/ChannelContext";

const ACCENT_COLORS: { id: CreatorAccentColor; name: string; hex: string }[] = [
  { id: "sky", name: "Sky Blue", hex: "#0284c7" },
  { id: "blue", name: "Deep Royal", hex: "#2563eb" },
  { id: "pink", name: "Neon Rose", hex: "#e11d48" },
  { id: "amber", name: "Warm Amber", hex: "#d97706" },
  { id: "emerald", name: "Emerald", hex: "#059669" },
  { id: "purple", name: "Electric Violet", hex: "#7c3aed" },
];

export default function ChannelManagerModal() {
  const { isManagerModalOpen, setIsManagerModalOpen, channels, activeChannel, setActiveChannel, createNewChannel, isLoading } = useChannels();
  const [isCreating, setIsCreating] = useState(false);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("Shoppable Creator");
  const [accentColor, setAccentColor] = useState<CreatorAccentColor>("sky");
  const [bio, setBio] = useState("");

  if (!isManagerModalOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanHandle) return;

    await createNewChannel({
      handle: cleanHandle,
      displayName: displayName || cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
      category,
      accentColor,
      bio,
    });

    setIsCreating(false);
    setHandle("");
    setDisplayName("");
    setBio("");
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsManagerModalOpen(false)}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", width: "100%", background: "#0b1329", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px" }}
      >
        <div className="modal-header" style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Globe size={20} color="#38bdf8" />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Manage Brand Channels
            </h3>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={() => setIsManagerModalOpen(false)}
            style={{ padding: "4px", color: "#94a3b8" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: "22px" }}>
          {!isCreating ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Select or switch active brand channel for this Studio session:
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "#0284c7",
                    border: "none",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={13} />
                  <span>New Channel</span>
                </button>
              </div>

              {/* Channels List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {channels.map((chan) => {
                  const isActive = chan.handle === activeChannel.handle;
                  return (
                    <div
                      key={chan.handle}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: isActive ? "rgba(2, 132, 199, 0.12)" : "rgba(255, 255, 255, 0.03)",
                        border: isActive ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={chan.avatarUrl}
                          alt={chan.handle}
                          style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                        />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                            {chan.displayName}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                            @{chan.handle} • <span style={{ color: "#64748b" }}>{chan.category}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isActive ? (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Check size={14} /> Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChannel(chan);
                              setIsManagerModalOpen(false);
                            }}
                            style={{
                              padding: "5px 12px",
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              borderRadius: "6px",
                              color: "#f8fafc",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Switch to this Channel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handleCreate}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Create New Brand Channel
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>

              {/* Accent Color */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                  Brand Accent Color
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAccentColor(c.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: accentColor === c.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                        border: accentColor === c.id ? "2px solid " + c.hex : "1px solid rgba(255,255,255,0.08)",
                        color: accentColor === c.id ? "#ffffff" : "#94a3b8",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Handle & Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                    Handle (@)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. foodtech"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", background: "#020617", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FoodTech Studio"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", background: "#020617", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: "12px" }}
                  />
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                  Category Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smart Kitchen & Modern Cooking"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", background: "#020617", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: "12px" }}
                />
              </div>

              {/* Bio */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                  Bio Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe your channel focus..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", background: "#020617", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: "12px" }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#0284c7",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isLoading ? "Provisioning..." : "Create & Launch Channel"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
