
import React, { useState } from 'react';
import { ShieldCheck, Zap, Headphones, CreditCard, DollarSign, Users, MessageCircle, Share2, ArrowRight, CheckCircle, Send } from 'lucide-react';

const RegisterScanPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const benefits = [
    {
      title: 'Google Ads desde el día 1',
      desc: 'Monetización inmediata del contenido sin esperas.',
      icon: <DollarSign className="text-green-500" />,
    },
    {
      title: 'Soporte técnico 24/7',
      desc: 'Gestión de bugs por parte del equipo especializado.',
      icon: <Headphones className="text-cyan-500" />,
    },
    {
      title: 'Sistema de suscripciones',
      desc: 'Planes VIP integrados con PayPal para contenido exclusivo.',
      icon: <CreditCard className="text-purple-500" />,
    },
    {
      title: 'Costo de entrada $0',
      desc: 'Sin letras pequeñas, la plataforma crece contigo.',
      icon: <Zap className="text-yellow-500" />,
    },
    {
      title: 'Roles y permisos',
      desc: 'Gestión profesional de traductores, typesetters y editores.',
      icon: <Users className="text-orange-500" />,
    },
    {
      title: 'Mensajería y moderación',
      desc: 'Control total sobre tu comunidad y sus comentarios.',
      icon: <MessageCircle className="text-blue-500" />,
    },
    {
      title: 'Automatización con Discord',
      desc: 'Anuncios automáticos de capítulos nuevos en tu servidor.',
      icon: <Share2 className="text-indigo-500" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="mb-20 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <ShieldCheck size={14} className="text-cyan-500" /> Programa de Partners
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
            Registra tu <span className="text-cyan-500">Scan</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-medium">
            Lleva tu equipo al siguiente nivel con la infraestructura más potente para scanlations.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* Left: Benefits Information */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">¿Por qué unirete <span className="text-cyan-500">a nosotros?</span></h2>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Capibara Traductor no es solo un visor de manga, es una suite completa de herramientas diseñada por y para fans del scanlation.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-cyan-500/30 transition-all shadow-xl">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-black text-base italic uppercase tracking-tight mb-1 group-hover:text-cyan-400 transition-colors">
                      {benefit.title}
                    </h4>
                    <p className="text-zinc-500 text-sm font-medium leading-snug">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[40px] p-8 md:p-12 shadow-2xl">
              {isSubmitted ? (
                <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20">
                    <CheckCircle size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Solicitud Enviada</h3>
                    <p className="text-zinc-400 font-medium max-w-xs mx-auto">
                      Hemos recibido tus datos. Nuestro equipo revisará tu scan y te contactará por correo en las próximas 48 horas.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-cyan-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Enviar otra solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 mb-4">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Formulario de Aplicación</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Completa los campos para postular tu equipo</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tu Nombre</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-800 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="contacto@tuscan.com"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-800 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre del Scan</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Galaxy Scans"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-800 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Referencias (Links a FB/Web/Discord)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="https://facebook.com/miscan..."
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-800 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Trabajos Previos / Mangas en curso</label>
                    <textarea 
                      required 
                      rows={3}
                      placeholder="Menciona tus proyectos más importantes..."
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-800 text-sm resize-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Lectores Mensuales Estimados</label>
                    <select className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all text-sm appearance-none cursor-pointer">
                      <option value="0-5k">Menos de 5,000</option>
                      <option value="5k-20k">5,000 - 20,000</option>
                      <option value="20k-50k">20,000 - 50,000</option>
                      <option value="50k+">Más de 50,000</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-6">
                    <button 
                      type="submit"
                      className="w-full bg-cyan-500 text-zinc-950 py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10"
                    >
                      <Send size={16} /> Enviar Solicitud de Registro
                    </button>
                    <p className="mt-6 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                      Al enviar este formulario, confirmas que eres el representante oficial del scan mencionado.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScanPage;
