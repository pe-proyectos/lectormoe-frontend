import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import SubscriptionPage from './SubscriptionPage';

interface SubscriptionPageContainerProps {
  // Required props
  organization: any;
  
  // Optional props
  user?: any;
  logged?: boolean;
  paypalClientId?: string;
}

const SubscriptionPageContainer: React.FC<SubscriptionPageContainerProps> = ({ organization, user, logged, paypalClientId }) => {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const handleGoToSub = () => {
    window.location.href = `/${organization?.slug}/subscriptions`;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar 
        onOpenRegister={() => navigateTo(`/${organization?.slug}/register`)}
        onOpenLogin={() => navigateTo(`/${organization?.slug}/login`)}
        onGoHome={() => navigateTo(`/${organization?.slug}`)} 
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo(`/${organization?.slug}/search`)}
        onGoSubscriptions={handleGoToSub}
        activeView="scan"
        user={user}
        logged={logged}
        activeScan={organization}
        organization={organization}
      />

      <SubscriptionPage 
        organization={organization}
        user={user}
        logged={logged}
        paypalClientId={paypalClientId}
      />

      <Footer 
        organization={organization}
        onNavigate={(page) => {
          if (page === 'explore') navigateTo('/scans');
          else if (page === 'home') navigateTo('/');
        }} 
      />
    </div>
  );
};

export default SubscriptionPageContainer;

