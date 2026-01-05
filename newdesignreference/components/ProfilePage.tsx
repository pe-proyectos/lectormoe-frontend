
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { POPULAR_MANGAS } from '../constants';
import { Bookmark, Clock, Heart, Award, Zap, ChevronRight, BookOpen, BookMarked, Users, Pause, PlayCircle, X, Camera, Image as ImageIcon, AlignLeft, Upload, Lock, Unlock, User as UserIcon, Info, Sparkles } from 'lucide-react';
import MangaCard3D from './MangaCard3D';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

interface FollowedScan {
  id: string;
  name: string;
  logo: string;
  subscription: {
    rank: string;
    price: string;
    status: 'active' | 'paused';
  } | null;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [followedScans, setFollowedScans] = useState<FollowedScan[]>([
    { 
      id: 's1', 
      name: 'Galaxy Scans', 
      logo: 'https://picsum.photos/seed/s1/100/100', 
      subscription: { rank: 'Rango A', price: '5', status: 'active' } 
    },
    { 
      id: 's2', 
      name: 'Lumina Scanlation', 
      logo: 'https://picsum.photos/seed/s2/100/100', 
      subscription: { rank: 'Ultra Plus', price: '15', status: 'paused' } 
    },
    { 
      id: 's3', 
      name: 'Titan Translations', 
      logo: 'https://picsum.photos/seed/s3/100/100', 
      subscription: null 
    }
  ]);

  const isUserPro = followedScans.some(scan => scan.subscription?.status === 'active');

  const [editData, setEditData] = useState({
    name: user.name,
    avatar: user.avatar || '',
    banner: user.banner || '',
    description: user.description || ''
  });

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (!isUserPro && type === 'banner') return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({
          ...prev,
          [type]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    onUpdateUser({
      ...user,
      name: isUserPro ? editData.name : user.name,
      avatar: editData.avatar,
      banner: isUserPro ? editData.banner : user.banner,
      description: isUserPro ? editData.description : user.description,
      isPro: isUserPro
    });
    setIsEditModalOpen(false);
  };

  const toggleSubscription = (scanId: string) => {
    setFollowedScans(prev => prev.map(scan => {
      if (scan.id === scanId && scan.subscription) {
        return {
          ...scan,
          subscription: {
            ...scan.subscription,
            status: scan.subscription.status === 'active' ? 'paused' : 'active'
          }
        };
      }
      return scan;
    }));
  };

  const stats = [
    { label: 'Leídos', value: '142', icon: <BookOpen className="text-cyan-500" size={18} /> },
    { label: 'Por leer', value: '28', icon: <Bookmark className="text-purple-500" size={18} /> },
    { label: 'Favoritos', value: '15', icon: <Heart className="text-red-500" size={18} /> },
    { label: 'Días Activo', value: '365', icon: <Clock className="text-yellow-500" size={18} /> },
  ];

  const userHistory = [
    { id: '1', mangaName: 'Capibara Knight', chapterNumber: '142', chapterTitle: 'El amanecer del roedor', lastVisited: 'Hoy, 14:30' },
    { id: '2', mangaName: 'Digital Horizon', chapterNumber: '54', chapterTitle: 'Protocolo Zero', lastVisited: 'Ayer, 21:15' },
    { id: '3', mangaName: 'Neon Ronin', chapterNumber: 'Final', chapterTitle: 'El último corte', lastVisited: 'Hace 3 días' },
    { id: '4', mangaName: 'Void Walker', chapterNumber: '12', chapterTitle: 'Ecos del vacío', lastVisited: 'Hace 5 días' },
  ];

  const ProRestrictionTooltip = () => (
    <div className="absolute -top-10 left-0 bg-yellow-500 text-zinc-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
      <Info size={12} /> Para ser Miembro Pro debes tener una suscripción activa
    </div>
  );

  const ProUnlockedTooltip = () => (
    <div className="absolute -top-10 right-0 bg-cyan-500 text-zinc-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-0 group-hover/unlocked:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
      <Sparkles size={12} /> Función disponible gracias a tu rango miembro pro
    </div>
  );

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Profile Header */}
        <div className="relative mb-12">
          <div className="h-48 md:h-72 rounded-[40px] overflow-hidden relative border border-zinc-800 shadow-2xl">
            <img src={user.banner || "https://picsum.photos/seed/bannerprof/1200/400"} className="w-full h-full object-cover opacity-60 transition-opacity duration-700" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          </div>
          
