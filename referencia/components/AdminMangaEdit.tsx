
import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, Plus, Calendar, BookOpen, UploadCloud, Trash2, 
  Settings2, Layers, GripVertical, ZoomIn, ZoomOut, 
  Map as MapIcon, RotateCcw, Split, Layout, Maximize2, CheckCircle2,
  Camera, FileText, Image as ImageIcon
} from 'lucide-react';

type TabType = 'info' | 'chapters' | 'upload';

interface PageSpread {
  id: string;
  urls: string[]; 
  isSingle: boolean; 
}

const AdminMangaEdit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [showMinimap, setShowMinimap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; position: 'left' | 'center' | 'right' } | null>(null);

  const [formData, setFormData] = useState({
    title: 'El incidente Darwin',
    cover: 'https://picsum.photos/seed/darwin/800/1200',
    banner: 'https://picsum.photos/seed/darwinbanner/1200/400'
  });

  const [newChapter, setNewChapter] = useState({
    number: '23',
    title: 'Capítulo 23',
    releaseDate: '2026-10-01T17:47',
    spreads: [
      { id: 's1', urls: ['https://picsum.photos/seed/p1/800/1200', 'https://picsum.photos/seed/p2/800/1200'], isSingle: false },
      { id: 's2', urls: ['https://picsum.photos/seed/p3/800/1200'], isSingle: true },
      { id: 's3', urls: ['https://picsum.photos/seed/p4/800/1200', 'https://picsum.photos/seed/p5/800/1200'], isSingle: false },
    ] as PageSpread[]
  });

  const bannerRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const minimapContainerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Calcula el número de página global para cada imagen en los spreads
  const getGlobalPageNumber = (spreadIdx: number, urlIdx: number) => {
    let count = 0;
    for (let i = 0; i < spreadIdx; i++) {
      count += newChapter.spreads[i].urls.length;
    }
    return count + urlIdx + 1;
  };

  const startAutoscroll = (container: HTMLDivElement, direction: number, speed: number) => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    const scroll = () => {
      if (container) {
        container.scrollTop += direction * speed;
        scrollRafRef.current = requestAnimationFrame(scroll);
      }
    };
    scrollRafRef.current = requestAnimationFrame(scroll);
  };

  const stopAutoscroll = () => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };

  const handleDragStart = (index: number) => setDraggedIdx(index);

  const handleDragOver = (e: React.DragEvent, index: number, containerRef: React.RefObject<HTMLDivElement | null>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const isTargetSingle = newChapter.spreads[index].isSingle;

    let position: 'left' | 'center' | 'right' = 'center';
    if (!isTargetSingle) {
      if (x < width * 0.25) position = 'left';
      else if (x > width * 0.75) position = 'right';
    }

    setDropTarget({ index, position });

    const container = containerRef.current;
    if (container) {
      const cRect = container.getBoundingClientRect();
      const threshold = 60;
      const mouseRelY = e.clientY - cRect.top;
      if (mouseRelY < threshold) startAutoscroll(container, -1, 6);
      else if (mouseRelY > cRect.height - threshold) startAutoscroll(container, 1, 6);
      else stopAutoscroll();
    }
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    stopAutoscroll();
    if (draggedIdx === null) return;

    const pos = dropTarget?.position || 'center';
    let updated = [...newChapter.spreads];
    const draggedItem = updated[draggedIdx];

    if ((pos === 'left' || pos === 'right') && !updated[targetIdx].isSingle) {
      const movingUrls = draggedItem.urls;
      updated.splice(draggedIdx, 1);
      const adjIdx = draggedIdx < targetIdx ? targetIdx - 1 : targetIdx;
      
      if (pos === 'left') {
        updated[adjIdx].urls = [...movingUrls, ...updated[adjIdx].urls].slice(0, 2);
      } else {
        updated[adjIdx].urls = [...updated[adjIdx].urls, ...movingUrls].slice(0, 2);
      }
    } else {
      const [moved] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, moved);
    }

    setNewChapter({ ...newChapter, spreads: updated });
    setDraggedIdx(null);
    setDropTarget(null);
  };

  const toggleSingle = (index: number) => {
    const updated = [...newChapter.spreads];
    const spread = updated[index];
    
    if (!spread.isSingle) {
      if (spread.urls.length === 2) {
        const [u1, u2] = spread.urls;
        updated.splice(index, 1, 
          { id: `s-${Date.now()}-1`, urls: [u1], isSingle: true },
          { id: `s-${Date.now()}-2`, urls: [u2], isSingle: true }
        );
      } else {
        spread.isSingle = true;
      }
    } else {
      spread.isSingle = false;
    }
    setNewChapter({ ...newChapter, spreads: updated });
  };

  const deleteSpread = (index: number) => {
    setNewChapter({ ...newChapter, spreads: newChapter.spreads.filter((_, i) => i !== index) });
  };

  const handlePagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const readers = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(newUrls => {
      const newSpreads: PageSpread[] = [];
      const leftoverUrls = [...newUrls];
      
      while(leftoverUrls.length > 0) {
        const pair = leftoverUrls.splice(0, 2);
        newSpreads.push({
          id: `new-${Math.random()}`,
          urls: pair,
          isSingle: false
        });
      }
      
      setNewChapter(prev => ({ ...prev, spreads: [...prev.spreads, ...newSpreads] }));
    });
  };

  const scrollToPage = (index: number) => {
    const content = scrollContainerRef.current?.querySelector('.spreads-container');
    if (content && content.children[index]) {
      content.children[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-zinc-950">
      
      {/* Banner */}
      <div className="relative h-56 md:h-72 w-full overflow-hidden group">
        <img src={formData.banner} className="w-full h-full object-cover opacity-20" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <button onClick={() => bannerRef.current?.click()} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white p-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500 hover:text-zinc-950 z-20">
          <Camera size={24} />
        </button>
        <input type="file" ref={bannerRef} className="hidden" accept="image/*" />

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-8 flex items-end gap-6 pb-6">
          <div className="w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border-4 border-zinc-950 shadow-2xl bg-zinc-900 shrink-0">
            <img src={formData.cover} className="w-full h-full object-cover" alt="Cover" />
          </div>
          <div className="flex-1 pb-4">
            <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{formData.title}</h1>
            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <Settings2 size={12} /> Editor de Capítulos
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Acciones */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
             <button className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">
               <UploadCloud size={14} /> Subir Capítulo
             </button>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => pagesRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                <Plus size={14} /> Añadir Imágenes
             </button>
             <button className="flex items-center gap-2 px-6 py-2 bg-white text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-xl">
                <Save size={14} /> Guardar Cambios
             </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            
            {/* Maquetación con Max Height */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-4 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-500">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Maquetación de Páginas</h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Doble página por defecto (Arrastra para fusionar)</p>
                  </div>
                </div>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 gap-2">
                  <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1 text-zinc-500 hover:text-white transition-colors"><ZoomOut size={16} /></button>
                  <span className="text-[10px] font-black text-white min-w-[30px] text-center">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-1 text-zinc-500 hover:text-white transition-colors"><ZoomIn size={16} /></button>
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <button onClick={() => setShowMinimap(!showMinimap)} className={`p-1 transition-colors ${showMinimap ? 'text-cyan-500' : 'text-zinc-600'}`}><MapIcon size={16} /></button>
                </div>
              </div>

              <div className="relative flex gap-4 flex-1 min-h-0">
                <div ref={scrollContainerRef} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-y-auto custom-scrollbar p-6">
                  <div className="spreads-container flex flex-col items-center gap-12 mx-auto transition-all duration-300" style={{ width: `${zoomLevel}%` }}>
                    {newChapter.spreads.map((spread, idx) => (
                      <div 
                        key={spread.id} 
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx, scrollContainerRef)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={() => { setDraggedIdx(null); setDropTarget(null); stopAutoscroll(); }}
                        className={`relative group/spread w-full transition-all ${draggedIdx === idx ? 'opacity-30 scale-95 blur-sm' : ''} ${spread.isSingle ? 'max-w-2xl' : 'w-full'}`}
                      >
                        {/* Zonas de Drop */}
                        {dropTarget?.index === idx && draggedIdx !== idx && (
                          <div className="absolute inset-0 pointer-events-none z-40 flex gap-2">
                            {!spread.isSingle ? (
                              <>
                                <div className={`w-1/4 h-full border-2 border-dashed border-cyan-500 rounded-xl ${dropTarget.position === 'left' ? 'bg-cyan-500/20' : ''}`} />
                                <div className={`w-2/4 h-full border-2 border-dashed border-cyan-500 rounded-xl ${dropTarget.position === 'center' ? 'bg-cyan-500/20' : ''}`} />
                                <div className={`w-1/4 h-full border-2 border-dashed border-cyan-500 rounded-xl ${dropTarget.position === 'right' ? 'bg-cyan-500/20' : ''}`} />
                              </>
                            ) : (
                              <div className="w-full h-full border-2 border-dashed border-cyan-500 rounded-xl bg-cyan-500/20" />
                            )}
                          </div>
                        )}

                        {/* Contenedor de Páginas con Altura Máxima 40rem */}
                        <div className={`flex gap-1 p-2 bg-zinc-900/40 border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden max-h-[40rem] ${spread.urls.length === 2 ? 'aspect-video' : 'aspect-[2/3]'}`}>
                          {spread.urls.map((url, uIdx) => (
                            <div key={uIdx} className="relative flex-1 overflow-hidden rounded-lg bg-zinc-950 flex flex-col items-center justify-center h-full">
                              <img src={url} className="w-full h-full object-contain" alt="" />
                              
                              {/* Numeración Global */}
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white shadow-lg z-10">
                                PÁGINA {getGlobalPageNumber(idx, uIdx)}
                              </div>
                            </div>
                          ))}

                          {/* CONTROLES INTERNOS (DENTRO DEL HOVER DE LA PÁGINA) */}
                          <div className="absolute inset-0 z-20 opacity-0 group-hover/spread:opacity-100 transition-all pointer-events-none flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-[2px]">
                             <div className="flex items-center gap-3 pointer-events-auto">
                                <button 
                                  onClick={() => toggleSingle(idx)} 
                                  className={`p-4 rounded-2xl border transition-all shadow-xl hover:scale-110 active:scale-95 ${spread.isSingle ? 'bg-cyan-500 border-cyan-400 text-zinc-950' : 'bg-zinc-800/90 border-white/10 text-white'}`}
                                  title={spread.isSingle ? "Combinar en Pliego" : "Convertir en Página Sencilla"}
                                >
                                  {spread.isSingle ? <Layout size={24} /> : <Maximize2 size={24} />}
                                </button>
                                <button 
                                  onClick={() => deleteSpread(idx)} 
                                  className="p-4 bg-red-500/90 border border-red-400/20 rounded-2xl text-white hover:bg-red-600 transition-all shadow-xl hover:scale-110 active:scale-95"
                                  title="Eliminar"
                                >
                                  <Trash2 size={24} />
                                </button>
                             </div>
                             <div className="p-4 bg-white/10 border border-white/10 rounded-2xl text-white/50 cursor-grab active:cursor-grabbing pointer-events-auto hover:text-white transition-colors">
                               <GripVertical size={28} />
                             </div>
                             <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] pointer-events-none">
                                {spread.isSingle ? 'Página Sencilla' : 'Pliego Doble'}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MINIMAPA */}
                {showMinimap && (
                  <div ref={minimapContainerRef} className="w-24 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col overflow-y-auto custom-scrollbar p-2 gap-2 shrink-0 animate-in slide-in-from-right-2 duration-300">
                    {newChapter.spreads.map((spread, idx) => (
                      <div
                        key={`mini-${spread.id}`}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx, minimapContainerRef)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onClick={() => scrollToPage(idx)}
                        className={`relative w-full rounded-lg overflow-hidden border transition-all cursor-pointer group/mini shrink-0 ${spread.urls.length === 2 ? 'aspect-video' : 'aspect-[2/3]'} ${draggedIdx === idx ? 'opacity-30 border-cyan-500 scale-90' : 'border-zinc-800 hover:border-cyan-500/50'}`}
                      >
                         <div className="flex h-full w-full bg-zinc-950">
                            {spread.urls.map((url, uIdx) => (
                              <img key={uIdx} src={url} className="flex-1 object-cover opacity-60" alt="" />
                            ))}
                         </div>
                         <div className="absolute inset-0 bg-black/20 group-hover/mini:bg-transparent transition-colors" />
                         <span className="absolute bottom-1 right-1 text-[8px] font-black text-white bg-black/60 px-1 rounded">
                           {spread.urls.length > 1 ? `${getGlobalPageNumber(idx, 0)}-${getGlobalPageNumber(idx, 1)}` : getGlobalPageNumber(idx, 0)}
                         </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input type="file" ref={pagesRef} className="hidden" multiple accept="image/*" onChange={handlePagesUpload} />
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-8 shadow-xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-4">
                <FileText size={16} className="text-cyan-500" /> Publicación
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Número de Capítulo</label>
                  <input type="text" value={newChapter.number} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título</label>
                  <input type="text" value={newChapter.title} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Lanzamiento Programado</label>
                  <input type="datetime-local" value={newChapter.releaseDate} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-[11px] font-black uppercase focus:border-cyan-500 outline-none" />
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <button className="w-full py-4 bg-cyan-500 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95">
                  <CheckCircle2 size={18} /> Publicar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />
    </div>
  );
};

export default AdminMangaEdit;
