import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Ticket,
  DollarSign,
  MessageSquare,
  Settings,
  Tag,
  UserCircle,
  Menu,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  page: string;
  organizationSlug: string;
  language?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ page, organizationSlug }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: `/${organizationSlug}/admin`,
    },
    {
      id: 'authors',
      label: 'Autores',
      icon: UserCircle,
      href: `/${organizationSlug}/admin/authors`,
    },
    {
      id: 'genres',
      label: 'Géneros',
      icon: Tag,
      href: `/${organizationSlug}/admin/genres`,
    },
    {
      id: 'mangas',
      label: 'Mangas',
      icon: BookOpen,
      href: `/${organizationSlug}/admin/mangas`,
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      href: `/${organizationSlug}/admin/users`,
    },
    {
      id: 'subscription_plans',
      label: 'Planes de Suscripción',
      icon: Ticket,
      href: `/${organizationSlug}/admin/subscription-plans`,
    },
    {
      id: 'finance',
      label: 'Finanzas',
      icon: DollarSign,
      href: `/${organizationSlug}/admin/finance`,
    },
    {
      id: 'comments',
      label: 'Comentarios',
      icon: MessageSquare,
      href: `/${organizationSlug}/admin/comments`,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      href: `/${organizationSlug}/admin/settings`,
    },
  ];

  // Cerrar menú móvil al hacer clic fuera o cambiar de página
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const menuContent = (
    <nav className="p-4 space-y-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = page === item.id;
        
        return (
          <a
            key={item.id}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl 
              text-sm font-bold uppercase tracking-wider
              transition-all group
              ${isActive 
                ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }
            `}
          >
            <Icon 
              size={20} 
              className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-zinc-950' : ''}`}
            />
            <span className="truncate">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Botón de menú móvil */}
      <button
        className="mobile-menu-button fixed top-[72px] left-4 z-[60] md:hidden p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileMenuOpen(!isMobileMenuOpen);
        }}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menú móvil (overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[55] md:hidden">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside 
            className="mobile-menu absolute left-0 top-0 h-full w-[280px] max-w-[85vw] border-r border-zinc-800 bg-zinc-950 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {menuContent}
          </aside>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:block sticky top-[72px] h-[calc(100vh-72px)] w-full max-w-[280px] border-r border-zinc-800 bg-zinc-950/50 overflow-y-auto">
        {menuContent}
      </aside>
    </>
  );
};

export default AdminSidebar;