          <div className="relative -mt-16 md:-mt-20 px-8 flex flex-col md:flex-row items-end gap-6 md:gap-10">
            <div className="relative group">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[40px] overflow-hidden border-8 border-zinc-950 bg-zinc-900 shadow-2xl relative z-10">
                <img src={user.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={user.name} />
              </div>
              <div className={`absolute -bottom-2 -right-2 p-2 rounded-2xl border-4 border-zinc-950 z-20 shadow-lg ${isUserPro ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                {isUserPro ? <Zap size={20} fill="currentColor" /> : <Lock size={20} />}
              </div>
            </div>
            
            <div className="flex-1 pb-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{user.name}</h1>
                {isUserPro && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mx-auto md:mx-0">
                    <Award size={14} /> Miembro Pro
                  </div>
                )}
              </div>
              <p className="text-zinc-500 font-bold text-base mb-2">{user.email}</p>
              {user.description && (
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-2xl italic">
                  "{user.description}"
                </p>
              )}
            </div>

            <div className="pb-4 w-full md:w-auto">
              <button 
                onClick={() => {
                  setEditData({
                    name: user.name,
                    avatar: user.avatar || '',
                    banner: user.banner || '',
                    description: user.description || ''
                  });
                  setIsEditModalOpen(true);
                }}
                className="w-full md:w-auto bg-white text-zinc-950 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-500 transition-all transform active:scale-95 shadow-xl shadow-white/5"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-white italic leading-none mb-1">{stat.value}</p>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-16">
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mis <span className="text-purple-500">Scans</span></h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <Users size={14} /> {followedScans.length} Equipos seguidos
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {followedScans.map((scan) => (
                  <div key={scan.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] group hover:bg-zinc-900 transition-all shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-950">
                          <img src={scan.logo} className="w-full h-full object-cover" alt={scan.name} />
                        </div>
                        <div>
                          <h4 className="text-white font-black italic text-lg leading-tight uppercase group-hover:text-cyan-400 transition-colors">{scan.name}</h4>
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Siguiente actualización pronto</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl mb-4">
                      {scan.subscription ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-500"><Award size={16} /></span>
                              <span className="text-white font-bold text-sm">{scan.subscription.rank}</span>
                            </div>
                            <span className="text-white font-black text-sm italic">${scan.subscription.price}/mes</span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${scan.subscription.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-500'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${scan.subscription.status === 'active' ? 'text-green-500' : 'text-orange-500'}`}>
                                {scan.subscription.status === 'active' ? 'Suscripción Activa' : 'Suscripción Pausada'}
                              </span>
                            </div>
                            <button 
                              onClick={() => toggleSubscription(scan.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${
                                scan.subscription.status === 'active' 
                                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white' 
                                  : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white'
                              }`}
                            >
                              {scan.subscription.status === 'active' ? (
                                <><Pause size={12} /> Pausar</>
                              ) : (
                                <><PlayCircle size={12} /> Reanudar</>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-zinc-500 font-bold text-xs">Sin suscripción activa</span>
                          <button className="text-cyan-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">Ver Planes</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mis <span className="text-cyan-500">Favoritos</span></h2>
                <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all">
                  Ver todo <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {POPULAR_MANGAS.slice(0, 3).map(manga => (
                  <MangaCard3D key={manga.id} manga={manga} hideScan />
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                 <BookMarked className="text-cyan-500" size={20} /> Continuar leyendo
               </h3>
               <div className="space-y-4">
                 {userHistory.map((item) => (
                   <div 
                     key={item.id} 
                     className="group bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden"
                   >
                     <div className="flex justify-between items-start mb-2">
                       <div className="min-w-0 flex-1 pr-2">
                         <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-1 truncate">{item.mangaName}</p>
                         <h4 className="text-white font-bold text-xs truncate">
                           Cap. {item.chapterNumber} - {item.chapterTitle}
                         </h4>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:bg-cyan-500 group-hover:text-zinc-950 transition-all shrink-0">
                         <PlayCircle size={14} fill="currentColor" />
                       </div>
                     </div>
                     <div className="flex items-center gap-1.5 text-zinc-600 text-[8px] font-bold uppercase tracking-widest">
                       <Clock size={10} />
                       <span>Visto: {item.lastVisited}</span>
                     </div>
                   </div>
                 ))}
               </div>
               <button className="w-full mt-8 text-center text-[10px] font-black text-zinc-500 hover:text-cyan-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group">
                 Ver historial completo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-0">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
               <div className="flex items-center gap-3">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Personalizar <span className="text-cyan-500">Perfil</span></h3>
                 {!isUserPro && (
                   <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-zinc-700">
                     <Lock size={10} /> Free User
                   </span>
                 )}
               </div>
               <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Account Basic Info (Username) */}
              <div className="space-y-3 relative group/input">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon size={14} /> Nombre de Usuario
                  </label>
                  <div className="relative group/unlocked">
                    {isUserPro ? (
                      <>
                        <Unlock size={12} className="text-cyan-500" />
                        <ProUnlockedTooltip />
                      </>
                    ) : (
                      <Lock size={12} className="text-yellow-500" />
                    )}
                  </div>
                </div>
                <input 
                  type="text" 
                  value={editData.name}
                  disabled={!isUserPro}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  placeholder="Usuario"
                  className={`w-full bg-zinc-950 border rounded-2xl py-4 px-5 text-white transition-all text-sm ${!isUserPro ? 'border-zinc-800 opacity-50 cursor-not-allowed' : 'border-zinc-800 focus:border-cyan-500'}`}
                />
                {!isUserPro && <ProRestrictionTooltip />}
              </div>

              {/* Banner Edit (Restringido Pro) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} /> Fondo de Perfil (Banner)
                  </label>
                  <div className="relative group/unlocked flex items-center gap-2">
                    {isUserPro ? (
                      <>
                        <Unlock size={12} className="text-cyan-500" />
                        <span className="text-cyan-500 text-[8px] font-black uppercase tracking-widest">Pro Unlocked</span>
                        <ProUnlockedTooltip />
                      </>
                    ) : (
                      <>
                        <Lock size={10} className="text-yellow-500" />
                        <span className="text-yellow-500 text-[8px] font-black uppercase tracking-widest">Pro Only</span>
                      </>
                    )}
                  </div>
                </div>
                <div 
                  onClick={() => isUserPro && bannerInputRef.current?.click()}
                  className={`relative h-40 w-full rounded-3xl overflow-hidden border-2 border-dashed transition-all group/input ${!isUserPro ? 'border-zinc-800 cursor-not-allowed' : 'border-zinc-800 hover:border-cyan-500/50 cursor-pointer bg-zinc-950'}`}
                >
                  {editData.banner ? (
                    <>
                      <img src={editData.banner} className={`w-full h-full object-cover transition-opacity ${!isUserPro ? 'opacity-20 grayscale' : 'opacity-40 group-hover/input:opacity-60'}`} alt="" />
                      {isUserPro && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                           <Upload size={24} className="mb-2 group-hover/input:-translate-y-1 transition-transform" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Banner</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                       <Upload size={32} className="mb-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Seleccionar Imagen</span>
                    </div>
                  )}
                  {!isUserPro && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <Lock size={32} className="text-yellow-500 mb-2" />
                      <span className="text-white font-black text-[10px] uppercase tracking-widest">Requiere Suscripción Activa</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={bannerInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    disabled={!isUserPro}
                  />
                </div>
              </div>

              {/* Avatar Edit (Libre) */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Camera size={14} /> Foto de Perfil (Avatar)
                </label>
                <div className="flex items-center gap-8">
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-28 h-28 rounded-[32px] overflow-hidden border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 cursor-pointer group bg-zinc-950 flex items-center justify-center transition-all"
                  >
                    {editData.avatar ? (
                      <img src={editData.avatar} className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" alt="Avatar Preview" />
                    ) : (
                      <Upload size={24} className="text-zinc-600" />
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/40 transition-opacity">
                       <Camera size={20} className="text-white" />
                    </div>
                    <input 
                      type="file" 
                      ref={avatarInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'avatar')}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-white font-bold text-sm">Cambiar foto de perfil</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">JPG, PNG o WebP (Max 2MB)</p>
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                    >
                      Elegir archivo
                    </button>
                  </div>
                </div>
              </div>

              {/* Description Edit (Restringido Pro) */}
              <div className="space-y-4 relative group/input">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft size={14} /> Biografía / Descripción
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative group/unlocked">
                      {isUserPro ? (
                        <>
                          <Unlock size={12} className="text-cyan-500" />
                          <ProUnlockedTooltip />
                        </>
                      ) : (
                        <Lock size={12} className="text-yellow-500" />
                      )}
                    </div>
                    <span className={`text-[10px] font-black ${editData.description.length >= 140 ? 'text-red-500' : 'text-zinc-600'}`}>
                      {editData.description.length}/140
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <textarea 
                    value={editData.description}
                    disabled={!isUserPro}
                    onChange={(e) => setEditData({...editData, description: e.target.value.slice(0, 140)})}
                    placeholder={isUserPro ? "Escribe algo sobre ti..." : "Solo miembros Pro pueden tener una descripción personalizada"}
                    rows={4}
                    className={`w-full bg-zinc-950 border rounded-3xl py-4 px-6 text-white transition-all text-sm resize-none ${!isUserPro ? 'border-zinc-800 opacity-50 cursor-not-allowed' : 'border-zinc-800 focus:border-cyan-500'}`}
                  />
                  {!isUserPro && <ProRestrictionTooltip />}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-zinc-800 bg-zinc-950/30 flex items-center gap-4">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-4 bg-cyan-500 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-lg shadow-cyan-500/10 transform active:scale-95"
              >
                Guardar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
