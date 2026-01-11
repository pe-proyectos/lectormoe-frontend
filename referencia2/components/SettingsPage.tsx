import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Bell, Eye, Monitor, User as UserIcon, Lock, Trash2, Globe, Save } from 'lucide-react';

interface SettingsPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  const sections = [
    { id: 'account', label: 'Cuenta', icon: <UserIcon size={18} /> },
    { id: 'appearance', label: 'Apariencia', icon: <Monitor size={18} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacidad', icon: <Shield size={18} /> },
  ];

  const handleSave = () => {
    onUpdateUser({ ...user, name: formData.name, email: formData.email });
    alert('Ajustes guardados correctamente.');
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        <div className="mb-12 space-y-1">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Ajustes de <span className="text-cyan-500">Configuración</span></h1>
          <p className="text-zinc-500 text-sm font-medium">Gestiona tu experiencia en Capibara Traductor.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-2">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
                  activeTab === sec.id 
                    ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/10' 
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {sec.icon} {sec.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-8 bg-zinc-900/30 border border-zinc-800 rounded-[40px] p-8 md:p-12">
            
            {activeTab === 'account' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row items-center gap-8 border-b border-zinc-800 pb-10">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-zinc-800 bg-zinc-950">
                      <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-zinc-800 text-white p-2 rounded-xl border-2 border-zinc-950 hover:bg-cyan-500 hover:text-zinc-950 transition-all">
                      <Monitor size={14} />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-white mb-1">Foto de perfil</h3>
                    <p className="text-zinc-500 text-xs font-medium max-w-xs">Recomendado: Imagen cuadrada de al menos 400x400px.</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre Público</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                   <button 
                    onClick={handleSave}
                    className="flex items-center gap-3 bg-cyan-500 text-zinc-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10"
                   >
                     <Save size={16} /> Guardar Cambios
                   </button>
                </div>

                <div className="pt-10 border-t border-zinc-800">
                  <h4 className="text-red-500 font-black text-xs uppercase tracking-widest mb-4">Zona de Peligro</h4>
                  <button className="flex items-center gap-3 text-zinc-500 hover:text-red-500 transition-colors font-bold text-sm">
                    <Trash2 size={18} /> Eliminar mi cuenta permanentemente
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Interfaz</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-950 border-2 border-cyan-500 rounded-2xl flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-bold text-white">Modo Oscuro</span>
                      <Monitor size={20} className="text-cyan-500" />
                    </div>
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
                      <span className="text-sm font-bold text-zinc-500">Modo Claro</span>
                      <Globe size={20} className="text-zinc-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xl font-bold text-white">Preferencias de Lectura</h3>
                   <div className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-800 rounded-[32px]">
                      <div>
                        <p className="text-white font-bold text-sm">Scroll Infinito</p>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">Habilitar en el visor</p>
                      </div>
                      <div className="w-12 h-6 bg-cyan-500 rounded-full relative p-1 cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-zinc-950 rounded-full" />
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-20">
                <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-800 border border-zinc-800">
                  <Bell size={40} />
                </div>
                <h3 className="text-xl font-bold text-white">Configuración de Alertas</h3>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">Pronto podrás configurar notificaciones push y por correo para tus mangas favoritos.</p>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-800 rounded-[32px]">
                  <div>
                    <p className="text-white font-bold text-sm">Perfil Público</p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">Permitir que otros vean tu perfil</p>
                  </div>
                  <div className="w-12 h-6 bg-zinc-800 rounded-full relative p-1 cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-500 rounded-full" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-800 rounded-[32px]">
                  <div>
                    <p className="text-white font-bold text-sm">Historial de Lectura Privado</p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">Solo tú podrás ver tus lecturas</p>
                  </div>
                  <div className="w-12 h-6 bg-cyan-500 rounded-full relative p-1 cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-zinc-950 rounded-full" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;