import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface ReaderPageContainerProps {
  language: string;
  manga: any;
  chapter: any;
  chapterNumber: string | number;
  logged: boolean;
  user: any;
  organizationSlug: string;
  organization?: any;
  hasAccess?: boolean;
}

const ReaderPageContainer: React.FC<ReaderPageContainerProps> = ({
  language,
  manga,
  chapter,
  chapterNumber,
  logged,
  user,
  organizationSlug,
  organization,
  hasAccess = true,
}) => {
  const [Reader, setReader] = useState<any>(null);

  useEffect(() => {
    // Cargar el Reader solo en el cliente
    import('../Reader').then((module) => {
      setReader(() => module.Reader);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar
        user={user}
        logged={logged || false}
        language={language || 'es'}
        organization={organization}
        organizationSlug={organizationSlug}
        activeScan={organization}
        isSticky={false}
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
        onGoExplore={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/search` : '/search';
        }}
        onGoSubscriptions={() => {
          if (organizationSlug) {
            window.location.href = `/${organizationSlug}/subscriptions`;
          }
        }}
      />
      <div className="flex-1">
        {Reader ? (
          <Reader
            language={language}
            manga={manga}
            chapter={chapter}
            chapterNumber={chapterNumber}
            logged={logged}
            user={user}
            organizationSlug={organizationSlug}
            hasAccess={hasAccess}
          />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
      />
    </div>
  );
};

export default ReaderPageContainer;

