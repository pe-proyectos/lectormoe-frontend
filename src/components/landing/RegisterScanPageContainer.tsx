import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import RegisterScanPage from './RegisterScanPage';

interface RegisterScanPageContainerProps {
  user?: any;
  logged?: boolean;
  language?: string;
  organization?: any;
  organizationSlug?: string;
}

const RegisterScanPageContainer: React.FC<RegisterScanPageContainerProps> = ({
  user,
  logged,
  language,
  organization,
  organizationSlug,
}) => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar
        user={user}
        logged={logged || false}
        language={language || 'es'}
        organization={organization}
        organizationSlug={organizationSlug}
        onLogin={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/login` : '/login';
        }}
        onRegister={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/register` : '/register';
        }}
        onProfile={() => {
          if (user?.slug) {
            window.location.href = `/profile/${user.slug}`;
          }
        }}
        onSettings={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/settings` : '/settings';
        }}
        onLogout={() => {
          window.location.href = '/logout';
        }}
        onHome={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}` : '/';
        }}
        onSearch={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/search` : '/search';
        }}
        onSubscriptions={() => {
          if (organizationSlug) {
            window.location.href = `/${organizationSlug}/subscriptions`;
          }
        }}
      />
      <div className="flex-1">
        <RegisterScanPage />
      </div>
      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
      />
    </div>
  );
};

export default RegisterScanPageContainer;

