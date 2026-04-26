import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NovelReader from './NovelReader';

interface NovelReaderContainerProps {
  manga: any;
  chapter: any;
  organization: any;
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
  type: string;
}

const NovelReaderContainer: React.FC<NovelReaderContainerProps> = ({ manga, chapter, organization, user, logged, nsfwMode = false, type }) => {
  const orgPrefix = nsfwMode ? `/red/${organization?.slug}` : `/${organization?.slug}`;
  const writingsRoot = nsfwMode ? '/red/writings' : '/writings';
  const mangaSlug = manga?.manga?.slug || manga?.slug;
  const mangaUrl = `${writingsRoot}/${organization?.slug}/${type}/${mangaSlug}`;
  const chapterUrlPattern = (n: number) => `${mangaUrl}/chapter/${n}`;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Navbar
        user={user}
        logged={logged || false}
        activeScan={organization}
        organization={organization}
        isSticky={false}
        activeView="reader"
        nsfwMode={nsfwMode}
        onGoHome={() => { window.location.href = organization?.slug ? orgPrefix : '/'; }}
        onGoSearch={() => { window.location.href = organization?.slug ? `${orgPrefix}/search` : '/search'; }}
        onOpenLogin={() => { window.location.href = '/login'; }}
        onOpenRegister={() => { window.location.href = '/register'; }}
        onGoExplore={() => { window.location.href = '/scans'; }}
      />

      <NovelReader
        chapter={chapter}
        mangaTitle={manga?.title || mangaSlug}
        mangaUrl={mangaUrl}
        chapterUrlPattern={chapterUrlPattern}
      />

      <Footer organization={organization} onNavigate={(p) => {
        if (p === 'home') window.location.href = nsfwMode ? '/red' : '/';
        else if (p === 'explore') window.location.href = '/scans';
      }} />
    </div>
  );
};

export default NovelReaderContainer;
