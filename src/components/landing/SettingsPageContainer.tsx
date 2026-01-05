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
}

const SettingsPageContainer: React.FC<SettingsPageContainerProps> = ({ 
  user, 
  logged, 
  language, 
  organization,
  organizationSlug 
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
        initialUser={user}
        initialLogged={logged}
        onGoHome={() => navigateTo('/')}
        onGoSearch={() => navigateTo(organizationSlug ? `/${organizationSlug}/search` : '/search')}
        onGoSubscriptions={() => navigateTo(organizationSlug ? `/${organizationSlug}/subscriptions` : '/')}
        onOpenLogin={() => navigateTo(organizationSlug ? `/${organizationSlug}/login` : '/login')}
        onOpenRegister={() => navigateTo(organizationSlug ? `/${organizationSlug}/register` : '/register')}
      />
      
      <SettingsPage 
        user={user} 
        language={language}
        organizationSlug={organizationSlug}
      />
      
      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
      />
    </div>
  );
};

export default SettingsPageContainer;

