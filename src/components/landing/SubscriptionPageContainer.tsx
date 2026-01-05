import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import SubscriptionPage from './SubscriptionPage';

interface SubscriptionPageContainerProps {
  organization: any;
  organizationSlug: string;
  user?: any;
  logged?: boolean;
  paypalClientId?: string;
}

const SubscriptionPageContainer: React.FC<SubscriptionPageContainerProps> = ({ organization, organizationSlug, user, logged, paypalClientId }) => {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const handleGoToSub = () => {
    window.location.href = `/${organizationSlug}/subscriptions`;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar 
        onOpenRegister={() => navigateTo(`/${organizationSlug}/register`)}
        onOpenLogin={() => navigateTo(`/${organizationSlug}/login`)}
        onGoHome={() => navigateTo(`/${organizationSlug}`)} 
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo(`/${organizationSlug}/search`)}
        onGoSubscriptions={handleGoToSub}
        activeView="scan"
        user={user}
        logged={logged}
        activeScan={organization}
      />

      <SubscriptionPage 
        organization={organization}
        organizationSlug={organizationSlug}
        user={user}
        logged={logged}
        paypalClientId={paypalClientId}
      />

      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
        onNavigate={(page) => {
          if (page === 'explore') navigateTo('/scans');
          else if (page === 'home') navigateTo('/');
        }} 
      />
    </div>
  );
};

export default SubscriptionPageContainer;

