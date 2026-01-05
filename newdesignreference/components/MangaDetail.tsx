
import React, { useMemo } from 'react';
import { POPULAR_MANGAS } from '../constants';
import { Star, Share2, Eye, Download, ChevronRight, Zap, ExternalLink, MessageCircle, ThumbsUp, ThumbsDown, LogIn, Award } from 'lucide-react';

interface MangaDetailProps {
  mangaId: string;
  onNavigate: (page: any, id?: string) => void;
}

const MangaDetail: React.FC<MangaDetailProps> = ({ mangaId, onNavigate }) => {
  const manga = useMemo(() => POPULAR_MANGAS.find(m => m.id === mangaId) || POPULAR_MANGAS[0], [mangaId]);

  const chapters = [
    { id: '224', title: 'Luna, estocada, lanza', time: 'hace 1 semana', isFree: true },
    { id: '223', title: 'La armadura más fuerte', time: 'hace 2 semanas', isFree: true },
    { id: '222', title: 'Denji Man', time: 'hace 1 mes', isFree: true },
    { id: '221', title: 'Batalla segura', time: 'hace 1 mes', isFree: true },
  ];

  const comments = [
    { id: '1', user: 'manuel-3', time: 'hace 3 mess', content: '#420 ✋🧐🤚', likes: 2, dislikes: 0 },
    { id: '2', user: 'Sand', time: 'hace 1 mes', content: '#670 ✋️🧐🤚', likes: 1, dislikes: 0 },
    { id: '3', user: 'Jose2005', time: 'hace 1 semana', content: 'Sois unos genios gracias porque después de ver el arco de reze me quede ilusionado de seguir y como no tengo mucho dinero para comprar mangas vosotros me habéis echo muy feliz, seguir así.', likes: 1, dislikes: 0 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      {/* Banner Backdrop */}
      <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden">
        <img 
          src={manga.cover} 
          className="w-full h-full object-cover opacity-60 blur-[2px] scale-105" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-32 md:-mt-48 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* SECCION IZQUIERDA (SIDEBAR) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="relative group">
              <div className="aspect-[2/3] rounded-3xl overflow-hidden border-4 border-zinc-950 shadow-2xl bg-zinc-900 ring-1 ring-white/10">
                <img src={manga.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={manga.title} />
              </div>
            </div>

            <button className="w-full bg-yellow-400 hover:bg-yellow-300 text-zinc-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/10 transition-all active:scale-95">
              <Star size={18} fill="currentColor" /> AÑADIR A FAVORITOS
            </button>

            <div className="space-y-6">
              <div>
                <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">Estado:</p>
                <div className="inline-flex px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-xs font-black uppercase tracking-widest">
                  EN EMISIÓN
                </div>
              </div>

              <div>
                <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">Demografía:</p>
                <p className="text-white font-bold text-sm">Shōnen</p>
              </div>

              <div>
                <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">Géneros:</p>
                <div className="flex flex-wrap gap-2">
                  {manga.genres?.map(genre => (
                    <span key={genre} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                      {genre}
                    </span>
                  ))}
                  {/* Additional hardcoded for UI accuracy */}
                  <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">Terror</span>
                  <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">Comedy</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white p-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-colors">
                  IR AL PRIMER CAPÍTULO
                </button>
                <button className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white p-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-colors">
                  IR AL ÚLTIMO CAPÍTULO
                </button>
              </div>
            </div>
          </div>

          {/* SECCION DERECHA (MAIN CONTENT) */}
          <div className="lg:col-span-9 space-y-12">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">{manga.title}</h1>
              <p className="text-zinc-400 text-lg font-bold">Por {manga.author || 'Tatsuki Fujimoto'}</p>
              
              <div className="max-w-4xl">
                <p className="text-zinc-300 text-base leading-relaxed font-medium">
                  {manga.description || "Cuando su padre murió, Denji se vio obligado a saldar una gran deuda y no había forma de pagarla. Pero gracias a la ayuda de un Demonio Perro que salvó llamado Pochita, Denji es capaz de sobrevivir convirtiéndose en un Cazador de demonios a sueldo, haciendo trabajos para los Yakuza. Los poderes motosierra de Pochita son útiles contra estos poderosos demonios. Y cuando Denji termina siendo asesinado por un demonio, Pochita se sacrifica para revivirlo. Pero ahora Denji ha renacido como una especie de extraño híbrido Demonio-Humano. ¡Ahora es Chainsaw Man! Después de su transformación, es reclutado rápidamente y obligado a unirse a los Cazadores de Demonios de Seguridad Pública bajo amenaza de exterminio ya que técnicamente es un Demonio. Ahora que vive cómodamente por primera vez en su vida, Denji lucha por determinar sus sueños y establecer relaciones significativas mientras mata demonios y trabaja junto a otros excéntricos cazadores."}
                </p>
              </div>
            </div>

            {/* Chapters Section */}
            <div>
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Capítulos <span className="text-zinc-500 text-sm font-bold ml-2">224 publicados</span></h2>
              </div>
              
              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="group bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between hover:bg-zinc-900 hover:border-cyan-500/30 transition-all">
                       <div className="flex items-center gap-6">
                         <div className="w-24 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50">
                            <img src={manga.cover} className="w-full h-full object-cover grayscale" alt="" />
                         </div>
                         <div className="space-y-1">
                           <div className="flex items-center gap-3">
                             <h4 className="text-white font-bold text-lg">Capítulo {chapter.id}</h4>
                             <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Disponible para todos: {chapter.time}</span>
                           </div>
                           <p className="text-zinc-400 text-base font-bold italic tracking-tight uppercase group-hover:text-cyan-400 transition-colors">"{chapter.title}"</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4 text-zinc-500">
                             <button className="hover:text-cyan-400 transition-colors"><Share2 size={18} /></button>
                             <button className="hover:text-cyan-400 transition-colors"><Eye size={18} /></button>
                             <button className="hover:text-cyan-400 transition-colors"><Download size={18} /></button>
                          </div>
                          <button className="bg-white text-zinc-950 px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-500 transition-all">
                             Leer
                          </button>
                       </div>
                    </div>
                  ))}
                </div>

                {/* Range Picker (UI Accuracy) */}
                <div className="w-24 space-y-2 hidden md:block">
                  {['221-230', '211-220', '201-210', '191-200', '181-190', '171-180', '161-170', '151-160'].map((range, idx) => (
                    <button key={range} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${idx === 0 ? 'bg-white text-zinc-950 shadow-lg' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white'}`}>
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMMENTS SECTION (FULL WIDTH) */}
        <div className="mt-24 pt-16 border-t border-zinc-900 space-y-10 mb-20">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Comentarios</h2>
          
          <div className="space-y-8">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-6 items-start group">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 font-black text-xl shadow-lg">
                  {comment.user[0]}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-black text-sm uppercase tracking-tight">{comment.user}</span>
                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{comment.time}</span>
                  </div>
                  <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl relative">
                    <span className="absolute -top-3 right-6 text-zinc-700 font-black italic text-xs">#{Math.floor(Math.random() * 999)}</span>
                    <p className="text-zinc-300 text-base leading-relaxed">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-6 pl-2">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                        <ThumbsUp size={16} /> <span className="text-[10px] font-bold">{comment.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors ml-4">
                        <ThumbsDown size={16} /> <span className="text-[10px] font-bold">{comment.dislikes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-10 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-[40px] text-center space-y-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
               <LogIn size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Únete a la conversación</h3>
              <p className="text-zinc-500 text-sm font-medium">Inicia sesión para dejar tus pensamientos sobre este manga.</p>
            </div>
            <button 
              onClick={() => onNavigate('login')}
              className="bg-white text-zinc-950 px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-xl active:scale-95"
            >
              Inicia sesión para comentar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaDetail;
