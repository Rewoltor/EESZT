import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import UploadPage from './components/UploadPage';
import ResultsPage from './components/ResultsPage';
import DetailPage from './components/DetailPage';
import OnboardingPage from './components/OnboardingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function App() {
  // Simple hash-based routing
  const [currentPage, setCurrentPage] = useState('home');
  const [detailTestName, setDetailTestName] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';

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
          {currentPage === 'results' && <ResultsPage />}
          {currentPage === 'detail' && <DetailPage testName={detailTestName} />}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
