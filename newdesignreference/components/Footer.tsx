
import React from 'react';
import { Twitter, Instagram, Github, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: any, id?: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-zinc-950 font-black text-lg">C</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Capibara<span className="text-cyan-500">Traductor</span>
              </span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              La plataforma centralizada para scanlations. No alojamos contenido directamente, conectamos a lectores con sus scans favoritos.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all">
                <Github size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Plataforma</h4>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={() => onNavigate?.('explore')} 
                  className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors text-left"
                >
                  Explorar Mangas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const el = document.getElementById('scans-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else onNavigate?.('home');
                  }} 
                  className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors text-left"
                >
                  Directorio de Scans
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Scans</h4>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={() => onNavigate?.('register-scan')} 
                  className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors text-left"
                >
                  Registrar mi Scan
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Newsletter</h4>
            <p className="text-zinc-500 text-sm mb-4">Suscríbete para recibir alertas de nuevos capítulos y lanzamientos premium.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="tu@email.com" 
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 flex-1"
              />
              <button className="bg-cyan-500 text-zinc-950 p-2 rounded-lg hover:bg-cyan-400 transition-all">
                <Mail size={20} />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest text-center md:text-left">
            Disclaimer: Capibara Traductor es un agregador de noticias y enlaces. No se almacena ningún archivo con copyright en nuestros servidores. Todos los derechos pertenecen a sus respectivos autores.
          </p>
          <div className="flex gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">DMCA</a>
          </div>
        </div>
        
        <div className="mt-8 text-center text-zinc-700 text-xs">
          © {new Date().getFullYear()} Capibara Traductor. Diseñado con ❤️ para la comunidad de scanlation.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
