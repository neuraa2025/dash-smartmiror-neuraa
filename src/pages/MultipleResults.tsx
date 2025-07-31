import { useState, useEffect, useCallback, type FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/Images/smart_miror_logo.png"; // Adjust this path to your logo

import TryMoreOutfitModal from "../components/TryMoreOutfitModal";
import "../styles/ai-suggestion-results.css"; // Use same styles as AI suggestions

interface Outfit {
  id: number;
  name: string;
  imageUrl: string;
  description?: string;
  clothType: string;
}

interface TryOnResult {
  id: number;
  outfitId: number;
  resultImageUrl: string;
  status: 'processing' | 'completed' | 'failed';
  processedAt?: string;
  outfit: Outfit;
}

interface LocationState {
  batchId: string;
  selectedOutfits: Outfit[];
  capturedImage: string;
}

interface BatchStatus {
  batchId: string;
  totalOutfits: number;
  completedCount: number;
  failedCount: number;
  results: TryOnResult[];
  isComplete: boolean;
}

const MultipleResults: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState;

  const [batchStatus, setBatchStatus] = useState<BatchStatus>({
    batchId: '',
    totalOutfits: 0,
    completedCount: 0,
    failedCount: 0,
    results: [],
    isComplete: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTryMoreModal, setShowTryMoreModal] = useState(false);

  // Poll for batch results
  const pollBatchResults = useCallback(async () => {
    if (!locationState?.batchId) return;

    try {
      const response = await axios.get(`/api/tryon/batch-status/${locationState.batchId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setBatchStatus({
          batchId: data.batchId,
          totalOutfits: data.totalOutfits,
          completedCount: data.totalProcessed,
          failedCount: data.results.filter((r: TryOnResult) => r.status === 'failed').length,
          results: data.results,
          isComplete: data.isComplete
        });
        
        if (data.isComplete) {
          console.log('✅ Multiple selection batch completed');
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error polling batch results:', err);
      setError('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [locationState]);

  useEffect(() => {
    if (!locationState) {
      navigate('/home');
      return;
    }

    setBatchStatus(prev => ({
      ...prev,
      batchId: locationState.batchId,
      totalOutfits: locationState.selectedOutfits.length
    }));

    pollBatchResults();
  }, [locationState, navigate, pollBatchResults]);

  useEffect(() => {
    if (!batchStatus.isComplete && locationState?.batchId) {
      const interval = setInterval(pollBatchResults, 2000);
      return () => clearInterval(interval);
    }
  }, [batchStatus.isComplete, locationState, pollBatchResults]);

  // const getCompletedResults = () => {
  //   return batchStatus.results.filter(result => result.status === 'completed');
  // };

  if (!locationState) {
    return (
      <div className="ai-suggestion-container">
        <div className="error-screen">
          <h2>❌ Error</h2>
          <p>Invalid session. Please go back and try again.</p>
          <button onClick={() => navigate('/home')} className="back-button">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading && batchStatus.results.length === 0) {
    return (
      <div className="ai-suggestion-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>🎯 Processing Your Selected Outfits</h2>
          <p>Please wait while we generate your try-on results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-suggestion-container">
      {/* Header */}
      <div className="header">
               <img src={logo} alt="Logo" className="logo" onClick={() => navigate("/home")}/>

        <h1>🎯 Multiple Selection Results</h1>
        <div className="result-counter">
          {batchStatus.results.length} of {batchStatus.totalOutfits} {batchStatus.isComplete ? 'completed' : 'processing...'}
        </div>
      </div>

      {error && (
        <div className="error-screen">
          <h2>❌ Error</h2>
          <p>{error}</p>
        </div>
      )}

      {/* Main Content - Progressive Cards */}
      <div className="cards-container">
        {/* Original Photo Card */}
        <div className="original-card">
          <h3>Your Photo</h3>
          <div className="card-frame">
            <img 
              src={locationState.capturedImage} 
              alt="Your captured photo" 
              className="original-photo"
            />
          </div>
        </div>

        {/* Multiple Selection Cards - appear one by one */}
        {batchStatus.results.map((result, index) => (
          <div key={result.id} className="suggestion-card">
            <div className="card-header">
              <span className="card-number">#{index + 1}</span>
              <h3>{result.outfit.name}</h3>
              <span className={`status-badge ${result.status}`}>
                {result.status === 'completed' ? '✅' : result.status === 'failed' ? '❌' : '⏳'}
              </span>
            </div>
            
            <div className="card-content">
              <div className="card-frame">
                {result.status === 'completed' ? (
                  <img 
                    src={result.resultImageUrl} 
                    alt={`Try-on result for ${result.outfit.name}`} 
                    className="result-photo"
                  />
                ) : result.status === 'failed' ? (
                  <div className="failed-result">
                    <p>❌ Processing Failed</p>
                    <small>Unable to process this outfit</small>
                  </div>
                ) : (
                  <div className="processing-result">
                    <div className="loading-spinner-small"></div>
                    <p>⏳ Processing...</p>
                  </div>
                )}
              </div>
              
              <div className="outfit-info">
                <p>{result.outfit.description}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Cards for remaining outfits */}
        {!batchStatus.isComplete && locationState.selectedOutfits.length > batchStatus.results.length && 
          locationState.selectedOutfits.slice(batchStatus.results.length).map((outfit, index) => (
          <div key={`loading-${outfit.id}`} className="suggestion-card loading-card">
            <div className="card-header">
              <span className="card-number">#{batchStatus.results.length + index + 1}</span>
              <h3>{outfit.name}</h3>
              <span className="status-badge processing">⏳</span>
            </div>
            
            <div className="card-content">
              <div className="card-frame">
                <div className="waiting-result">
                  <div className="loading-spinner-small"></div>
                  <p>Waiting for processing...</p>
                </div>
              </div>
              
              <div className="outfit-info">
                <p>{outfit.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {batchStatus.isComplete && (
        <div className="completion-footer">
          <h3>🎉 All Selected Outfits Complete!</h3>
          <p>Successfully processed {batchStatus.results.filter(r => r.status === 'completed').length} out of {batchStatus.totalOutfits} outfits!</p>
          
          <div className="mt-6">
            <button
              onClick={() => setShowTryMoreModal(true)}
              className="px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)'
              }}
            >
              👗 Try More Outfits
            </button>
          </div>
        </div>
      )}
      
      {/* Try More Outfit Modal */}
      <TryMoreOutfitModal
        isOpen={showTryMoreModal}
        onClose={() => setShowTryMoreModal(false)}
        capturedImage={locationState?.capturedImage || ''}
      />
    </div>
  );
};

export default MultipleResults;
