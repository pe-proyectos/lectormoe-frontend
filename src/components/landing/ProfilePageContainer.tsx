import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ProfilePageNew from './ProfilePageNew';

interface ProfilePageContainerProps {
  user?: any;
  logged?: boolean;
  organizationSlug?: string;
  userPermissions?: any;
}

const ProfilePageContainer: React.FC<ProfilePageContainerProps> = ({ user, logged, organizationSlug, userPermissions }) => {
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
        onGoSearch={() => navigateTo(organizationSlug ? `/${organizationSlug}/search` : '/search')}
        activeView="profile"
        user={user}
        logged={logged}
        initialUser={user}
        initialLogged={logged}
        userPermissions={userPermissions}
      />
      
      <ProfilePageNew 
        user={user}
        logged={logged}
        organizationSlug={organizationSlug}
        userPermissions={userPermissions || user?.permissions}
      />

      <Footer 
        organizationSlug={organizationSlug}
        onNavigate={(page) => {
          if (page === 'explore') navigateTo('/scans');
          else if (page === 'home') navigateTo('/');
        }} 
      />
    </div>
  );
};

export default ProfilePageContainer;

