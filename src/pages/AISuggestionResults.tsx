import { useState, useEffect, type FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/Images/smart_miror_logo.png"; // Adjust this path to your logo

import TryMoreOutfitModal from "../components/TryMoreOutfitModal";
import "../styles/ai-suggestion-results.css";

interface Outfit {
  id: number;
  name: string;
  imageUrl: string;
  description?: string;
  clothType: string;
  price: number;
}

interface TryOnResult {
  outfitId: number;
  outfit: Outfit;
  resultImageUrl: string;
  status: "processing" | "completed" | "failed";
  error?: string;
}

interface CategoryData {
  id?: number;
  name: string;
  displayName: string;
}

interface GenderData {
  name: string;
  displayName: string;
}

interface LocationState {
  capturedImage: string;
  categoryData: CategoryData;
  genderData: GenderData;
}

const AISuggestionResults: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState;

  const [results, setResults] = useState<TryOnResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [totalOutfits, setTotalOutfits] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showTryMoreModal, setShowTryMoreModal] = useState(false);

  useEffect(() => {
    if (!locationState?.capturedImage) {
      navigate("/");
      return;
    }

    const startAISuggestions = async () => {
      try {
        setLoading(true);
        console.log("🤖 Starting AI suggestions...");

        const response = await axios.post("/api/tryon/ai-suggestion", {
          capturedImage: locationState.capturedImage,
          gender: locationState.genderData.name,
          category: locationState.categoryData.name,
        });

        if (response.data.success && response.data.batchId) {
          setBatchId(response.data.batchId);
          setTotalOutfits(response.data.totalOutfits);
          console.log(
            "✅ AI suggestions started, batchId:",
            response.data.batchId
          );
        } else {
          setError(response.data.message || "Failed to start AI suggestions");
        }
      } catch (err) {
        console.error("❌ Error starting AI suggestions:", err);
        setError("Failed to start AI suggestions");
      } finally {
        setLoading(false);
      }
    };

    startAISuggestions();
  }, [locationState, navigate]);

  // Poll for results
  useEffect(() => {
    if (!batchId || isComplete) return;

    const pollResults = async () => {
      try {
        const response = await axios.get(
          `/api/tryon/ai-suggestion-status/${batchId}`
        );

        if (response.data.success) {
          const { results: newResults, isComplete: complete } =
            response.data.data;
          setResults(newResults);
          setIsComplete(complete);

          if (complete) {
            console.log("✅ AI suggestions completed");
          }
        }
      } catch (err) {
        console.error("❌ Error polling results:", err);
      }
    };

    const interval = setInterval(pollResults, 2000); // Poll every 2 seconds
    pollResults(); // Initial call

    return () => clearInterval(interval);
  }, [batchId, isComplete]);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="ai-suggestion-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>🤖 AI is curating your perfect outfits...</h2>
          <p>Please wait while we process your suggestions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-suggestion-container">
        <div className="error-screen">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-suggestion-container">
      {/* Header */}
      <div className="header">
        <img
          src={logo}
          alt="Logo"
          className="logo"
          onClick={() => navigate("/home")}
        />

        <h1>🤖 AI Suggestions for {locationState.categoryData.displayName}</h1>
        <div className="result-counter">
          {results.length} of {totalOutfits}{" "}
          {isComplete ? "completed" : "processing..."}
        </div>
      </div>

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

        {/* AI Suggestion Cards - appear one by one */}
        {results.map((result, index) => (
          <div key={result.outfitId} className="suggestion-card">
            <div className="card-header">
              <span className="card-number">#{index + 1}</span>
              <h3>{result.outfit.name}</h3>
              <span className={`status-badge ${result.status}`}>
                {result.status === "completed"
                  ? "✅"
                  : result.status === "failed"
                  ? "❌"
                  : "⏳"}
              </span>
            </div>

            <div className="card-content">
              <div className="card-frame">
                {result.status === "completed" ? (
                  <img
                    src={result.resultImageUrl}
                    alt={`Try-on result for ${result.outfit.name}`}
                    className="result-photo"
                  />
                ) : result.status === "failed" ? (
                  <div className="failed-result">
                    <p>❌ Processing Failed</p>
                    <small>{result.error}</small>
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
                <span className="price">${result.outfit.price}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Cards for remaining outfits */}
        {!isComplete &&
          Array.from({ length: totalOutfits - results.length }).map(
            (_, index) => (
              <div
                key={`loading-${index}`}
                className="suggestion-card loading-card"
              >
                <div className="card-header">
                  <span className="card-number">
                    #{results.length + index + 1}
                  </span>
                  <h3>Loading...</h3>
                  <span className="status-badge processing">⏳</span>
                </div>

                <div className="card-content">
                  <div className="card-frame">
                    <div className="waiting-result">
                      <div className="loading-spinner-small"></div>
                      <p>Waiting for AI processing...</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
      </div>

      {/* Footer */}
      {isComplete && (
        <div className="completion-footer">
          <h3>🎉 All AI Suggestions Complete!</h3>
          <p>
            Found {results.filter((r) => r.status === "completed").length}{" "}
            perfect matches for you!
          </p>

          <div className="mt-6">
            <button
              onClick={() => setShowTryMoreModal(true)}
              className="px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "var(--accent-primary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-light)",
              }}
            >
              👗 Try More Outfits
            </button>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="scroll-to-top">
          ↑
        </button>
      )}

      {/* Try More Outfit Modal */}
      <TryMoreOutfitModal
        isOpen={showTryMoreModal}
        onClose={() => setShowTryMoreModal(false)}
        capturedImage={locationState?.capturedImage || ""}
        currentGender={locationState?.genderData?.name}
      />
    </div>
  );
};

export default AISuggestionResults;
