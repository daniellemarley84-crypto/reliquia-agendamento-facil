import { useState, useRef, useEffect, useCallback } from "react";

const FONT = "'DM Sans', sans-serif";
const RED = "#e63946";

// ════════════════════════════════════════════════════════════════════════════
//  1. CropModal
// ════════════════════════════════════════════════════════════════════════════
const AR: Record<string, number | null> = { "free": null, "16:9": 16/9, "4:3": 4/3, "1:1": 1, "3:1": 3, "2.4:1": 2.4 };

export function CropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (url: string) => void; onCancel: () => void }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dragRef = useRef<any>(null);
  const aspectRef = useRef("free");
  const [crop, setCropState] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [aspect, setAspect] = useState("free");

  const setCrop = (c: any) => { cropRef.current = c; setCropState(c); };
  const changeAspect = (k: string) => { aspectRef.current = k; setAspect(k); };

  const constrain = useCallback((c: any) => {
    const ar = AR[aspectRef.current];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return c;
    const cw = rect.width, ch = rect.height;
    let { x, y, w, h } = c;
    if (ar) { h = w / ar; if (h > ch) { h = ch; w = h * ar; } }
    w = Math.max(20, Math.min(w, cw));
    h = Math.max(20, Math.min(h, ch));
    x = Math.max(0, Math.min(x, cw - w));
    y = Math.max(0, Math.min(y, ch - h));
    return { x, y, w, h };
  }, []);

  useEffect(() => {
    if (!imgLoaded || !containerRef.current) return;
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    const ar = AR[aspect];
    let w = cw * 0.8, h = ar ? w / ar : ch * 0.8;
    if (ar && h > ch * 0.9) { h = ch * 0.9; w = h * ar; }
    setCrop(constrain({ x: (cw - w) / 2, y: (ch - h) / 2, w, h }));
  }, [imgLoaded, aspect, constrain]);

  const relPos = (e: any) => {
    const r = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const HANDLE_HIT = 14;
  const getHandle = (px: number, py: number) => {
    const c = cropRef.current;
    const pts: Record<string, [number, number]> = {
      nw:[c.x,c.y], n:[c.x+c.w/2,c.y], ne:[c.x+c.w,c.y],
      w:[c.x,c.y+c.h/2], e:[c.x+c.w,c.y+c.h/2],
      sw:[c.x,c.y+c.h], s:[c.x+c.w/2,c.y+c.h], se:[c.x+c.w,c.y+c.h],
    };
    for (const [k,[hx,hy]] of Object.entries(pts)) {
      if (Math.abs(px-hx) <= HANDLE_HIT && Math.abs(py-hy) <= HANDLE_HIT) return k;
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const { x: px, y: py } = relPos(e);
    const handle = getHandle(px, py);
    const sc = { ...cropRef.current };
    if (handle) {
      dragRef.current = { type: "resize", handle, startX: px, startY: py, startCrop: sc };
    } else if (px>=sc.x && px<=sc.x+sc.w && py>=sc.y && py<=sc.y+sc.h) {
      dragRef.current = { type: "move", startX: px, startY: py, startCrop: sc };
    } else {
      dragRef.current = { type: "create", startX: px, startY: py, startCrop: sc };
    }
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const { x: px, y: py } = relPos(e);
    const dx = px - d.startX, dy = py - d.startY;
    const sc = d.startCrop;
    if (d.type === "move") {
      setCrop(constrain({ ...sc, x: sc.x+dx, y: sc.y+dy }));
    } else if (d.type === "create") {
      let x=d.startX, y=d.startY, w=dx, h=dy;
      if (w<0){x=px;w=-w;} if(h<0){y=py;h=-h;}
      const ar = AR[aspectRef.current];
      if (ar) h = w/ar;
      setCrop(constrain({ x, y, w: Math.max(4,w), h: Math.max(4,h) }));
    } else if (d.type === "resize") {
      let { x, y, w, h } = { ...sc };
      if (d.handle.includes("e")) w = Math.max(20, sc.w+dx);
      if (d.handle.includes("s")) h = Math.max(20, sc.h+dy);
      if (d.handle.includes("w")) { const nw=Math.max(20,sc.w-dx); x=sc.x+sc.w-nw; w=nw; }
      if (d.handle.includes("n")) { const nh=Math.max(20,sc.h-dy); y=sc.y+sc.h-nh; h=nh; }
      setCrop(constrain({ x, y, w, h }));
    }
  }, [constrain]);

  const onMouseUp = () => { dragRef.current = null; };

  const applyCrop = () => {
    const img = imgRef.current;
    const cr = containerRef.current?.getBoundingClientRect();
    if (!img || !cr) return;
    const c = cropRef.current;
    const scale = Math.min(cr.width/img.naturalWidth, cr.height/img.naturalHeight);
    const offX = (cr.width  - img.naturalWidth  * scale) / 2;
    const offY = (cr.height - img.naturalHeight * scale) / 2;
    const sx=(c.x-offX)/scale, sy=(c.y-offY)/scale;
    const sw=c.w/scale, sh=c.h/scale;
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(sw));
    canvas.height=Math.max(1,Math.round(sh));
    canvas.getContext("2d")!.drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    onConfirm(canvas.toDataURL("image/jpeg",0.95));
  };

  const handlePositions: Record<string, any> = {
    nw: { left: -7, top: -7 }, n: { left: "50%", top: -7, transform: "translateX(-50%)" },
    ne: { right: -7, top: -7 }, w: { left: -7, top: "50%", transform: "translateY(-50%)" },
    e: { right: -7, top: "50%", transform: "translateY(-50%)" },
    sw: { left: -7, bottom: -7 }, s: { left: "50%", bottom: -7, transform: "translateX(-50%)" },
    se: { right: -7, bottom: -7 },
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.93)", fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      {/* Aspect buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "14px 0" }}>
        {Object.keys(AR).map(k => (
          <button key={k} onClick={() => changeAspect(k)} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
            border: `1px solid ${aspect === k ? RED : "#555"}`, background: "transparent", color: aspect === k ? RED : "#aaa",
          }}>{k}</button>
        ))}
      </div>

      {/* Image container */}
      <div ref={containerRef} style={{ flex: 1, height: "60vh", position: "relative", cursor: "crosshair", userSelect: "none", overflow: "hidden", margin: "0 20px" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <img ref={imgRef} src={src} crossOrigin="anonymous" onLoad={() => setImgLoaded(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
        {crop.w > 4 && crop.h > 4 && (
          <>
            {/* Overlays */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: crop.y, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", top: crop.y + crop.h, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", top: crop.y, left: 0, width: crop.x, height: crop.h, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h, background: "rgba(0,0,0,0.6)" }} />
            {/* Crop area */}
            <div style={{ position: "absolute", left: crop.x, top: crop.y, width: crop.w, height: crop.h, border: `2px solid ${RED}` }}>
              {/* Thirds grid */}
              {[1,2].map(i => <div key={`v${i}`} style={{ position: "absolute", left: `${i*33.33}%`, top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.2)" }} />)}
              {[1,2].map(i => <div key={`h${i}`} style={{ position: "absolute", top: `${i*33.33}%`, left: 0, height: 1, width: "100%", background: "rgba(255,255,255,0.2)" }} />)}
              {/* Handles */}
              {Object.entries(handlePositions).map(([k, pos]) => (
                <div key={k} style={{ position: "absolute", width: 14, height: 14, background: RED, border: "2px solid #fff", borderRadius: 3, ...pos }} />
              ))}
            </div>
            {/* Size badge */}
            <div style={{ position: "absolute", left: crop.x, top: crop.y - 22, fontSize: 10, color: RED, fontFamily: FONT, fontWeight: 600 }}>
              {Math.round(crop.w)} × {Math.round(crop.h)} px
            </div>
          </>
        )}
        {(!crop.w || crop.w <= 4) && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 13, fontFamily: FONT, pointerEvents: "none" }}>
            Arraste na imagem para selecionar a área de corte
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "14px 0" }}>
        <button onClick={onCancel} style={{ padding: "8px 20px", borderRadius: 6, border: "1px solid #555", background: "transparent", color: "#aaa", fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>Cancelar</button>
        <button onClick={applyCrop} disabled={crop.w <= 4} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: RED, color: "#fff", fontSize: 12, fontFamily: FONT, cursor: crop.w > 4 ? "pointer" : "not-allowed", opacity: crop.w > 4 ? 1 : 0.4, fontWeight: 600 }}>✅ Aplicar Recorte</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  2. PhotoLibraryModal
// ════════════════════════════════════════════════════════════════════════════
interface LibPhoto { id: number; name: string; url: string; date: string; }

export function PhotoLibraryModal({ library, onSelect, onCropAndApply, onClose, onDelete, onUploadMore }: {
  library: LibPhoto[]; onSelect: (p: LibPhoto) => void; onCropAndApply: (p: LibPhoto) => void;
  onClose: () => void; onDelete: (id: number) => void; onUploadMore: (files: FileList) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = library.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}
      onClick={onClose}>
      <div style={{ background: "#141414", border: "1px solid #333", borderRadius: 14, maxWidth: 760, width: "95%", maxHeight: "82vh", overflow: "auto", padding: "20px" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20 }}>🗂️</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#eee", flex: 1 }}>Fototeca <span style={{ fontSize: 12, color: "#666" }}>({library.length})</span></span>
          <input style={{ background: "#222", border: "1px solid #333", borderRadius: 6, padding: "5px 10px", color: "#ccc", fontSize: 12, fontFamily: FONT, outline: "none", width: 140 }}
            placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          <label style={{ fontSize: 12, color: RED, cursor: "pointer", fontWeight: 600 }}>
            ➕ Adicionar
            <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={e => e.target.files && onUploadMore(e.target.files)} />
          </label>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 14 }}>✅ Usar aplica direto · ✂️ recorta antes</div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#555" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 12 }}>Nenhuma foto na fototeca. Faça upload para começar.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
            {filtered.map(p => (
              <div key={p.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
                <img src={p.url} style={{ width: "100%", height: 95, objectFit: "cover" }} alt={p.name} />
                <div style={{ padding: "6px 8px" }}>
                  <div style={{ fontSize: 11, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: "#555", marginBottom: 6 }}>{p.date}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => onSelect(p)} style={{ flex: 1, fontSize: 10, padding: "4px 0", borderRadius: 4, border: "none", background: `linear-gradient(135deg, ${RED}, #c1121f)`, color: "#fff", cursor: "pointer", fontFamily: FONT }}>✅ Usar</button>
                    <button onClick={() => onCropAndApply(p)} style={{ fontSize: 10, padding: "4px 6px", borderRadius: 4, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer", fontFamily: FONT }}>✂️</button>
                    <button onClick={() => onDelete(p.id)} style={{ fontSize: 10, padding: "4px 6px", borderRadius: 4, border: "1px solid #2a2a2a", background: "transparent", color: "#666", cursor: "pointer", fontFamily: FONT }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  3. DragDropZone
// ════════════════════════════════════════════════════════════════════════════
function DragDropZone({ onFile, currentImage }: { onFile: (f: File) => void; currentImage: string | null }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragging ? RED : "#222"}`, borderRadius: 10, padding: 14,
        cursor: "pointer", textAlign: "center", transition: "border-color 0.2s", minHeight: 80,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      {currentImage ? (
        <div style={{ position: "relative" }}>
          <img src={currentImage} style={{ width: 90, height: 60, objectFit: "cover", borderRadius: 6 }} alt="" />
          <span style={{ position: "absolute", bottom: 2, right: 2, fontSize: 8, background: "rgba(0,0,0,0.7)", color: "#ccc", padding: "1px 4px", borderRadius: 3 }}>Trocar</span>
        </div>
      ) : (
        <div style={{ color: "#555", fontSize: 12, fontFamily: FONT }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
          Arraste ou clique para selecionar
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  4. CarouselPanel
// ════════════════════════════════════════════════════════════════════════════
export function CarouselPanel() {
  const [slides, setSlides] = useState([
    { id: 1, title: "Slide 1", subtitle: "Subtítulo", image: null as string | null, imageUrl: "https://placehold.co/1200x500/1a1a2e/ffffff?text=Slide+1" },
    { id: 2, title: "Slide 2", subtitle: "Subtítulo", image: null as string | null, imageUrl: "https://placehold.co/1200x500/16213e/ffffff?text=Slide+2" },
    { id: 3, title: "Slide 3", subtitle: "Subtítulo", image: null as string | null, imageUrl: "https://placehold.co/1200x500/0f3460/ffffff?text=Slide+3" },
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [draggingSlide, setDraggingSlide] = useState<number | null>(null);
  const [dragOverSlide, setDragOverSlide] = useState<number | null>(null);
  const [library, setLibrary] = useState<LibPhoto[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ index: number; name: string } | null>(null);
  const [exported, setExported] = useState(false);

  const updateSlide = (idx: number, field: string, val: any) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
    setSaved(false);
  };

  const handleFileForCrop = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (!library.find(l => l.name === file.name)) {
        setLibrary(prev => [...prev, { id: Date.now(), name: file.name, url, date: new Date().toLocaleDateString("pt-BR") }]);
      }
      setCropSrc(url);
      setCropTarget({ index: idx, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedUrl: string) => {
    if (cropTarget) {
      updateSlide(cropTarget.index, "imageUrl", croppedUrl);
      updateSlide(cropTarget.index, "image", cropTarget.name);
      setLibrary(prev => [...prev, { id: Date.now() + 1, name: cropTarget.name.replace(/\.\w+$/, "_recortada.jpg"), url: croppedUrl, date: new Date().toLocaleDateString("pt-BR") }]);
    }
    setCropSrc(null);
    setCropTarget(null);
  };

  const handleLibrarySelect = (photo: LibPhoto) => {
    updateSlide(activeSlide, "imageUrl", photo.url);
    updateSlide(activeSlide, "image", photo.name);
    setShowLibrary(false);
  };

  const handleLibraryCropAndApply = (photo: LibPhoto) => {
    setShowLibrary(false);
    setCropSrc(photo.url);
    setCropTarget({ index: activeSlide, name: photo.name });
  };

  const addSlide = () => {
    const id = Date.now();
    setSlides(prev => [...prev, { id, title: `Slide ${prev.length + 1}`, subtitle: "Subtítulo", image: null, imageUrl: `https://placehold.co/1200x500/1a1a2e/ffffff?text=Slide+${prev.length + 1}` }]);
    setSaved(false);
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== idx));
    if (activeSlide >= slides.length - 1) setActiveSlide(Math.max(0, slides.length - 2));
    setSaved(false);
  };

  const exportConfig = () => {
    const config = {
      version: "1.1",
      exportedAt: new Date().toISOString(),
      carousel: slides.map(({ id, title, subtitle, imageUrl, image }) => ({ id, title, subtitle, imageFile: image || null, imageUrl })),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "carousel-config.json";
    a.click();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.carousel) setSlides(data.carousel.map((s: any) => ({ ...s, image: s.imageFile })));
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  };

  const handleDrop = (idx: number) => {
    if (draggingSlide === null || draggingSlide === idx) return;
    const arr = [...slides];
    const [moved] = arr.splice(draggingSlide, 1);
    arr.splice(idx, 0, moved);
    setSlides(arr);
    setActiveSlide(idx);
    setDraggingSlide(null);
    setDragOverSlide(null);
  };

  const s = slides[activeSlide] || slides[0];
  const pSlide = slides[previewIndex] || slides[0];

  return (
    <div style={{ fontFamily: FONT, color: "#ccc", fontSize: 12 }}>
      {/* Modals */}
      {cropSrc && <CropModal src={cropSrc} onConfirm={handleCropConfirm} onCancel={() => { setCropSrc(null); setCropTarget(null); }} />}
      {showLibrary && (
        <PhotoLibraryModal
          library={library}
          onSelect={handleLibrarySelect}
          onCropAndApply={handleLibraryCropAndApply}
          onClose={() => setShowLibrary(false)}
          onDelete={(id) => setLibrary(prev => prev.filter(p => p.id !== id))}
          onUploadMore={(files) => {
            Array.from(files).forEach(f => {
              const r = new FileReader();
              r.onload = () => setLibrary(prev => [...prev, { id: Date.now() + Math.random(), name: f.name, url: r.result as string, date: new Date().toLocaleDateString("pt-BR") }]);
              r.readAsDataURL(f);
            });
          }}
        />
      )}

      {/* Preview mini */}
      <div style={{ position: "relative", height: 130, borderRadius: 8, overflow: "hidden", marginBottom: 10, background: "#111" }}>
        <img src={pSlide.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
        <div style={{ position: "absolute", bottom: 10, left: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{pSlide.title}</div>
          <div style={{ fontSize: 10, color: "#aaa" }}>{pSlide.subtitle}</div>
        </div>
        <div style={{ position: "absolute", top: 6, right: 8, fontSize: 9, background: "rgba(0,0,0,0.5)", color: "#aaa", padding: "2px 6px", borderRadius: 4 }}>👁️ Preview</div>
        {/* Nav */}
        <button onClick={() => setPreviewIndex((previewIndex - 1 + slides.length) % slides.length)} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", borderRadius: 4, width: 22, height: 26 }}>‹</button>
        <button onClick={() => setPreviewIndex((previewIndex + 1) % slides.length)} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", borderRadius: 4, width: 22, height: 26 }}>›</button>
        {/* Dots */}
        <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setPreviewIndex(i)} style={{ width: 6, height: 6, borderRadius: "50%", border: "none", background: i === previewIndex ? "#fff" : "#555", cursor: "pointer", padding: 0 }} />
          ))}
        </div>
      </div>

      {/* Slides label */}
      <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: 5 }}>Slides ({slides.length})</div>

      {/* Slides list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
        {slides.map((sl, i) => (
          <div key={sl.id} draggable
            onDragStart={() => setDraggingSlide(i)}
            onDragOver={e => { e.preventDefault(); setDragOverSlide(i); }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDraggingSlide(null); setDragOverSlide(null); }}
            onClick={() => { setActiveSlide(i); setPreviewIndex(i); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${i === activeSlide ? RED : dragOverSlide === i ? "#555" : "#1e1e1e"}`,
              background: i === activeSlide ? "rgba(230,57,70,0.08)" : "#111",
            }}>
            <img src={sl.imageUrl} style={{ width: 40, height: 28, objectFit: "cover", borderRadius: 4 }} alt="" />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, color: i === activeSlide ? "#fff" : "#888" }}>{sl.title}</span>
            <span style={{ fontSize: 10, color: "#444", cursor: "grab" }}>⠿</span>
            {slides.length > 1 && (
              <button onClick={e => { e.stopPropagation(); removeSlide(i); }} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer", padding: "0 2px" }}>×</button>
            )}
          </div>
        ))}
      </div>

      {/* Add slide */}
      <button onClick={addSlide} style={{ width: "100%", padding: "6px 0", border: "2px dashed #222", borderRadius: 6, background: "transparent", color: "#555", fontSize: 11, fontFamily: FONT, cursor: "pointer", marginBottom: 10 }}>+ Novo Slide</button>

      {/* Editor */}
      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid #1e1e1e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Editando slide {activeSlide + 1}</div>
        <DragDropZone onFile={f => handleFileForCrop(activeSlide, f)} currentImage={s.imageUrl.startsWith("https://placehold") ? null : s.imageUrl} />
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => setShowLibrary(true)} style={{ flex: 1, padding: "6px 0", border: "1px solid #333", borderRadius: 6, background: "transparent", color: "#aaa", fontSize: 10, fontFamily: FONT, cursor: "pointer" }}>
            🗂️ Fototeca {library.length > 0 && <span style={{ background: RED, color: "#fff", borderRadius: 10, padding: "1px 5px", marginLeft: 4, fontSize: 9 }}>{library.length}</span>}
          </button>
          <button onClick={() => { if (!s.imageUrl.startsWith("https://placehold")) { setCropSrc(s.imageUrl); setCropTarget({ index: activeSlide, name: s.image || "slide" }); } }}
            disabled={s.imageUrl.startsWith("https://placehold")}
            style={{ flex: 1, padding: "6px 0", border: "1px solid #333", borderRadius: 6, background: "transparent", color: s.imageUrl.startsWith("https://placehold") ? "#333" : "#aaa", fontSize: 10, fontFamily: FONT, cursor: s.imageUrl.startsWith("https://placehold") ? "not-allowed" : "pointer" }}>
            ✂️ Recortar
          </button>
        </div>
        <input value={s.title} onChange={e => updateSlide(activeSlide, "title", e.target.value)} placeholder="Título"
          style={{ width: "100%", marginTop: 8, padding: "7px 10px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, color: "#ccc", fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = RED)} onBlur={e => (e.target.style.borderColor = "#222")} />
        <textarea value={s.subtitle} onChange={e => updateSlide(activeSlide, "subtitle", e.target.value)} placeholder="Subtítulo" rows={2}
          style={{ width: "100%", marginTop: 6, padding: "7px 10px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, color: "#ccc", fontSize: 12, fontFamily: FONT, outline: "none", resize: "none", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = RED)} onBlur={e => (e.target.style.borderColor = "#222")} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button onClick={exportConfig} style={{ flex: 1, padding: "6px 0", border: "1px solid #333", borderRadius: 6, background: exported ? "#1a3a1a" : "transparent", color: exported ? "#4caf50" : "#aaa", fontSize: 10, fontFamily: FONT, cursor: "pointer", transition: "all 0.2s" }}>
          {exported ? "✅ Exportado!" : "⬇️ Exportar JSON"}
        </button>
        <label style={{ flex: 1, padding: "6px 0", border: "1px solid #333", borderRadius: 6, background: "transparent", color: "#aaa", fontSize: 10, fontFamily: FONT, cursor: "pointer", textAlign: "center", display: "block" }}>
          ⬆️ Importar
          <input type="file" accept=".json" style={{ display: "none" }} onChange={importConfig} />
        </label>
      </div>

      <div style={{ fontSize: 9, color: "#444", textAlign: "center" }}>💡 Upload → ✂️ Recortar → 🗂️ Fototeca → ⬇️ Exportar JSON</div>
    </div>
  );
}
