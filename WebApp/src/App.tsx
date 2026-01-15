import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import UploadPage from './components/UploadPage';
import ResultsPage from './components/ResultsPage';
import DetailPage from './components/DetailPage';
import OnboardingPage from './components/OnboardingPage';
import ChoicePage from './components/ChoicePage';
import ChatPage from './components/ChatPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { storage } from './lib/storage';

function App() {
  // Simple hash-based routing
  const [currentPage, setCurrentPage] = useState('home');
  const [detailTestName, setDetailTestName] = useState('');

  useEffect(() => {
    const handleHashChange = async () => {
      let hash = window.location.hash.slice(1) || 'home';

      // Auto-redirect logic: If going to onboarding or upload, check if we have data
      if (hash === 'onboarding' || hash === 'upload') {
        const storedData = await storage.getBloodResults();
        if (storedData && storedData.results && storedData.results.length > 0) {
          // Check if user explicitly wants to start over? 
          // For now, per spec, redirect to choice if data exists.
          // Users can delete data from the choice page or landing page if we add that later.
          window.location.hash = 'choice';
          return; // The hash change will trigger this handler again with 'choice'
        }
      }

      // Check if it's a detail page
      if (hash.startsWith('detail/')) {
        setCurrentPage('detail');
        setDetailTestName(hash.substring(7)); // Everything after 'detail/'
      } else {
        setCurrentPage(hash);
        setDetailTestName('');
      }
    };

    handleHashChange(); // Set initial page
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <ThemeProvider>
      <div className="app flex flex-col" style={{ minHeight: '100vh' }}>
        {currentPage === 'home' && <Header />}
        <main style={{ flex: 1 }}>
          {currentPage === 'home' && <LandingPage />}
          {currentPage === 'onboarding' && <OnboardingPage />}
          {currentPage === 'upload' && <UploadPage />}
          {currentPage === 'choice' && <ChoicePage />}
          {currentPage === 'chat' && <ChatPage />}
          {currentPage === 'results' && <ResultsPage />}
          {currentPage === 'detail' && <DetailPage testName={detailTestName} />}
        </main>
        {currentPage !== 'chat' && <Footer />}
      </div>
    </ThemeProvider>
  );
}

export default App;
