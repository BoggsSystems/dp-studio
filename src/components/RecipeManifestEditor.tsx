import React, { useState } from "react";
import { Plus, Trash2, ShoppingCart, ExternalLink, Copy, Check, Sparkles, ChefHat, Clock, Users } from "lucide-react";
import { RecipeManifest, RecipeIngredient } from "../types";

export function generateInstacartRecipeUrl(manifest: RecipeManifest, partnerId?: string): string {
  const ingredientLines = manifest.ingredients.map((ing) => {
    const parts = [];
    if (ing.amount) parts.push(ing.amount);
    if (ing.unit) parts.push(ing.unit);
    parts.push(ing.name);
    return parts.join(" ").trim();
  }).filter(Boolean);

  const params = new URLSearchParams();
  params.set("title", manifest.title || "Shoppable Recipe");
  params.set("ingredients", ingredientLines.join("\n"));
  if (manifest.servings) params.set("servings", String(manifest.servings));
  if (partnerId) params.set("partner_id", partnerId);

  return "https://www.instacart.com/store/recipes/new?" + params.toString();
}

interface RecipeManifestEditorProps {
  initialManifest?: RecipeManifest;
  recipeTitleDefault?: string;
  onSave: (manifest: RecipeManifest) => void;
}

export default function RecipeManifestEditor({
  initialManifest,
  recipeTitleDefault = "Pan-Seared Duck Breast with Cherry Port Reduction",
  onSave,
}: RecipeManifestEditorProps) {
  const [title, setTitle] = useState(initialManifest?.title || recipeTitleDefault);
  const [servings, setServings] = useState(initialManifest?.servings || 2);
  const [prepTime, setPrepTime] = useState(initialManifest?.prepTimeMinutes || 15);
  const [cookTime, setCookTime] = useState(initialManifest?.cookTimeMinutes || 25);
  const [difficulty, setDifficulty] = useState<"Easy" | "Intermediate" | "Michelin / Advanced">(
    initialManifest?.difficulty || "Michelin / Advanced"
  );
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initialManifest?.ingredients || [
      { id: "ing-1", amount: "2", unit: "", name: "Muscovy or Pekin duck breasts" },
      { id: "ing-2", amount: "2", unit: "", name: "Shallots, finely minced" },
      { id: "ing-3", amount: "1", unit: "bunch", name: "Fresh French thyme" },
      { id: "ing-4", amount: "1/2", unit: "cup", name: "Ruby port wine" },
      { id: "ing-5", amount: "1/2", unit: "cup", name: "Fresh or frozen pitted sweet cherries" },
      { id: "ing-6", amount: "3", unit: "tbsp", name: "Cold unsalted European butter, cubed" },
    ]
  );

  const [rawPasteText, setRawPasteText] = useState("");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentManifest: RecipeManifest = {
    title,
    servings,
    prepTimeMinutes: prepTime,
    cookTimeMinutes: cookTime,
    difficulty,
    ingredients,
    instacartUrl: generateInstacartRecipeUrl({ title, servings, ingredients }),
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: "ing-" + Date.now(), amount: "1", unit: "", name: "" },
    ]);
  };

  const handleUpdateIngredient = (id: string, field: keyof RecipeIngredient, value: string) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const handleParsePaste = () => {
    if (!rawPasteText.trim()) return;
    const lines = rawPasteText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: RecipeIngredient[] = lines.map((line, idx) => {
      // Basic regex to strip leading dash/bullet
      const cleanLine = line.replace(/^[\-\•\*\d+\.\)]+\s*/, "");
      // Match leading quantity + unit (e.g. "2 cups flour" or "1/2 tbsp salt")
      const match = cleanLine.match(/^([\d\/\.]+\s*(?:tbsp|tsp|cups?|oz|lbs?|g|kg|cloves?|bunch|pinches?)?)\s+(.*)$/i);
      if (match) {
        return {
          id: "ing-paste-" + idx + "-" + Date.now(),
          amount: match[1].trim(),
          unit: "",
          name: match[2].trim(),
        };
      }
      return {
        id: "ing-paste-" + idx + "-" + Date.now(),
        amount: "",
        unit: "",
        name: cleanLine,
      };
    });

    setIngredients([...ingredients, ...parsed]);
    setRawPasteText("");
    setShowPasteModal(false);
  };

  const handleSave = () => {
    onSave(currentManifest);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const instacartUrl = generateInstacartRecipeUrl(currentManifest);

  return (
    <div style={{ background: "#0b1329", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
            <ChefHat size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Instacart Recipe & Ingredient Manifest
            </h3>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0 0" }}>
              Enables 1-click local same-day grocery delivery for your viewers.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Sparkles size={13} />
            <span>Quick-Paste Text</span>
          </button>
        </div>
      </div>

      {/* Recipe Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
            Recipe Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
            Servings
          </label>
          <input
            type="number"
            min={1}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
            Prep Time (Min)
          </label>
          <input
            type="number"
            min={0}
            value={prepTime}
            onChange={(e) => setPrepTime(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px" }}
          >
            <option value="Easy">Easy</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Michelin / Advanced">Michelin / Advanced</option>
          </select>
        </div>
      </div>

      {/* Ingredients List */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
            Ingredients ({ingredients.length} items)
          </span>
          <button
            type="button"
            onClick={handleAddIngredient}
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#38bdf8", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={12} /> Add Item
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
          {ingredients.map((ing) => (
            <div key={ing.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                placeholder="Qty (2)"
                value={ing.amount || ""}
                onChange={(e) => handleUpdateIngredient(ing.id, "amount", e.target.value)}
                style={{ width: "70px", padding: "6px 8px", borderRadius: "6px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px" }}
              />
              <input
                type="text"
                placeholder="Unit (cups, tbsp)"
                value={ing.unit || ""}
                onChange={(e) => handleUpdateIngredient(ing.id, "unit", e.target.value)}
                style={{ width: "90px", padding: "6px 8px", borderRadius: "6px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px" }}
              />
              <input
                type="text"
                placeholder="Ingredient Name (e.g. French Shallots)"
                value={ing.name}
                onChange={(e) => handleUpdateIngredient(ing.id, "name", e.target.value)}
                style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px" }}
              />
              <button
                type="button"
                onClick={() => handleRemoveIngredient(ing.id)}
                style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "4px" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Instacart Link & Save */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "10px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShoppingCart size={18} color="#10b981" />
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
              Live Instacart Shoppable Recipe Link Ready
            </span>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Auto-matches Whole Foods, Wegmans, Kroger, and regional grocers.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a
            href={instacartUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              background: "#10b981",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <span>Test Cart in Instacart</span>
            <ExternalLink size={12} />
          </a>

          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "7px 16px",
              background: "#0284c7",
              border: "none",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {savedSuccess ? "Saved to Reel!" : "Save Recipe Manifest"}
          </button>
        </div>
      </div>

      {/* Quick Paste Modal */}
      {showPasteModal && (
        <div className="modal-backdrop" onClick={() => setShowPasteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px", background: "#0f172a", borderRadius: "12px", padding: "18px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", margin: "0 0 8px 0" }}>
              Quick-Paste Recipe Ingredients
            </h4>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 12px 0" }}>
              Paste one ingredient per line. Numbers and quantities will be automatically parsed.
            </p>
            <textarea
              rows={6}
              value={rawPasteText}
              onChange={(e) => setRawPasteText(e.target.value)}
              placeholder={"2 duck breasts\n2 shallots\n1 bunch thyme\n1/2 cup port wine"}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "12px", marginBottom: "12px" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                style={{ padding: "6px 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#94a3b8", fontSize: "12px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParsePaste}
                style={{ padding: "6px 14px", background: "#0284c7", border: "none", borderRadius: "6px", color: "#ffffff", fontSize: "12px", fontWeight: 700 }}
              >
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
