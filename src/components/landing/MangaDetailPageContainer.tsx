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
  organizationSlug?: string;
  user?: any;
  logged?: boolean;
  language?: string;
  userPermissions?: any;
}

const MangaDetailPageContainer: React.FC<MangaDetailPageContainerProps> = ({ 
  manga,
  organization,
  organizationSlug,
  user,
  logged,
  language,
  userPermissions
}) => {
  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar
        activeScan={organization ? {
          name: organization.name,
          slug: organization.slug,
          logo: organization.logoUrl || '',
        } : undefined}
        user={user}
        logged={logged}
        userPermissions={userPermissions}
        onGoHome={() => navigateTo(organizationSlug ? `/${organizationSlug}` : '/')}
        onGoSearch={() => navigateTo(organizationSlug ? `/${organizationSlug}/search` : '/search')}
        onGoSubscriptions={() => navigateTo(organizationSlug ? `/${organizationSlug}/subscriptions` : '/')}
        onOpenLogin={() => navigateTo(organizationSlug ? `/${organizationSlug}/login` : '/login')}
        onOpenRegister={() => navigateTo(organizationSlug ? `/${organizationSlug}/register` : '/register')}
        onGoExplore={() => navigateTo('/scans')}
        activeView="manga"
      />
      
      <MangaDetailPage 
        manga={manga} 
        organizationSlug={organizationSlug}
        user={user}
        logged={logged}
      />
      
      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
      />
    </div>
  );
};

export default MangaDetailPageContainer;

