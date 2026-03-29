import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ProfilePageNew from './ProfilePageNew';

interface ProfilePageContainerProps {
  user?: any;
  logged?: boolean;
  organization?: any;
  profileSlug?: string;
  isOwner?: boolean;
  nsfwMode?: boolean;
}

const ProfilePageContainer: React.FC<ProfilePageContainerProps> = ({ user, logged, organization, profileSlug, isOwner, nsfwMode = false }) => {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const orgPrefix = nsfwMode ? `/red/${organization?.slug}` : `/${organization?.slug}`;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        onOpenRegister={() => navigateTo(organization?.slug ? `${orgPrefix}/register` : '/register')}
        onOpenLogin={() => navigateTo(organization?.slug ? `${orgPrefix}/login` : '/login')}
        onGoHome={() => navigateTo(nsfwMode ? '/red' : '/')}
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo(organization?.slug ? `${orgPrefix}/search` : '/search')}
        activeView="profile"
        user={user}
        logged={logged}
        organization={organization}
        nsfwMode={nsfwMode}
      />

      <ProfilePageNew
        user={user}
        logged={logged}
        organization={organization}
        profileSlug={profileSlug}
        isOwner={isOwner}
        nsfwMode={nsfwMode}
      />

      <Footer
        organization={organization}
        onNavigate={(page) => {
          if (page === 'explore') navigateTo('/scans');
          else if (page === 'home') navigateTo('/');
        }}
      />
    </div>
  );
};

export default ProfilePageContainer;
