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
  nsfwMode?: boolean;
}

const MangaDetailPageContainer: React.FC<MangaDetailPageContainerProps> = ({
  manga,
  organization,
  user,
  logged,
  nsfwMode = false,
}) => {
  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const orgPrefix = nsfwMode ? `/red/${organization?.slug}` : `/${organization?.slug}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar
        activeScan={organization}
        user={user}
        logged={logged}
        organization={organization}
        onGoHome={() => navigateTo(organization?.slug ? orgPrefix : '/')}
        onGoSearch={() => navigateTo(organization?.slug ? `${orgPrefix}/search` : '/search')}
        onGoSubscriptions={() => navigateTo(organization?.slug ? `${orgPrefix}/subscriptions` : '/')}
        onOpenLogin={() => navigateTo(organization?.slug ? `/${organization.slug}/login` : '/login')}
        onOpenRegister={() => navigateTo(organization?.slug ? `/${organization.slug}/register` : '/register')}
        onGoExplore={() => navigateTo('/scans')}
        activeView="manga"
        nsfwMode={nsfwMode}
      />

      <MangaDetailPage
        manga={manga}
        organization={organization}
        user={user}
        logged={logged}
        nsfwMode={nsfwMode}
      />

      <Footer
        organization={organization}
        onNavigate={(page) => {
          if (page === 'home') navigateTo(nsfwMode ? '/red' : '/');
          else if (page === 'explore') navigateTo('/scans');
        }}
      />
    </div>
  );
};

export default MangaDetailPageContainer;

