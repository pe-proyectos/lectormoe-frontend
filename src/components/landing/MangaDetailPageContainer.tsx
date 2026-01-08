import React from 'react';
import MangaDetailPage from './MangaDetailPage';
import Navbar from './Navbar';
import Footer from './Footer';

interface Organization {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  isPublic: boolean;
}

interface MangaDetailPageContainerProps {
  manga: any;
  organization?: Organization;
  user?: any;
  logged?: boolean;
  language?: string;
}

const MangaDetailPageContainer: React.FC<MangaDetailPageContainerProps> = ({ 
  manga,
  organization,
  user,
  logged,
}) => {
  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar
        activeScan={organization}
        user={user}
        logged={logged}
        organization={organization}
        onGoHome={() => navigateTo(organization?.slug ? `/${organization.slug}` : '/')}
        onGoSearch={() => navigateTo(organization?.slug ? `/${organization.slug}/search` : '/search')}
        onGoSubscriptions={() => navigateTo(organization?.slug ? `/${organization.slug}/subscriptions` : '/')}
        onOpenLogin={() => navigateTo(organization?.slug ? `/${organization.slug}/login` : '/login')}
        onOpenRegister={() => navigateTo(organization?.slug ? `/${organization.slug}/register` : '/register')}
        onGoExplore={() => navigateTo('/scans')}
        activeView="manga"
      />
      
      <MangaDetailPage 
        manga={manga} 
        organization={organization}
        user={user}
        logged={logged}
      />
      
      <Footer 
        organization={organization}
      />
    </div>
  );
};

export default MangaDetailPageContainer;

