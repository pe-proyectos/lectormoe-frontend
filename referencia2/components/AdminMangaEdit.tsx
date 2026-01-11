
import React, { useState, useRef } from 'react';
import { 
  Save, ChevronLeft, Upload, Image as ImageIcon, Plus, X, 
  Calendar, Clock, Globe, ShieldAlert, Lock, Hash, 
  BookOpen, List, UploadCloud, Eye, Trash2, Edit3, 
  Sparkles, Camera, Settings2, FileText, ChevronRight,
  Info, CheckCircle2, Layers
} from 'lucide-react';

type TabType = 'info' | 'chapters' | 'upload';

interface Chapter {
  id: string;
  number: string;
  title: string;
  date: string;
  views: string;
  isLocked: boolean;
}

const AdminMangaEdit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [formData, setFormData] = useState({
    title: 'El incidente Darwin',
    shortDescription: 'Un híbrido de humano y chimpancé busca su lugar.',
    synopsis: 'La organización ALA atacó un instituto de investigación biológica y rescató a una chimpancé embarazada. De ella nació un "humancé", Charlie. Quince años después, Charlie entra a la secundaria y conoce a Lucy, una chica inteligente pero solitaria...',
    genres: ['Seinen', 'Drama', 'Sci-Fi'],
    subscriptions: ['Rango A', 'Rango S'],
    status: 'En emisión',
    cover: 'https://picsum.photos/seed/darwin/800/1200',
    banner: 'https://picsum.photos/seed/darwinbanner/1200/400'
  });

  const [newChapter, setNewChapter] = useState({
    number: '23',
    title: 'Capítulo 23',
    isSubscriberOnly: false,
    releaseDate: '2026-10-01T17:47',
    thumbnail: null as string | null,
    pages: [] as string[]
  });

  const [chapters] = useState<Chapter[]>([
    { id: '1', number: '21', title: 'El Origen', date: '15/02/2025', views: '42.1k', isLocked: false },
    { id: '2', number: '22', title: 'Huida', date: '28/02/2025', views: '38.5k', isLocked: true },
  ]);

  const bannerRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewChapter(prev => ({ ...prev, thumbnail: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-zinc-950">
      
      {/* Header Editable (Perfil de Manga) */}
      <div className="relative h-56 md:h-72 w-full overflow-hidden group">
        <img src={formData.banner} className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-1000" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        
        <button 
          onClick={() => bannerRef.current?.click()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white p-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500 hover:text-zinc-950 shadow-2xl z-20"
        >
          <Camera size={24} />
        </button>
        <input type="file" ref={bannerRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 md:px-8 flex items-end gap-6 pb-6">
          <div className="relative group/cover shrink-0">
            <div className="w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border-4 border-zinc-950 shadow-2xl relative z-10 bg-zinc-900">
              <img src={formData.cover} className="w-full h-full object-cover" alt="Cover" />
              <button 
                onClick={() => coverRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity backdrop-blur-sm"
              >
                <UploadCloud size={24} className="mb-1" />
                <span className="text-[7px] font-black uppercase tracking-widest">Editar</span>
              </button>
            </div>
            <input type="file" ref={coverRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{formData.title}</h1>
              <span className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Admin View</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={12} className="text-cyan-500" /> {chapters.length} Capítulos publicados
            </p>
          </div>

          <div className="pb-4 hidden md:flex items-center gap-3">
             <button className="bg-white/5 text-white border border-zinc-800 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all">
               Ver como usuario
             </button>
             <button className="bg-cyan-500 text-zinc-950 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">
               Guardar Manga
             </button>
          </div>
        </div>
      </div>

      {/* Admin Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit mb-10">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <Settings2 size={14} /> Información
          </button>
          <button 
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'chapters' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <List size={14} /> Capítulos
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'upload' ? 'bg-cyan-500 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <UploadCloud size={14} /> Subir Capítulo
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          
          {activeTab === 'upload' && (
            <div className="space-y-8">
              {/* Context Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                  <Plus size={20} />
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Subir capítulo de <span className="text-cyan-500">{formData.title}</span>
                </h2>
              </div>

              <div className="grid lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* DETALLES */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-4">
                      <FileText size={16} className="text-cyan-500" /> Detalles
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Número del capítulo</label>
                        <input 
                          type="text" 
                          value={newChapter.number}
                          onChange={(e) => setNewChapter({...newChapter, number: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none" 
                          placeholder="23"
                        />
                        <div className="flex items-center gap-1.5 mt-1 ml-1 group relative cursor-help">
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Anterior:</span>
                          <span className="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest border-b border-cyan-500/20">22</span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-800 text-[8px] font-black text-white uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50 shadow-2xl min-w-[160px] whitespace-nowrap">
                            Número del capítulo más reciente
                            <div className="absolute top-full left-4 border-4 border-transparent border-t-zinc-800" />
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título del capítulo</label>
                        <input 
                          type="text" 
                          value={newChapter.title}
                          onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none" 
                          placeholder="Capítulo 23"
                        />
                        <div className="flex items-center gap-1.5 mt-1 ml-1 group relative cursor-help">
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Anterior:</span>
                          <span className="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest border-b border-cyan-500/20">"Capitulo 22"</span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-800 text-[8px] font-black text-white uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50 shadow-2xl min-w-[160px] whitespace-nowrap">
                            Título del capítulo más reciente
                            <div className="absolute top-full left-4 border-4 border-transparent border-t-zinc-800" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Miniatura del capítulo (Opcional)</label>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest -mt-1">Arrastra y suelta una imagen para el capítulo</p>
                      <div 
                        onClick={() => thumbRef.current?.click()}
                        className="relative aspect-video bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center transition-all hover:border-cyan-500/50 group cursor-pointer overflow-hidden"
                      >
                        {newChapter.thumbnail ? (
                          <img src={newChapter.thumbnail} className="w-full h-full object-cover" alt="Thumb" />
                        ) : (
                          <div className="flex flex-col items-center text-center px-4">
                            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <ImageIcon size={24} className="text-zinc-600 group-hover:text-cyan-500" />
                            </div>
                            <span className="text-white font-black text-[10px] uppercase tracking-widest">Haz clic o arrastra una imagen aquí</span>
                            <span className="text-zinc-600 text-[9px] mt-1 font-bold">Máximo 25MB</span>
                          </div>
                        )}
                        <input type="file" ref={thumbRef} className="hidden" accept="image/*" onChange={handleThumbChange} />
                      </div>
                    </div>
                  </div>

                  {/* PÁGINAS */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Layers size={16} className="text-cyan-500" /> Páginas
                      </h3>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Máximo 25MB por archivo</span>
                    </div>
                    
                    <div 
                      onClick={() => pagesRef.current?.click()}
                      className="min-h-[250px] bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center transition-all hover:border-cyan-500/50 group cursor-pointer"
                    >
                      <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload size={32} className="text-zinc-600 group-hover:text-cyan-500" />
                      </div>
                      <h4 className="text-white font-black italic text-lg uppercase tracking-tighter">Arrastra y suelta imágenes para subir</h4>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2 px-8 text-center">
                        Este capítulo no tiene páginas, arrastra y suelta imágenes en el recuadro de arriba para subir
                      </p>
                      <input type="file" ref={pagesRef} className="hidden" multiple accept="image/*" />
                    </div>
                  </div>
                </div>

                {/* Settings Column */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* OPCIONES */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-8 shadow-xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-4">
                      <Settings2 size={16} className="text-cyan-500" /> Opciones
                    </h3>

                    {/* Subscriber Only Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">Solo para suscriptores</span>
                         <div 
                          onClick={() => setNewChapter({...newChapter, isSubscriberOnly: !newChapter.isSubscriberOnly})}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${newChapter.isSubscriberOnly ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                         >
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newChapter.isSubscriberOnly ? 'right-1' : 'left-1'}`} />
                         </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Si se activa, los no suscriptores no podrán leer este capítulo sin importar la fecha de salida
                      </p>
                    </div>

                    {/* Release Date */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Calendar size={12} /> Fecha de salida
                      </label>
                      <input 
                        type="datetime-local" 
                        value={newChapter.releaseDate}
                        onChange={(e) => setNewChapter({...newChapter, releaseDate: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-[11px] font-black uppercase focus:border-cyan-500 outline-none"
                      />
                      <div className="flex gap-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                        <Info size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-zinc-500 font-medium leading-snug">
                          Solo los suscriptores podrán leer este capítulo antes de la fecha de salida, pasado este tiempo, cualquier usuario podrá leerlo
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 space-y-3 border-t border-zinc-800">
                      <button className="w-full py-4 bg-cyan-500 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2 active:scale-95">
                        <CheckCircle2 size={18} /> Guardar capítulo
                      </button>
                      <button 
                        onClick={() => setActiveTab('chapters')}
                        className="w-full py-4 bg-transparent text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white border border-transparent hover:border-zinc-800 transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 md:p-10 space-y-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título Principal</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xl font-black italic tracking-tighter uppercase focus:border-cyan-500 transition-all outline-none"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sinopsis de la obra</label>
                    <textarea 
                      rows={6}
                      value={formData.synopsis}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl py-4 px-6 text-white text-sm leading-relaxed focus:border-cyan-500 transition-all outline-none resize-none"
                    />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Índice de Capítulos</h3>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{chapters.length} Episodios Publicados</span>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-zinc-950/50 border-b border-zinc-800">
                     <tr>
                       <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">N°</th>
                       <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre</th>
                       <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lecturas</th>
                       <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/50">
                     {chapters.map((ch) => (
                       <tr key={ch.id} className="hover:bg-zinc-800/20 transition-colors group">
                         <td className="px-8 py-6 text-cyan-500 font-black italic">#{ch.number}</td>
                         <td className="px-8 py-6 text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{ch.title}</td>
                         <td className="px-8 py-6 text-xs font-bold text-zinc-500">{ch.views}</td>
                         <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button className="p-2 bg-zinc-950 text-zinc-500 hover:text-white border border-zinc-800 rounded-lg transition-all"><Edit3 size={16} /></button>
                             <button className="p-2 bg-zinc-950 text-zinc-500 hover:text-red-500 border border-zinc-800 rounded-lg transition-all"><Trash2 size={16} /></button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}} />
    </div>
  );
};

export default AdminMangaEdit;
