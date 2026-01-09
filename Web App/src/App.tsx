import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import UploadPage from './components/UploadPage';
import ResultsPage from './components/ResultsPage';
import DetailPage from './components/DetailPage';
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
    <div className="app">
      {currentPage === 'home' && <LandingPage />}
      {currentPage === 'upload' && <UploadPage />}
      {currentPage === 'results' && <ResultsPage />}
      {currentPage === 'detail' && <DetailPage testName={detailTestName} />}
    </div>
  );
}

export default App;
