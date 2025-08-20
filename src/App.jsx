import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Pixel Art Studio – single-file React component
 * ------------------------------------------------
 * Features
 * - Adjustable square grid (up to 128x128 by default)
 * - Click & drag painting, eraser, eyedropper
 * - Color picker + custom palette (add/remove)
 * - Zoom (pixel size), gridlines toggle
 * - Undo/Redo, Clear, Fill background
 * - Export PNG (with/without grid), Export/Import JSON
 * - Autosave to localStorage
 *
 * Usage
 * - Drop into any React app (Vite/CRA/Next). TailwindCSS required.
 * - Default export is <PixelArtStudio />
 */

// ---------- Utility helpers ----------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const download = (filename, url) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

const useLocalStorage = (key, initial) => {
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
};

// ---------- Main Component ----------
export default function PixelArtStudio() {
  // Canvas/grid settings
  const [size, setSize] = useLocalStorage("pas:size", 32); // square grid N x N
  const [pixelSize, setPixelSize] = useLocalStorage("pas:pixelSize", 16); // zoom
  const [showGrid, setShowGrid] = useLocalStorage("pas:showGrid", true);

  // Colors & tools
  const [currentColor, setCurrentColor] = useLocalStorage("pas:currentColor", "#1f2937");
  const [palette, setPalette] = useLocalStorage("pas:palette", [
    "#000000", "#ffffff", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
  ]);
  const [tool, setTool] = useLocalStorage("pas:tool", "pen"); // 'pen' | 'eraser' | 'eyedropper'

  // Pixel data (flat array length size*size)
  const blank = useMemo(() => Array(size * size).fill(null), [size]);
  const [pixels, setPixels] = useLocalStorage("pas:pixels", blank);

  // History for undo/redo
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Drag painting
  const drawingRef = useRef(false);

  // Ensure pixels resets when size changes
  useEffect(() => {
    setPixels((prev) => {
      if (!Array.isArray(prev) || prev.length !== size * size) return Array(size * size).fill(null);
      return prev;
    });
  }, [size, setPixels]);

  // Helper to index (x,y)
  const idx = (x, y) => y * size + x;

  const pushHistory = (prev) => {
    setUndoStack((s) => [...s, prev]);
    setRedoStack([]);
  };

  const handlePaint = (x, y, color) => {
    setPixels((prev) => {
      const i = idx(x, y);
      if (prev[i] === color) return prev; // no-op
      const next = prev.slice();
      next[i] = color;
      return next;
    });
  };

  const onPointerDown = (e, x, y) => {
    e.preventDefault();
    drawingRef.current = true;
    pushHistory(pixels);

    if (tool === "pen") handlePaint(x, y, currentColor);
    else if (tool === "eraser") handlePaint(x, y, null);
    else if (tool === "eyedropper") {
      const c = pixels[idx(x, y)] ?? "#ffffff";
      setCurrentColor(c);
      setTool("pen");
    }
  };

  const onPointerEnter = (e, x, y) => {
    if (!drawingRef.current) return;
    if (tool === "pen") handlePaint(x, y, currentColor);
    else if (tool === "eraser") handlePaint(x, y, null);
  };

  const onPointerUp = () => {
    drawingRef.current = false;
  };

  useEffect(() => {
    const up = () => (drawingRef.current = false);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const clearAll = () => {
    pushHistory(pixels);
    setPixels(Array(size * size).fill(null));
  };

  const fillBackground = () => {
    pushHistory(pixels);
    setPixels(Array(size * size).fill(currentColor));
  };

  const undo = () => {
    setUndoStack((u) => {
      if (u.length === 0) return u;
      const prev = u[u.length - 1];
      setRedoStack((r) => [...r, pixels]);
      setPixels(prev);
      return u.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      setUndoStack((u) => [...u, pixels]);
      setPixels(next);
      return r.slice(0, -1);
    });
  };

  // Export to PNG (rendered from offscreen canvas)
  const exportPNG = (withGrid = false) => {
    const canvas = document.createElement("canvas");
    const scale = 1; // 1 pixel per cell, we'll upscale via image smoothing off
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // Fill transparent background as white for visibility
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Paint pixels
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = pixels[idx(x, y)];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Optional grid overlay
    if (withGrid) {
      ctx.strokeStyle = "#e5e7eb"; // gray-200
      ctx.lineWidth = 0.02;
      for (let i = 0; i <= size; i++) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
    }

    // Upscale to nicer PNG (nearest-neighbor)
    const upscale = Math.max(1, Math.floor(512 / size));
    const out = document.createElement("canvas");
    out.width = size * upscale;
    out.height = size * upscale;
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = false;
    octx.drawImage(canvas, 0, 0, out.width, out.height);
    download(`pixel-art-${size}x${size}.png`, out.toDataURL("image/png"));
  };

  // Export/Import JSON
  const exportJSON = () => {
    const payload = {
      version: 1,
      size,
      pixels,
      palette,
      meta: { createdAt: Date.now() },
    };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    download(`pixel-art-${size}.json`, url);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data.size !== "number" || !Array.isArray(data.pixels)) throw new Error();
        setSize(clamp(data.size, 2, 256));
        setPixels(data.pixels);
        if (Array.isArray(data.palette)) setPalette(data.palette);
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // Derived styles
  const gridStyle = {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-800">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-3 px-5">
          <h1 className="text-xl font-semibold tracking-tight">Pixel Art Studio</h1>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="hidden sm:inline">React + Tailwind</span>
            <span>•</span>
            <a className="underline decoration-dotted" href="https://github.com/siddhi-tntra/virtual_assistant_poc/" target="_blank">Github</a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 lg:grid-cols-[280px,1fr]">
        {/* Sidebar Controls */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-zinc-600">Canvas</h2>
            <div className="grid grid-cols-2 items-center gap-2">
              <label className="text-xs text-zinc-500">Grid size</label>
              <input
                type="number"
                min={2}
                max={256}
                value={size}
                onChange={(e) => setSize(clamp(parseInt(e.target.value || "0"), 2, 256))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <label className="text-xs text-zinc-500">Pixel size</label>
              <input
                type="range"
                min={6}
                max={32}
                value={pixelSize}
                onChange={(e) => setPixelSize(parseInt(e.target.value))}
                className="col-span-1 w-full"
              />
              <div className="col-span-2 flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                  <input type="checkbox" className="rounded" checked={showGrid} onChange={(e)=> setShowGrid(e.target.checked)} />
                  Show gridlines
                </label>
                <button onClick={clearAll} className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50">Clear</button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-zinc-600">Tools</h2>
            <div className="grid grid-cols-3 gap-2">
              <ToolButton active={tool === "pen"} onClick={() => setTool("pen")} label="Pen"/>
              <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} label="Eraser"/>
              <ToolButton active={tool === "eyedropper"} onClick={() => setTool("eyedropper")} label="Eyedrop"/>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={undo} className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50" disabled={!undoStack.length}>Undo</button>
              <button onClick={redo} className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50" disabled={!redoStack.length}>Redo</button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-zinc-600">Colors</h2>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-xl border border-zinc-300"
                title="Pick color"
              />
              <button
                onClick={() => setPalette((p) => Array.from(new Set([currentColor, ...p])).slice(0, 24))}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              >Add to palette</button>
              <button
                onClick={() => setPalette((p) => p.filter((c) => c !== currentColor))}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              >Remove</button>
            </div>
            <div className="mt-3 grid grid-cols-8 gap-2">
              {palette.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setCurrentColor(c)}
                  className={`aspect-square w-full rounded-xl border ${currentColor===c ? "ring-2 ring-zinc-400" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={fillBackground} className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Fill canvas</button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-zinc-600">Import / Export</h2>
            <div className="flex flex-col gap-2">
              <button onClick={() => exportPNG(false)} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Export PNG</button>
              <button onClick={() => exportPNG(true)} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Export PNG + grid</button>
              <button onClick={exportJSON} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Export JSON</button>
              <label className="mt-1 block cursor-pointer text-sm">
                <span className="mb-1 inline-block rounded-xl border border-zinc-300 px-3 py-2 hover:bg-zinc-50">Import JSON</span>
                <input type="file" accept="application/json" className="hidden" onChange={(e)=> importJSON(e.target.files?.[0])} />
              </label>
            </div>
          </section>
        </aside>

        {/* Drawing board */}
        <section 
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm overflow-auto"
            style={{ width: `calc(100vh - 130px)` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-zinc-500">{size}×{size} • {Math.round((size*size)/100)/10}k pixels</div>
            <Legend tool={tool} color={currentColor} />
          </div>
          <div
            className="relative overflow-auto rounded-2xl border border-zinc-200 bg-zinc-100 p-3"
            style={{ height: `calc(100vh - 220px)` }}
            onMouseLeave={onPointerUp}
          >
            <div
              className="mx-auto w-max rounded-xl bg-white p-4 shadow-inner"
              onMouseUp={onPointerUp}
              onTouchEnd={onPointerUp}
            >
              <div
                className="grid select-none"
                style={{ ...gridStyle, gap: showGrid ? 1 : 0 }}
              >
                {Array.from({ length: size }).map((_, y) => (
                  <React.Fragment key={y}>
                    {Array.from({ length: size }).map((__, x) => {
                      const color = pixels[idx(x, y)];
                      return (
                        <div
                          key={`${x}-${y}`}
                          onMouseDown={(e) => onPointerDown(e, x, y)}
                          onMouseEnter={(e) => onPointerEnter(e, x, y)}
                          onTouchStart={(e) => onPointerDown(e, x, y)}
                          style={{ width: pixelSize, height: pixelSize, background: color ?? "#ffffff" }}
                          className={`aspect-square ${showGrid ? "outline outline-1 -outline-offset-1 outline-zinc-200" : ""} rounded-[2px]`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl py-2 px-4 text-center text-xs text-zinc-500">
        Pro tip: Hold and drag to paint. Use Eyedrop to pick a color from the canvas.
      </footer>
    </div>
  );
}

function ToolButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm shadow-sm border ${
        active ? "border-zinc-800 bg-zinc-900 text-white" : "border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

function Legend({ tool, color }) {
  const text = tool === "pen" ? "Painting" : tool === "eraser" ? "Erasing" : "Eyedropper";
  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600">
      <div className="h-3 w-3 rounded" style={{ background: color }} />
      <span>{text}</span>
    </div>
  );
}
