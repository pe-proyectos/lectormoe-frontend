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
  userPermissions?: any;
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
  userPermissions,
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
        activeScan={organization}
        userPermissions={userPermissions}
        isSticky={false}
        activeView="reader"
        onGoHome={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}` : '/';
        }}
        onGoSearch={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/search` : '/search';
        }}
        onGoExplore={() => {
          window.location.href = '/scans';
        }}
        onGoSubscriptions={() => {
          if (organizationSlug) {
            window.location.href = `/${organizationSlug}/subscriptions`;
          }
        }}
        onOpenLogin={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/login` : '/login';
        }}
        onOpenRegister={() => {
          window.location.href = organizationSlug ? `/${organizationSlug}/register` : '/register';
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
            organization={organization}
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

