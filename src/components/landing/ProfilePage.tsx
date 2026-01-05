import React, { useState } from 'react';
import Navbar from './Navbar';
import UnifiedProfileView from './UnifiedProfileView';
import Footer from './Footer';
import RegistrationModal from './RegistrationModal';
import UserRegistrationModal from './UserRegistrationModal';
import LoginModal from './LoginModal';

interface ProfilePageProps {
  user: any;
  logged: boolean;
  language: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, logged, language }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserRegistrationModalOpen, setIsUserRegistrationModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openRegistration = () => navigateTo('/register');
  const openUserRegistration = () => navigateTo('/register');
  const openLogin = () => navigateTo('/login');

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Navbar 
        onOpenRegister={openUserRegistration}
        onOpenLogin={openLogin}
        onGoHome={() => navigateTo('/')} 
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo('/search')}
        activeView="profile"
        user={user}
        logged={logged}
      />
      
      <main className="flex-grow pt-24 md:pt-32">
        <UnifiedProfileView 
          user={user} 
          language={language}
        />
      </main>

      <Footer />
      <RegistrationModal isOpen={isModalOpen} onClose={closeRegistration} />
      <UserRegistrationModal isOpen={isUserRegistrationModalOpen} onClose={closeUserRegistration} />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLogin} />
    </div>
  );
};

export default ProfilePage;

