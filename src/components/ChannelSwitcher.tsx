import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Settings, Globe } from "lucide-react";
import { useChannels, BrandChannel } from "../context/ChannelContext";

const COLOR_MAP: Record<string, string> = {
  sky: "#38bdf8",
  blue: "#3b82f6",
  pink: "#f43f5e",
  amber: "#f59e0b",
  emerald: "#10b981",
  purple: "#8b5cf6",
};

export default function ChannelSwitcher() {
  const { channels, activeChannel, setActiveChannel, setIsManagerModalOpen } = useChannels();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const accentHex = COLOR_MAP[activeChannel.accentColor || "sky"] || "#38bdf8";

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "5px 12px",
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid " + (isOpen ? accentHex : "rgba(255, 255, 255, 0.12)"),
          borderRadius: "8px",
          cursor: "pointer",
          color: "#f8fafc",
          fontSize: "12px",
          fontWeight: 600,
          transition: "all 0.15s ease",
        }}
        title="Switch Active Brand Channel"
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: accentHex,
            boxShadow: "0 0 8px " + accentHex,
          }}
        />
        <img
          src={activeChannel.avatarUrl}
          alt={activeChannel.handle}
          style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }}
        />
        <span style={{ color: "#f8fafc" }}>@{activeChannel.handle}</span>
        <ChevronDown size={13} color="#94a3b8" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "280px",
            background: "#0f172a",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              My Brand Channels ({channels.length})
            </span>
          </div>

          <div style={{ maxHeight: "240px", overflowY: "auto", padding: "4px" }}>
            {channels.map((chan) => {
              const isActive = chan.handle === activeChannel.handle;
              const chanHex = COLOR_MAP[chan.accentColor || "sky"] || "#38bdf8";

              return (
                <button
                  key={chan.id || chan.handle}
                  type="button"
                  onClick={() => {
                    setActiveChannel(chan);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "8px 10px",
                    background: isActive ? "rgba(255, 255, 255, 0.06)" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={chan.avatarUrl}
                        alt={chan.handle}
                        style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-1px",
                          right: "-1px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: chanHex,
                          border: "2px solid #0f172a",
                        }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {chan.displayName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        @{chan.handle}
                      </div>
                    </div>
                  </div>

                  {isActive && <Check size={14} color={accentHex} style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", padding: "4px" }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsManagerModalOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                borderRadius: "8px",
                color: "#38bdf8",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56, 189, 248, 0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Plus size={14} />
              <span>+ Add Brand Channel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
