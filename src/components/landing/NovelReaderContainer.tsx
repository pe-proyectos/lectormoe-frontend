import React, { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NovelReader from './NovelReader';
import { callAPI } from '../../util/callApi';

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

  // Registrar vista del capítulo y del manga (las novelas nunca lo hacían, por
  // eso el contador quedaba en 0). Fire-and-forget, una sola vez.
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current || !mangaSlug || chapter?.number == null) return;
    trackedRef.current = true;
    callAPI(`/api/views/manga-custom/${mangaSlug}/chapter/${chapter.number}`, { method: 'POST' }).catch(() => {});
    callAPI(`/api/views/manga-custom/${mangaSlug}`, { method: 'POST' }).catch(() => {});
    // Progreso de lectura (solo logueado): guardar página 1 al abrir.
    if (logged && user) {
      callAPI(`/api/user-chapter-history/manga-custom/${mangaSlug}/chapter/${chapter.number}/pages/1`, { method: 'POST' }).catch(() => {});
    }
  }, [mangaSlug, chapter?.number, logged, user]);

  // Marcar como leído al llegar al final del texto (una sola vez).
  const finishedRef = useRef(false);
  useEffect(() => {
    if (!logged || !user || !mangaSlug || chapter?.number == null) return;
    const markFinished = () => {
      if (finishedRef.current) return;
      const scrolled = window.innerHeight + window.scrollY;
      if (scrolled >= document.body.offsetHeight - 200) {
        finishedRef.current = true;
        callAPI(`/api/user-chapter-history/manga-custom/${mangaSlug}/chapter/${chapter.number}`, { method: 'GET' }).catch(() => {});
        window.removeEventListener('scroll', markFinished);
      }
    };
    window.addEventListener('scroll', markFinished, { passive: true });
    return () => window.removeEventListener('scroll', markFinished);
  }, [mangaSlug, chapter?.number, logged, user]);

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
        mangaSlug={mangaSlug}
        chapterUrlPattern={chapterUrlPattern}
        user={user}
        logged={logged}
        organization={organization}
        organizationSlug={organization?.slug}
      />

      <Footer organization={organization} onNavigate={(p) => {
        if (p === 'home') window.location.href = nsfwMode ? '/red' : '/';
        else if (p === 'explore') window.location.href = '/scans';
      }} />
    </div>
  );
};

export default NovelReaderContainer;
