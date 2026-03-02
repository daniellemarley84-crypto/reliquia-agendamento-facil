import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Touch support
  const getPos = (e: any) => {
    if (e.touches) {
      const t = e.touches[0] || e.changedTouches[0];
      return { clientX: t.clientX, clientY: t.clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const relPos = (e: any) => {
    const r = containerRef.current!.getBoundingClientRect();
    const { clientX, clientY } = getPos(e);
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const HANDLE_HIT = 18;
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

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;
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

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const d = dragRef.current;
    if (!d) return;
    e.preventDefault();
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

  const onPointerUp = () => { dragRef.current = null; };

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
      <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "14px 0", flexWrap: "wrap" }}>
        {Object.keys(AR).map(k => (
          <button key={k} onClick={() => changeAspect(k)} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
            border: `1px solid ${aspect === k ? RED : "#555"}`, background: "transparent", color: aspect === k ? RED : "#aaa",
          }}>{k}</button>
        ))}
      </div>

      <div ref={containerRef} style={{ flex: 1, height: "60vh", position: "relative", cursor: "crosshair", userSelect: "none", overflow: "hidden", margin: "0 20px", touchAction: "none" }}
        onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}>
        <img ref={imgRef} src={src} crossOrigin="anonymous" onLoad={() => setImgLoaded(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
        {crop.w > 4 && crop.h > 4 && (
          <>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: crop.y, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", top: crop.y + crop.h, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", top: crop.y, left: 0, width: crop.x, height: crop.h, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", left: crop.x, top: crop.y, width: crop.w, height: crop.h, border: `2px solid ${RED}` }}>
              {[1,2].map(i => <div key={`v${i}`} style={{ position: "absolute", left: `${i*33.33}%`, top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.2)" }} />)}
              {[1,2].map(i => <div key={`h${i}`} style={{ position: "absolute", top: `${i*33.33}%`, left: 0, height: 1, width: "100%", background: "rgba(255,255,255,0.2)" }} />)}
              {Object.entries(handlePositions).map(([k, pos]) => (
                <div key={k} style={{ position: "absolute", width: 14, height: 14, background: RED, border: "2px solid #fff", borderRadius: 3, ...pos }} />
              ))}
            </div>
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

      <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "14px 0" }}>
        <button onClick={onCancel} style={{ padding: "8px 20px", borderRadius: 6, border: "1px solid #555", background: "transparent", color: "#aaa", fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>Cancelar</button>
        <button onClick={applyCrop} disabled={crop.w <= 4} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: RED, color: "#fff", fontSize: 12, fontFamily: FONT, cursor: crop.w > 4 ? "pointer" : "not-allowed", opacity: crop.w > 4 ? 1 : 0.4, fontWeight: 600 }}>✅ Aplicar Recorte</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  2. DragDropZone
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
//  3. CarouselPanel — with DB persistence
// ════════════════════════════════════════════════════════════════════════════
interface SlideData {
  id: string;
  position: number;
  title: string;
  subtitle: string;
  image_url: string;
}

async function uploadImageToStorage(dataUrl: string, filename: string): Promise<string | null> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `slides/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from("carousel").upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) { toast.error("Erro ao fazer upload: " + error.message); return null; }
  const { data } = supabase.storage.from("carousel").getPublicUrl(path);
  return data.publicUrl;
}

export function CarouselPanel() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ index: number } | null>(null);
  const [draggingSlide, setDraggingSlide] = useState<number | null>(null);
  const [dragOverSlide, setDragOverSlide] = useState<number | null>(null);

  // Local pending image data URLs (not yet uploaded)
  const [pendingImages, setPendingImages] = useState<Record<number, string>>({});

  const fetchSlides = async () => {
    const { data, error } = await supabase.from("carousel_slides").select("*").order("position");
    if (!error && data) {
      setSlides(data as SlideData[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  const updateSlide = (idx: number, field: string, val: any) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
    setDirty(true);
  };

  const handleFileForCrop = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropTarget({ index: idx });
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedUrl: string) => {
    if (cropTarget) {
      // Store as pending (data URL), will be uploaded on save
      setPendingImages(prev => ({ ...prev, [cropTarget.index]: croppedUrl }));
      updateSlide(cropTarget.index, "image_url", croppedUrl);
    }
    setCropSrc(null);
    setCropTarget(null);
  };

  const addSlide = () => {
    const newSlide: SlideData = {
      id: crypto.randomUUID(),
      position: slides.length,
      title: `Slide ${slides.length + 1}`,
      subtitle: "Subtítulo",
      image_url: `https://placehold.co/1200x500/1a1a2e/ffffff?text=Slide+${slides.length + 1}`,
    };
    setSlides(prev => [...prev, newSlide]);
    setDirty(true);
  };

  const removeSlide = async (idx: number) => {
    if (slides.length <= 1) return;
    const slide = slides[idx];
    // Delete from DB
    await supabase.from("carousel_slides").delete().eq("id", slide.id);
    setSlides(prev => prev.filter((_, i) => i !== idx));
    if (activeSlide >= slides.length - 1) setActiveSlide(Math.max(0, slides.length - 2));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload any pending images first
      const updatedSlides = [...slides];
      for (const [idxStr, dataUrl] of Object.entries(pendingImages)) {
        const idx = parseInt(idxStr);
        if (dataUrl.startsWith("data:")) {
          const publicUrl = await uploadImageToStorage(dataUrl, `slide_${idx}.jpg`);
          if (publicUrl) {
            updatedSlides[idx] = { ...updatedSlides[idx], image_url: publicUrl };
          }
        }
      }

      // Upsert all slides with correct positions
      for (let i = 0; i < updatedSlides.length; i++) {
        updatedSlides[i] = { ...updatedSlides[i], position: i };
      }

      // Delete all existing and re-insert
      await supabase.from("carousel_slides").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("carousel_slides").insert(
        updatedSlides.map(s => ({ id: s.id, position: s.position, title: s.title, subtitle: s.subtitle, image_url: s.image_url }))
      );

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
      } else {
        setSlides(updatedSlides);
        setPendingImages({});
        setDirty(false);
        toast.success("Carrossel salvo com sucesso!");
      }
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
    setSaving(false);
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
    setDirty(true);
  };

  if (loading) return <div style={{ color: "#666", fontSize: 12, padding: 10 }}>Carregando...</div>;

  const s = slides[activeSlide] || slides[0];
  const pSlide = slides[previewIndex] || slides[0];

  if (!s) return <div style={{ color: "#666", fontSize: 12, padding: 10 }}>Nenhum slide encontrado.</div>;

  return (
    <div style={{ fontFamily: FONT, color: "#ccc", fontSize: 12 }}>
      {cropSrc && <CropModal src={cropSrc} onConfirm={handleCropConfirm} onCancel={() => { setCropSrc(null); setCropTarget(null); }} />}

      {/* Preview mini */}
      <div style={{ position: "relative", height: 130, borderRadius: 8, overflow: "hidden", marginBottom: 10, background: "#111" }}>
        {pSlide && <img src={pSlide.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
        <div style={{ position: "absolute", bottom: 10, left: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{pSlide?.title}</div>
          <div style={{ fontSize: 10, color: "#aaa" }}>{pSlide?.subtitle}</div>
        </div>
        <div style={{ position: "absolute", top: 6, right: 8, fontSize: 9, background: "rgba(0,0,0,0.5)", color: "#aaa", padding: "2px 6px", borderRadius: 4 }}>👁️ Preview</div>
        <button onClick={() => setPreviewIndex((previewIndex - 1 + slides.length) % slides.length)} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", borderRadius: 4, width: 22, height: 26 }}>‹</button>
        <button onClick={() => setPreviewIndex((previewIndex + 1) % slides.length)} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", borderRadius: 4, width: 22, height: 26 }}>›</button>
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
            <img src={sl.image_url} style={{ width: 40, height: 28, objectFit: "cover", borderRadius: 4 }} alt="" />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, color: i === activeSlide ? "#fff" : "#888" }}>{sl.title}</span>
            <span style={{ fontSize: 10, color: "#444", cursor: "grab" }}>⠿</span>
            {slides.length > 1 && (
              <button onClick={e => { e.stopPropagation(); removeSlide(i); }} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer", padding: "0 2px" }}>×</button>
            )}
          </div>
        ))}
      </div>

      <button onClick={addSlide} style={{ width: "100%", padding: "6px 0", border: "2px dashed #222", borderRadius: 6, background: "transparent", color: "#555", fontSize: 11, fontFamily: FONT, cursor: "pointer", marginBottom: 10 }}>+ Novo Slide</button>

      {/* Editor */}
      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid #1e1e1e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Editando slide {activeSlide + 1}</div>
        <DragDropZone onFile={f => handleFileForCrop(activeSlide, f)} currentImage={s.image_url.startsWith("https://placehold") ? null : s.image_url} />
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => { if (!s.image_url.startsWith("https://placehold")) { setCropSrc(s.image_url); setCropTarget({ index: activeSlide }); } }}
            disabled={s.image_url.startsWith("https://placehold")}
            style={{ flex: 1, padding: "6px 0", border: "1px solid #333", borderRadius: 6, background: "transparent", color: s.image_url.startsWith("https://placehold") ? "#333" : "#aaa", fontSize: 10, fontFamily: FONT, cursor: s.image_url.startsWith("https://placehold") ? "not-allowed" : "pointer" }}>
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

      {/* SAVE BUTTON */}
      <button onClick={handleSave} disabled={saving || !dirty}
        style={{
          width: "100%", padding: "10px 0", border: "none", borderRadius: 8,
          background: dirty ? `linear-gradient(135deg, ${RED}, #c1121f)` : "#333",
          color: dirty ? "#fff" : "#666", fontSize: 13, fontWeight: 700,
          fontFamily: FONT, cursor: dirty ? "pointer" : "not-allowed",
          marginBottom: 8, transition: "all 0.2s",
        }}>
        {saving ? "Salvando..." : dirty ? "💾 Salvar Carrossel" : "✅ Salvo"}
      </button>

      <div style={{ fontSize: 9, color: "#444", textAlign: "center" }}>Upload → ✂️ Recortar → 💾 Salvar</div>
    </div>
  );
}
