
import React from 'react';
import { SUBSCRIPTION_PLANS, SCANS } from '../constants';
import { Check, Shield, Crown, Zap, Star, ExternalLink, Users, Trophy, MessageSquare, Heart } from 'lucide-react';

interface Props {
  scanId: string;
}

const SubscriptionPage: React.FC<Props> = ({ scanId }) => {
  const scan = SCANS.find(s => s.id === scanId) || SCANS[0];

  const topSubscribers = [
    { name: 'Arley155', days: 450, rank: 'SS+', color: 'text-yellow-500', avatar: 'https://picsum.photos/seed/arley/200/200' },
    { name: 'KuroNeko_99', days: 420, rank: 'SS+', color: 'text-yellow-500', avatar: 'https://picsum.photos/seed/kuro/200/200' },
    { name: 'Dayane', days: 332, rank: 'S', color: 'text-purple-500', avatar: 'https://picsum.photos/seed/dayane/200/200' },
    { name: 'Nay13sos2006', days: 326, rank: 'A', color: 'text-cyan-500', avatar: 'https://picsum.photos/seed/nay/200/200' },
    { name: 'Fredy193', days: 296, rank: 'A', color: 'text-cyan-500', avatar: 'https://picsum.photos/seed/fredy/200/200' },
    { name: 'alecin', days: 203, rank: 'B', color: 'text-zinc-400', avatar: 'https://picsum.photos/seed/ale/200/200' },
  ];

  // Organizar para la pirámide (Podio: 1ro al centro, 2do izquierda, 3ro derecha)
  const podium = [
    topSubscribers[1], // #2
    topSubscribers[0], // #1
    topSubscribers[2], // #3
  ];

  const others = topSubscribers.slice(3);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <Shield size={12} className="text-cyan-500" /> Membresías de {scan.name}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
            Suscripciones
          </h1>
          <p className="text-zinc-400 text-lg font-medium">
            ¡Accede a contenido exclusivo y olvídate de los anuncios! Compra un plan de suscripción para apoyar al scan.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-zinc-900/40 border-2 rounded-[32px] p-8 flex flex-col transition-all duration-500 hover:scale-[1.02] hover:bg-zinc-900 ${plan.color.split(' ')[0]}`}
            >
              <div className="mb-8">
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-1 ${plan.color.split(' ')[1]}`}>
                  {plan.rank}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-4xl font-black italic">$</span>
                  <span className="text-white text-6xl font-black italic tracking-tighter">{plan.price}</span>
                  <span className="text-zinc-500 font-bold uppercase text-[10px] ml-1">/ MES</span>
                </div>
                <p className="text-zinc-500 text-xs font-medium mt-4 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.benefits.map((benefit, bIdx) => (
                  <div key={bIdx} className="flex gap-3">
                    <div className="mt-1 shrink-0 w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-cyan-500">
                      <Check size={10} />
                    </div>
                    <span className="text-zinc-300 text-xs font-medium leading-snug">{benefit}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">
                Por favor, inicia sesión para suscribirte
              </button>
            </div>
          ))}
        </div>

        {/* External Support Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          {/* Patreon CTA */}
          <a 
            href="https://patreon.com" 
            target="_blank" 
            className="group relative bg-gradient-to-br from-[#FF424D]/20 to-zinc-900 border border-[#FF424D]/30 rounded-[40px] p-10 flex items-center justify-between overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(255,66,77,0.1)]"
          >
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                Suscríbete desde Patreon
              </h2>
              <p className="text-zinc-400 font-medium">Apoya directamente y obtén beneficios premium.</p>
              <div className="inline-flex items-center gap-2 text-[#FF424D] font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                Ir a Patreon <ExternalLink size={16} />
              </div>
            </div>
            <div className="w-24 h-24 bg-[#FF424D] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform shrink-0">
               <span className="text-white font-black text-4xl italic">P</span>
            </div>
          </a>

          {/* Discord CTA */}
          <a 
            href="https://discord.com" 
            target="_blank" 
            className="group relative bg-gradient-to-br from-[#5865F2]/20 to-zinc-900 border border-[#5865F2]/30 rounded-[40px] p-10 flex items-center justify-between overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(88,101,242,0.1)]"
          >
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                Únete a nuestro Discord
              </h2>
              <p className="text-zinc-400 font-medium">Reclama tu rango de Patreon en la web y el servidor.</p>
              <div className="inline-flex items-center gap-2 text-[#5865F2] font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                Ir a Discord <MessageSquare size={16} />
              </div>
            </div>
            <div className="w-24 h-24 bg-[#5865F2] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform shrink-0">
               <MessageSquare size={40} className="text-white" fill="currentColor" />
            </div>
          </a>
        </div>

        {/* Top Subscribers Full Width Ranking */}
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                <Trophy size={28} />
              </div>
              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Ranking de Suscriptores</h3>
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Los pilares que mantienen vivo a {scan.name}</p>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-800 rounded-[48px] p-8 md:p-16 relative overflow-hidden">
            {/* Pyramid / Podium Layout */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-12 md:gap-4 mb-24 mt-12">
              
              {/* #2 - Left */}
              <div className="order-2 md:order-1 flex flex-col items-center group w-full max-w-[200px]">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-zinc-700 to-zinc-400 shadow-2xl overflow-hidden ring-4 ring-zinc-800 ring-offset-4 ring-offset-zinc-950">
                    <img src={podium[0].avatar} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-white font-black italic shadow-lg border-2 border-zinc-900 text-lg">2</div>
                </div>
                <h4 className="text-white font-black italic text-xl mb-1 truncate w-full text-center">{podium[0].name}</h4>
                <div className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2 border border-zinc-700">{podium[0].rank}</div>
                <p className="text-zinc-500 font-bold text-[10px] uppercase">{podium[0].days} días</p>
              </div>

              {/* #1 - Center (Tallest) */}
              <div className="order-1 md:order-2 flex flex-col items-center group w-full max-w-[280px] md:-translate-y-8">
                <div className="relative mb-8">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce transition-transform duration-1000">
                    <Crown size={56} fill="currentColor" />
                  </div>
                  <div className="w-48 h-48 rounded-full p-2 bg-gradient-to-tr from-yellow-600 to-yellow-200 shadow-[0_0_60px_rgba(234,179,8,0.3)] overflow-hidden ring-4 ring-yellow-500 ring-offset-8 ring-offset-zinc-950">
                    <img src={podium[1].avatar} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-zinc-950 font-black italic text-2xl shadow-xl border-4 border-zinc-950">1</div>
                </div>
                <h4 className="text-white font-black italic text-3xl mb-1 tracking-tighter truncate w-full text-center">{podium[1].name}</h4>
                <div className="px-5 py-1.5 bg-yellow-500/10 rounded-lg text-xs font-black uppercase text-yellow-500 tracking-widest mb-2 border border-yellow-500/20">{podium[1].rank}</div>
                <p className="text-zinc-300 font-bold text-xs uppercase flex items-center gap-2">
                  <Heart size={14} fill="currentColor" className="text-red-500 animate-pulse" /> {podium[1].days} días de apoyo
                </p>
              </div>

              {/* #3 - Right */}
              <div className="order-3 md:order-3 flex flex-col items-center group w-full max-w-[200px]">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-orange-800 to-orange-400 shadow-2xl overflow-hidden ring-4 ring-zinc-800 ring-offset-4 ring-offset-zinc-950">
                    <img src={podium[2].avatar} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center text-white font-black italic shadow-lg border-2 border-zinc-900 text-lg">3</div>
                </div>
                <h4 className="text-white font-black italic text-xl mb-1 truncate w-full text-center">{podium[2].name}</h4>
                <div className="px-3 py-1 bg-purple-500/10 rounded-lg text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2 border border-purple-500/20">{podium[2].rank}</div>
                <p className="text-zinc-500 font-bold text-[10px] uppercase">{podium[2].days} días</p>
              </div>
            </div>

            {/* Sub-Ranking Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-zinc-800/50">
              {others.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 bg-zinc-950/40 border border-zinc-800 rounded-[32px] hover:bg-zinc-800/80 hover:border-cyan-500/50 transition-all group shadow-sm">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-cyan-500 transition-colors shadow-inner">
                        <img src={user.avatar} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt="" />
                     </div>
                     <div>
                       <h4 className="text-white font-bold group-hover:text-cyan-400 transition-colors leading-none mb-1 text-base">{user.name}</h4>
                       <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{user.days} días suscrito</p>
                     </div>
                   </div>
                   <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${user.color.replace('text', 'border')} ${user.color} bg-zinc-900/50`}>
                     {user.rank}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
