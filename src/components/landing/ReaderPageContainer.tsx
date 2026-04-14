import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NSFWAgeModal from './NSFWAgeModal';
import { isNSFWContent, hasAgeVerification } from '../../util/nsfw';

interface ReaderPageContainerProps {
  // Required props
  language: string;
  manga: any;
  chapter: any;
  chapterNumber: string | number;
  logged: boolean;
  user: any;
  organization: any;

  // Optional props
  organizationSlug?: string;
  hasAccess?: boolean;
  nsfwMode?: boolean;
  prevChapterUrl?: string | null;
  nextChapterUrl?: string | null;
  mangaUrl?: string | null;
}

const ReaderPageContainer: React.FC<ReaderPageContainerProps> = ({
  language,
  manga,
  chapter,
  chapterNumber,
  logged,
  user,
  organization,
  organizationSlug,
  hasAccess = true,
  nsfwMode = false,
  prevChapterUrl,
  nextChapterUrl,
  mangaUrl,
}) => {
  const [Reader, setReader] = useState<any>(null);
  const [showNSFWModal, setShowNSFWModal] = useState(false);

  useEffect(() => {
    // Cargar el Reader solo en el cliente
    import('../Reader').then((module) => {
      setReader(() => module.Reader);
    });
  }, []);

  // Check if NSFW content and show age verification modal
  useEffect(() => {
    const mangaIsNSFW = isNSFWContent(manga) || organization?.isNSFW === true;
    if (mangaIsNSFW && !hasAgeVerification()) {
      setShowNSFWModal(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* NSFW Age Verification Modal */}
      {showNSFWModal && (
        <NSFWAgeModal onConfirm={() => setShowNSFWModal(false)} />
      )}

      <Navbar
        user={user}
        logged={logged || false}
        activeScan={organization}
        organization={organization}
        isSticky={false}
        activeView="reader"
        nsfwMode={nsfwMode}
        onGoHome={() => {
          const prefix = nsfwMode ? `/red/${organization?.slug}` : `/${organization?.slug}`;
          window.location.href = organization?.slug ? prefix : '/';
        }}
        onGoSearch={() => {
          const prefix = nsfwMode ? `/red/${organization?.slug}` : `/${organization?.slug}`;
          window.location.href = organization?.slug ? `${prefix}/search` : '/search';
        }}
        onGoExplore={() => {
          window.location.href = '/scans';
        }}
        onGoSubscriptions={() => {
          if (organization?.slug) {
            window.location.href = `${nsfwMode ? `/red/${organization.slug}` : `/${organization.slug}`}/subscriptions`;
          }
        }}
        onOpenLogin={() => {
          window.location.href = organization?.slug ? `/${organization.slug}/login` : '/login';
        }}
        onOpenRegister={() => {
          window.location.href = organization?.slug ? `/${organization.slug}/register` : '/register';
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
            organization={organization}
            organizationSlug={organizationSlug || organization?.slug}
            hasAccess={hasAccess}
            prevChapterUrl={prevChapterUrl}
            nextChapterUrl={nextChapterUrl}
            mangaUrl={mangaUrl}
          />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
      <Footer 
        organization={organization}
      />
    </div>
  );
};

export default ReaderPageContainer;

