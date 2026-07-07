import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Ticket,
  DollarSign,
  MessageSquare,
  Inbox,
  Megaphone,
  Settings,
  Tag,
  UserCircle,
  Link2,
} from 'lucide-react';

interface AdminSidebarProps {
  page: string;
  organizationSlug: string;
  language?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ page, organizationSlug }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: `/${organizationSlug}/admin/mangas`,
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
      id: 'writings',
      label: 'Novelas',
      icon: BookOpen,
      href: `/${organizationSlug}/admin/writings`,
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      href: `/${organizationSlug}/admin/users`,
    },
    {
      id: 'joints',
      label: 'Joints',
      icon: Link2,
      href: `/${organizationSlug}/admin/joints`,
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
      id: 'messages',
      label: 'Mensajes',
      icon: Inbox,
      href: `/${organizationSlug}/admin/messages`,
    },
    {
      id: 'recruitment',
      label: 'Reclutamiento',
      icon: Megaphone,
      href: `/${organizationSlug}/admin/recruitment`,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      href: `/${organizationSlug}/admin/settings`,
    },
  ];

  return (
    <aside className="hidden md:block sticky top-[72px] h-[calc(100vh-72px)] w-full max-w-[280px] border-r border-zinc-800 bg-zinc-950/50 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          
          return (
            <a
              key={item.id}
              href={item.href}
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
    </aside>
  );
};

export default AdminSidebar;

