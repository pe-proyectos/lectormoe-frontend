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
}

const ProfilePageContainer: React.FC<ProfilePageContainerProps> = ({ user, logged, organization, profileSlug, isOwner }) => {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        onOpenRegister={() => navigateTo('/register')}
        onOpenLogin={() => navigateTo('/login')}
        onGoHome={() => navigateTo('/')}
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo(organization?.slug ? `/${organization.slug}/search` : '/search')}
        activeView="profile"
        user={user}
        logged={logged}
        organization={organization}
      />

      <ProfilePageNew
        user={user}
        logged={logged}
        organization={organization}
        profileSlug={profileSlug}
        isOwner={isOwner}
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
