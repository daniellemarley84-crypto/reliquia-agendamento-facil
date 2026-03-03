import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, ArrowUp, ArrowDown, Plus, Upload, Scissors, Save, Image, FolderOpen } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
//  Types
// ════════════════════════════════════════════════════════════════════════════
interface SlideData {
  id: string;
  order_index: number;
  image_url: string;
  active: boolean;
}

interface StorageFile {
  name: string;
  url: string;
}

// ════════════════════════════════════════════════════════════════════════════
//  CropModal (simplified, robust)
// ════════════════════════════════════════════════════════════════════════════
function CropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (url: string) => void; onCancel: () => void }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dragRef = useRef<any>(null);
  const [crop, setCropState] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const setCrop = (c: typeof crop) => { cropRef.current = c; setCropState(c); };

  useEffect(() => {
    if (!imgLoaded || !containerRef.current) return;
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    const w = cw * 0.8, h = ch * 0.8;
    setCrop({ x: (cw - w) / 2, y: (ch - h) / 2, w, h });
  }, [imgLoaded]);

  const constrain = useCallback((c: typeof crop) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return c;
    let { x, y, w, h } = c;
    w = Math.max(20, Math.min(w, rect.width));
    h = Math.max(20, Math.min(h, rect.height));
    x = Math.max(0, Math.min(x, rect.width - w));
    y = Math.max(0, Math.min(y, rect.height - h));
    return { x, y, w, h };
  }, []);

  const getPos = (e: any) => {
    if (e.touches) { const t = e.touches[0] || e.changedTouches[0]; return { clientX: t.clientX, clientY: t.clientY }; }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const relPos = (e: any) => {
    const r = containerRef.current!.getBoundingClientRect();
    const { clientX, clientY } = getPos(e);
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const onPointerDown = (e: any) => {
    if ('button' in e && e.button !== 0) return;
    e.preventDefault();
    const { x: px, y: py } = relPos(e);
    const sc = { ...cropRef.current };
    if (px >= sc.x && px <= sc.x + sc.w && py >= sc.y && py <= sc.y + sc.h) {
      dragRef.current = { type: "move", startX: px, startY: py, startCrop: sc };
    } else {
      dragRef.current = { type: "create", startX: px, startY: py };
    }
  };

  const onPointerMove = useCallback((e: any) => {
    const d = dragRef.current;
    if (!d) return;
    e.preventDefault();
    const { x: px, y: py } = relPos(e);
    if (d.type === "move") {
      const dx = px - d.startX, dy = py - d.startY;
      setCrop(constrain({ ...d.startCrop, x: d.startCrop.x + dx, y: d.startCrop.y + dy }));
    } else {
      let x = d.startX, y = d.startY, w = px - d.startX, h = py - d.startY;
      if (w < 0) { x = px; w = -w; }
      if (h < 0) { y = py; h = -h; }
      setCrop(constrain({ x, y, w: Math.max(4, w), h: Math.max(4, h) }));
    }
  }, [constrain]);

  const onPointerUp = () => { dragRef.current = null; };

  const applyCrop = () => {
    const img = imgRef.current;
    const cr = containerRef.current?.getBoundingClientRect();
    if (!img || !cr) return;
    const c = cropRef.current;
    const scale = Math.min(cr.width / img.naturalWidth, cr.height / img.naturalHeight);
    const offX = (cr.width - img.naturalWidth * scale) / 2;
    const offY = (cr.height - img.naturalHeight * scale) / 2;
    const sx = (c.x - offX) / scale, sy = (c.y - offY) / scale;
    const sw = c.w / scale, sh = c.h / scale;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    onConfirm(canvas.toDataURL("image/jpeg", 0.95));
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 relative cursor-crosshair select-none overflow-hidden mx-5 my-4"
        style={{ touchAction: "none" }}
        onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
      >
        <img ref={imgRef} src={src} crossOrigin="anonymous" onLoad={() => setImgLoaded(true)}
          className="w-full h-full object-contain pointer-events-none" />
        {crop.w > 4 && crop.h > 4 && (
          <>
            <div className="absolute top-0 left-0 right-0 bg-black/60" style={{ height: crop.y }} />
            <div className="absolute left-0 right-0 bottom-0 bg-black/60" style={{ top: crop.y + crop.h }} />
            <div className="absolute bg-black/60" style={{ top: crop.y, left: 0, width: crop.x, height: crop.h }} />
            <div className="absolute bg-black/60" style={{ top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h }} />
            <div className="absolute border-2 border-destructive" style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }} />
          </>
        )}
      </div>
      <div className="flex justify-center gap-3 p-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button variant="destructive" onClick={applyCrop} disabled={crop.w <= 4}>✅ Aplicar Recorte</Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Upload helper
// ════════════════════════════════════════════════════════════════════════════
async function uploadToStorage(dataUrl: string): Promise<string | null> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `slides/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from("carousel").upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) { toast.error("Erro upload: " + error.message); return null; }
  return supabase.storage.from("carousel").getPublicUrl(path).data.publicUrl;
}

// ════════════════════════════════════════════════════════════════════════════
//  CarouselPanel — Full admin UI
// ════════════════════════════════════════════════════════════════════════════
export function CarouselPanel() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<Record<number, string>>({});
  const [fototeca, setFototeca] = useState<StorageFile[]>([]);
  const [showFototeca, setShowFototeca] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchSlides = async () => {
    const { data } = await supabase.from("carousel_slides").select("*").order("order_index");
    if (data) setSlides(data.map(d => ({ id: d.id, order_index: d.order_index ?? d.position ?? 0, image_url: d.image_url, active: d.active ?? true })));
    setLoading(false);
  };

  const fetchFototeca = async () => {
    const { data } = await supabase.storage.from("carousel").list("slides", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (data) {
      setFototeca(data.filter(f => !f.id?.endsWith("/")).map(f => ({
        name: f.name,
        url: supabase.storage.from("carousel").getPublicUrl(`slides/${f.name}`).data.publicUrl,
      })));
    }
  };

  useEffect(() => { fetchSlides(); fetchFototeca(); }, []);

  const s = slides[selected];

  const addSlide = () => {
    setSlides(prev => [...prev, { id: crypto.randomUUID(), order_index: prev.length, image_url: "", active: true }]);
    setSelected(slides.length);
    setDirty(true);
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const removed = slides[idx];
    supabase.from("carousel_slides").delete().eq("id", removed.id).then();
    setSlides(prev => prev.filter((_, i) => i !== idx));
    setSelected(Math.min(selected, slides.length - 2));
    setDirty(true);
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const arr = [...slides];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSlides(arr);
    setSelected(target);
    setDirty(true);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingImages(prev => ({ ...prev, [selected]: dataUrl }));
      setSlides(prev => prev.map((sl, i) => i === selected ? { ...sl, image_url: dataUrl } : sl));
      setDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const openCrop = () => {
    if (!s || !s.image_url) return;
    setCropSrc(s.image_url);
  };

  const handleCropConfirm = (croppedUrl: string) => {
    setPendingImages(prev => ({ ...prev, [selected]: croppedUrl }));
    setSlides(prev => prev.map((sl, i) => i === selected ? { ...sl, image_url: croppedUrl } : sl));
    setCropSrc(null);
    setDirty(true);
  };

  const applyFototecaImage = (url: string) => {
    setSlides(prev => prev.map((sl, i) => i === selected ? { ...sl, image_url: url } : sl));
    setDirty(true);
    setShowFototeca(false);
  };

  const deleteFototecaFile = async (name: string) => {
    await supabase.storage.from("carousel").remove([`slides/${name}`]);
    setFototeca(prev => prev.filter(f => f.name !== name));
    toast.success("Arquivo removido!");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = [...slides];
      for (const [idxStr, dataUrl] of Object.entries(pendingImages)) {
        const idx = parseInt(idxStr);
        if (dataUrl.startsWith("data:")) {
          const url = await uploadToStorage(dataUrl);
          if (url) updated[idx] = { ...updated[idx], image_url: url };
        }
      }
      for (let i = 0; i < updated.length; i++) updated[i] = { ...updated[i], order_index: i };

      // Delete all existing and re-insert
      await supabase.from("carousel_slides").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("carousel_slides").insert(
        updated.map(sl => ({ id: sl.id, order_index: sl.order_index, image_url: sl.image_url, active: sl.active, position: sl.order_index, title: "", subtitle: "" }))
      );
      if (error) { toast.error("Erro ao salvar: " + error.message); }
      else {
        setSlides(updated);
        setPendingImages({});
        setDirty(false);
        toast.success("Carrossel atualizado!");
        fetchFototeca();
      }
    } catch (err: any) { toast.error("Erro: " + err.message); }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {cropSrc && <CropModal src={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {/* Preview 16:9 */}
      <div className="relative w-full rounded-lg overflow-hidden bg-muted/20 border border-border" style={{ aspectRatio: "16/9" }}>
        {s?.image_url ? (
          <img src={s.image_url} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            <Image className="mr-2 h-5 w-5" /> Nenhuma imagem
          </div>
        )}
        {s && (
          <div className="absolute top-2 right-2 bg-black/60 text-xs text-white px-2 py-1 rounded">
            Slide {selected + 1} {s.active ? "✅" : "⛔"}
          </div>
        )}
      </div>

      {/* Slide tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {slides.map((sl, i) => (
          <button
            key={sl.id}
            onClick={() => setSelected(i)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              i === selected
                ? "bg-primary text-primary-foreground border-primary"
                : sl.active
                  ? "bg-muted text-foreground border-border hover:bg-muted/80"
                  : "bg-muted/30 text-muted-foreground border-border/50 opacity-60"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={addSlide}
          className="px-3 py-1.5 rounded-md text-sm font-medium border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Slide controls */}
      {s && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Slide {selected + 1}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ativo</span>
              <Switch
                checked={s.active}
                onCheckedChange={(v) => { setSlides(prev => prev.map((sl, i) => i === selected ? { ...sl, active: v } : sl)); setDirty(true); }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" /> Enviar arquivo
            </Button>
            <Button variant="outline" size="sm" onClick={openCrop} disabled={!s.image_url}>
              <Scissors className="mr-1 h-3.5 w-3.5" /> Crop
            </Button>
            <Button variant="outline" size="sm" onClick={() => moveSlide(selected, -1)} disabled={selected === 0}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => moveSlide(selected, 1)} disabled={selected === slides.length - 1}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => removeSlide(selected)} disabled={slides.length <= 1}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Deletar
            </Button>
          </div>
        </div>
      )}

      {/* Fototeca */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <button onClick={() => { setShowFototeca(!showFototeca); if (!showFototeca) fetchFototeca(); }}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full text-left">
          <FolderOpen className="h-4 w-4" />
          Fototeca ({fototeca.length} arquivos)
          <span className="text-xs text-muted-foreground ml-auto">{showFototeca ? "▲" : "▼"}</span>
        </button>
        {showFototeca && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2">
            {fototeca.length === 0 && <p className="col-span-full text-xs text-muted-foreground">Nenhum arquivo no bucket.</p>}
            {fototeca.map(f => (
              <div key={f.name} className="relative group rounded-md overflow-hidden border border-border aspect-square cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => applyFototecaImage(f.url)}>
                <img src={f.url} className="w-full h-full object-cover" alt={f.name} />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFototecaFile(f.name); }}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving || !dirty} className="w-full" size="lg">
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Salvando..." : dirty ? "Salvar alterações" : "✅ Salvo"}
      </Button>
    </div>
  );
}

// Keep default export for sidebar embedding
export default CarouselPanel;
