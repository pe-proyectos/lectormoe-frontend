import React, { useState } from 'react';
import { Shield, Bell, Monitor, User as UserIcon, Globe, Save } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface User {
  id: number;
  username: string;
  email: string;
  imageUrl: string | null;
  emailVerified: boolean;
  isPublicProfile: boolean;
  isPrivateHistory: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;
}

interface SettingsPageProps {
  user: User;
  language: string;
  organizationSlug?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, language, organizationSlug }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [settingsData, setSettingsData] = useState({
    isPublicProfile: user.isPublicProfile,
    isPrivateHistory: user.isPrivateHistory,
    emailNotifications: user.emailNotifications,
    pushNotifications: user.pushNotifications,
  });

  const sections = [
    { id: 'account', label: 'Cuenta', icon: <UserIcon size={18} /> },
    { id: 'appearance', label: 'Apariencia', icon: <Monitor size={18} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacidad', icon: <Shield size={18} /> },
  ];


  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await callAPI(`/api/user/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(settingsData),
      });

      setSuccess('Ajustes guardados correctamente');
      
      // Reload page after 1 second to refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        <div className="mb-12 space-y-1">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Ajustes de <span className="text-cyan-500">Configuración</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium">Gestiona tu experiencia en Capibara Traductor.</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm">
            {success}
          </div>
        )}

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
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={user.email}
                      disabled
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-zinc-500 cursor-not-allowed"
                    />
                    <p className="text-zinc-600 text-xs ml-1">El correo no se puede cambiar por ahora</p>
                  </div>
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
                  <button
                    onClick={() => setSettingsData({
                      ...settingsData, 
                      isPublicProfile: !settingsData.isPublicProfile
                    })}
                    className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${
                      settingsData.isPublicProfile ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-zinc-950 rounded-full transition-all absolute top-1 ${
                      settingsData.isPublicProfile ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-800 rounded-[32px]">
                  <div>
                    <p className="text-white font-bold text-sm">Historial de Lectura Privado</p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">Solo tú podrás ver tus lecturas</p>
                  </div>
                  <button
                    onClick={() => setSettingsData({
                      ...settingsData, 
                      isPrivateHistory: !settingsData.isPrivateHistory
                    })}
                    className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${
                      settingsData.isPrivateHistory ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-zinc-950 rounded-full transition-all absolute top-1 ${
                      settingsData.isPrivateHistory ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="flex items-center gap-3 bg-cyan-500 text-zinc-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} /> {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
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


