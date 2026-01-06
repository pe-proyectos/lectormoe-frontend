import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ExplorePage from './ExplorePage';

interface ExplorePageContainerProps {
  organization?: any;
  organizationSlug?: string;
  user?: any;
  logged?: boolean;
  userPermissions?: any;
}

const ExplorePageContainer: React.FC<ExplorePageContainerProps> = ({ organization, organizationSlug, user, logged, userPermissions }) => {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const handleGoToSub = () => {
    if (organizationSlug) {
      window.location.href = `/${organizationSlug}/subscriptions`;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar 
        onOpenRegister={() => navigateTo(organizationSlug ? `/${organizationSlug}/register` : '/register')}
        onOpenLogin={() => navigateTo(organizationSlug ? `/${organizationSlug}/login` : '/login')}
        onGoHome={() => navigateTo(organizationSlug ? `/${organizationSlug}` : '/')} 
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo(organizationSlug ? `/${organizationSlug}/search` : '/search')}
        onGoSubscriptions={handleGoToSub}
        activeView="search"
        user={user}
        logged={logged}
        activeScan={organization}
        userPermissions={userPermissions}
      />

      <ExplorePage 
        organization={organization}
        organizationSlug={organizationSlug}
        user={user}
        logged={logged}
        userPermissions={userPermissions}
      />

      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
        onNavigate={(page) => {
          if (page === 'explore') navigateTo('/scans');
          else if (page === 'home') navigateTo('/');
        }} 
      />
    </div>
  );
};

export default ExplorePageContainer;

