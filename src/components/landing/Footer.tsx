
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: any, id?: string) => void;
  organization?: any;
  organizationSlug?: string;
}

const Footer: React.FC<FooterProps> = ({ organization }) => {
  // Anchor real (ctrl+click y middle-click funcionan); el onClick solo
  // intercepta el caso "ya estoy en la home sin org" para hacer smooth scroll.
  const scansHref = organization
    ? (organization.slug ? `/${organization.slug}` : '/')
    : '/#scans-section';
  const handleScansClick = (e: React.MouseEvent) => {
    if (organization) return; // navegación normal del anchor
    const element = document.getElementById('scans-section');
    if (element) {
      e.preventDefault();
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-16 pb-8 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
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
              <a
                href="/discord"
                target="_blank"
                rel="noopener noreferrer"
                title="Discord oficial"
                className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Plataforma</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={organization?.slug ? `/${organization.slug}/search` : '/search'}
                  className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors block"
                >
                  Explorar Mangas
                </a>
              </li>
              <li>
                <a
                  href={scansHref}
                  onClick={handleScansClick}
                  className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors block"
                >
                  Directorio de Scans
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Scans</h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="/organizations/register" 
                  className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors block"
                >
                  Registrar mi Scan
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest text-center md:text-left">
            Disclaimer: Capibara Traductor es un agregador de noticias y enlaces. No se almacena ningún archivo con copyright en nuestros servidores. Todos los derechos pertenecen a sus respectivos autores.
          </p>
          <div className="flex gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <a href="/terms" className="hover:text-white transition-colors">Términos</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacidad</a>
            <a href="/dmca" className="hover:text-white transition-colors">DMCA</a>
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

