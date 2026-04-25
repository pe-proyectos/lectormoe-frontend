import React from 'react';
import SettingsPage from './SettingsPage';
import Navbar from './Navbar';
import Footer from './Footer';

interface User {
  id: number;
  username: string;
  email: string;
  imageUrl: string | null;
  emailVerified: boolean;
  isPublicProfile: boolean;
  isPrivateHistory: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyCommentsOnOwnedContent?: boolean;
  theme: string;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  isPublic: boolean;
}

interface SettingsPageContainerProps {
  user: User;
  logged: boolean;
  language: string;
  organization?: Organization;
  organizationSlug?: string;
  isStaff?: boolean;
}

const SettingsPageContainer: React.FC<SettingsPageContainerProps> = ({
  user,
  logged,
  language,
  organization,
  organizationSlug,
  isStaff = false
}) => {
  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar
        activeScan={undefined}
        user={user}
        logged={logged}
        activeView="settings"
        onGoHome={() => navigateTo('/')}
        onGoSearch={() => navigateTo('/search')}
        onGoExplore={() => navigateTo('/scans')}
        onGoSubscriptions={organizationSlug ? () => navigateTo(`/${organizationSlug}/subscriptions`) : undefined}
        onOpenLogin={() => navigateTo('/login')}
        onOpenRegister={() => navigateTo('/register')}
      />
      
      <SettingsPage
        user={user}
        language={language}
        organizationSlug={organizationSlug}
        isStaff={isStaff}
      />
      
      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
      />
    </div>
  );
};

export default SettingsPageContainer;

