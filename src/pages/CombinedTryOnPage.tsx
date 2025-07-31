import { useState, useEffect, useCallback, useRef, type FC } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/combined-tryon.css";
import logo from "../assets/Images/smart_miror_logo.png"; // Adjust this path to your logo

interface Outfit {
  id: number;
  name: string;
  imageUrl: string;
  description?: string;
  clothType: string;
  price: number;
}

interface CategoryData {
  id: number;
  name: string;
  displayName: string;
  bannerImage: string;
}

interface GenderData {
  name: string;
  displayName: string;
}

interface TryOnResult {
  outfitId: number;
  resultImageUrl: string;
  status: string;
  outfit: Outfit;
}

interface ApiResponse {
  success: boolean;
  data: {
    outfits: Outfit[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    category: CategoryData;
    gender: GenderData;
  };
}

type SelectionMode = "specific" | "ai-suggestion" | "multiple" | null;

const CombinedTryOnPage: FC = () => {
  const { gender, category } = useParams<{
    gender: string;
    category: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    capturedImage?: string;
    skipCamera?: boolean;
    forceCamera?: boolean;
    resetImage?: boolean;
  } | null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Outfit Gallery State
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [genderData, setGenderData] = useState<GenderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Selection State
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<Set<number>>(
    new Set()
  );
  const [showPopup, setShowPopup] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Camera State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true); // Controls camera visibility
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user"); // Front camera by default
  const [cameraInitializing, setCameraInitializing] = useState(false); // Prevent multiple camera starts

  // Try-on State
  const [currentTryOnResult, setCurrentTryOnResult] =
    useState<TryOnResult | null>(null);
  const [loadingOutfitId, setLoadingOutfitId] = useState<number | null>(null);

  // Fetch outfits
  const fetchOutfits = useCallback(
    async (page: number) => {
      if (!gender || !category) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "9",
        });
        const response = await fetch(
          `/api/outfits/${gender}/${category}?${params}`
        );
        const data: ApiResponse = await response.json();
        if (data.success) {
          if (page === 1) {
            setOutfits(data.data.outfits);
          } else {
            setOutfits((prev) => [...prev, ...data.data.outfits]);
          }
          setCategoryData(data.data.category);
          setGenderData(data.data.gender);
          setCurrentPage(data.data.pagination.currentPage);
          setHasNextPage(data.data.pagination.hasNextPage);
          setTotalCount(data.data.pagination.totalCount);
        }
      } catch (error) {
        console.error("Error fetching outfits:", error);
      } finally {
        setLoading(false);
      }
    },
    [gender, category]
  );

  // Cleanup camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraInitializing(false);
  }, [cameraStream]);

  // Start camera with better error handling and fallbacks
  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous camera starts
    if (cameraInitializing || cameraStream) {
      console.log("🔄 Camera already initializing or active, skipping...");
      return;
    }

    setCameraInitializing(true);
    const maxRetries = 3;
    let retryCount = 0;

    const attemptCameraAccess = async (
      constraints: MediaStreamConstraints
    ): Promise<MediaStream> => {
      while (retryCount < maxRetries) {
        try {
          console.log(
            `Camera attempt ${retryCount + 1}/${maxRetries}:`,
            constraints
          );
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log("✅ Camera access successful");
          return stream;
        } catch (error) {
          retryCount++;
          console.error(`❌ Camera attempt ${retryCount} failed:`, error);

          if (retryCount >= maxRetries) {
            throw error;
          }

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      throw new Error("Max retries exceeded");
    };

    try {
      // Try primary constraints first
      const primaryConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
        },
        audio: false,
      };

      let stream: MediaStream;

      try {
        stream = await attemptCameraAccess(primaryConstraints);
      } catch {
        console.warn("Primary constraints failed, trying fallback...");

        // Fallback with minimal constraints
        const fallbackConstraints = {
          video: { facingMode: facingMode },
          audio: false,
        };

        retryCount = 0; // Reset retry count for fallback
        stream = await attemptCameraAccess(fallbackConstraints);
      }

      setCameraStream(stream);

      // Set up video element with better error handling
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((playError) => {
              console.error("Video play error:", playError);
            });
          };
          videoRef.current.onerror = (videoError) => {
            console.error("Video element error:", videoError);
          };
        }
      }, 500); // Increased timeout for better reliability
    } catch (error) {
      console.error("Final camera error:", error);

      // Better error messaging based on error type
      let errorMessage = "Unable to access camera. ";
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage +=
            "Please allow camera permissions and refresh the page.";
        } else if (error.name === "NotFoundError") {
          errorMessage += "No camera found on this device.";
        } else if (error.name === "NotReadableError") {
          errorMessage +=
            "Camera is busy or being used by another application.";
        } else {
          errorMessage += "Please check your camera settings and try again.";
        }
      }

      alert(errorMessage);
      setShowCamera(false);
    } finally {
      setCameraInitializing(false);
    }
  }, [facingMode, cameraInitializing, cameraStream]);

  // Capture photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (facingMode === "user") {
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageDataUrl);
    setShowCamera(false);
    stopCamera();
  };

  // Switch camera
  const switchCamera = async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    stopCamera();
    setFacingMode(newFacing);
    setTimeout(() => {
      if (!cameraInitializing) {
        startCamera();
      }
    }, 300);
  };

  // Try outfit
  const tryOutfit = async (outfit: Outfit) => {
    if (!capturedImage) return;
    setLoadingOutfitId(outfit.id);
    setCurrentTryOnResult(null);
    try {
      const response = await axios.post("/api/tryon/single", {
        capturedImage,
        outfitId: outfit.id,
      });
      if (response.data.success) {
        setCurrentTryOnResult({
          outfitId: outfit.id,
          resultImageUrl: response.data.data.resultImageUrl,
          status: "completed",
          outfit,
        });
      }
    } catch (error) {
      console.error("Error trying outfit:", error);
    } finally {
      setLoadingOutfitId(null);
    }
  };

  // Selection handlers
  const toggleOutfitSelection = (outfitId: number) => {
    console.log("🎯 Toggle outfit selection called:", {
      outfitId,
      selectionMode,
      selectedCount: selectedOutfitIds.size,
    });
    if (selectionMode !== "multiple") {
      console.log("❌ Not in multiple mode, ignoring selection");
      return;
    }
    setSelectedOutfitIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(outfitId)) {
        newSet.delete(outfitId);
        console.log("➖ Removed outfit", outfitId, "New count:", newSet.size);
      } else {
        newSet.add(outfitId);
        console.log("➕ Added outfit", outfitId, "New count:", newSet.size);
      }
      return newSet;
    });
  };

  const handleSelectionModeChoice = (mode: SelectionMode) => {
    console.log("🎯 Selection mode chosen:", mode);
    setHasUserInteracted(true);
    setSelectionMode(mode);
    setShowPopup(false);
    if (mode === "ai-suggestion") {
      navigate("/ai-suggestion-results", {
        state: {
          capturedImage,
          categoryData: categoryData || {
            name: category,
            displayName: category,
          },
          genderData: genderData || { name: gender, displayName: gender },
        },
      });
    } else if (mode === "multiple") {
      setSelectedOutfitIds(new Set());
    }
  };

  const handleMultipleSelection = async () => {
    if (!capturedImage || selectedOutfitIds.size === 0) return;
    const selectedOutfits = outfits.filter((outfit) =>
      selectedOutfitIds.has(outfit.id)
    );
    try {
      const response = await axios.post("/api/tryon/multiple", {
        capturedImage,
        outfitIds: Array.from(selectedOutfitIds),
      });
      if (response.data.success) {
        navigate("/multiple-results", {
          state: {
            batchId: response.data.data.batchId,
            selectedOutfits,
            capturedImage,
          },
        });
      }
    } catch (error) {
      console.error("Error processing multiple outfits:", error);
    }
  };

  // Auto-start camera on mount
  useEffect(() => {
    if (!capturedImage && showCamera && !cameraStream && !cameraInitializing) {
      startCamera();
    }
    // Cleanup function that runs when component unmounts
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage, showCamera, cameraStream, cameraInitializing]); // startCamera excluded to prevent loop

  // Show popup after capture
  useEffect(() => {
    if (capturedImage && !hasUserInteracted && selectionMode === null) {
      const timer = setTimeout(() => setShowPopup(true), 500);
      return () => clearTimeout(timer);
    }
  }, [capturedImage, hasUserInteracted, selectionMode]);

  // Initialize outfits
  useEffect(() => {
    if (gender && category && capturedImage) {
      fetchOutfits(1);
    }
  }, [gender, category, capturedImage, fetchOutfits]);

  // Handle location state
  useEffect(() => {
    if (locationState?.resetImage) {
      setCapturedImage(null);
      setCurrentTryOnResult(null);
      setSelectionMode(null);
      setHasUserInteracted(false);
      setShowCamera(true);
    } else if (locationState?.skipCamera && locationState.capturedImage) {
      setCapturedImage(locationState.capturedImage);
      setShowCamera(false);
    } else if (locationState?.forceCamera) {
      setCapturedImage(null);
      setShowCamera(true);
    }
  }, [locationState]);

  // Infinite scroll
  useEffect(() => {
    if (!capturedImage) return;
    const container = document.querySelector(".outfit-gallery") as HTMLElement;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (
        scrollTop + clientHeight >= scrollHeight - 200 &&
        hasNextPage &&
        !loading
      ) {
        fetchOutfits(currentPage + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [capturedImage, hasNextPage, loading, currentPage, fetchOutfits]);

  return (
    <div className="combined-tryon-container dark-theme">
      {/* Header */}
      <header className="header">
        <img
          src={logo}
          alt="Logo"
          className="logo"
          onClick={() => navigate("/home")}
        />
        <h1 className="title">
          {genderData?.displayName} {categoryData?.displayName}
        </h1>
        <p className="subtitle">
          {selectionMode === "multiple"
            ? `${selectedOutfitIds.size} selected`
            : `${totalCount} available`}
        </p>
      </header>

      {!capturedImage ? (
        /* Camera View */
        <div className="camera-container">
          <div className="camera-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              style={{
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
            <div className="camera-controls">
              <button onClick={switchCamera} className="camera-btn">
                🔄
              </button>
              <button onClick={capturePhoto} className="camera-btn capture">
                📸
              </button>
              <button
                onClick={() => {
                  setShowCamera(false);
                  stopCamera();
                }}
                className="camera-btn"
              >
                ❌
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Split View */
        <div className="split-view">
          {/* Left: Outfit Gallery */}
          <div className="outfit-gallery">
            <div className="outfits-grid">
              {outfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className={`outfit-card ${
                    selectionMode === "multiple" &&
                    selectedOutfitIds.has(outfit.id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                      "🖱️ Click event triggered for outfit",
                      outfit.id
                    );
                    if (selectionMode === "multiple") {
                      toggleOutfitSelection(outfit.id);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                      "👆 Touch event triggered for outfit",
                      outfit.id
                    );
                    if (selectionMode === "multiple") {
                      toggleOutfitSelection(outfit.id);
                    }
                  }}
                  style={{
                    cursor:
                      selectionMode === "multiple" ? "pointer" : "default",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                >
                  <div className="outfit-image">
                    <img
                      src={outfit.imageUrl}
                      alt={outfit.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2QwZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";
                      }}
                    />
                    {selectionMode === "multiple" &&
                      selectedOutfitIds.has(outfit.id) && (
                        <div className="selection-indicator">✓</div>
                      )}
                  </div>
                  <div className="outfit-info">
                    <h3>{outfit.name}</h3>
                    <p>{outfit.description || categoryData?.displayName}</p>
                    {selectionMode === "specific" && (
                      <button
                        className="try-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          tryOutfit(outfit);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          tryOutfit(outfit);
                        }}
                        disabled={loadingOutfitId === outfit.id}
                      >
                        {loadingOutfitId === outfit.id ? "⏳" : "👗"} Try On
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {loading && <div className="loading-more">Loading more...</div>}
            {!hasNextPage && (
              <div className="end-message">🎉 All outfits loaded!</div>
            )}
          </div>

          {/* Right: Captured Image */}
          <div className="image-preview">
            <h3>{currentTryOnResult ? "Try-On Result" : "Your Photo"}</h3>
            <div className="preview-image-container">
              <img
                src={
                  currentTryOnResult
                    ? currentTryOnResult.resultImageUrl
                    : capturedImage
                }
                alt="Preview"
              />
            </div>

            {/* Debug info for tablet troubleshooting */}
            {/* <div style={{ 
              background: "#333", 
              padding: "10px", 
              margin: "10px 0", 
              fontSize: "12px",
              color: "#fff",
              borderRadius: "5px"
            }}>
              Debug Info:<br/>
              Selection Mode: {selectionMode}<br/>
              Selected Count: {selectedOutfitIds.size}<br/>
              Selected IDs: {Array.from(selectedOutfitIds).join(", ")}<br/>
              Show Button: {(selectionMode === "multiple" && selectedOutfitIds.size > 0).toString()}
            </div> */}

            {(() => {
              const shouldShowButton =
                selectionMode === "multiple" && selectedOutfitIds.size > 0;
              console.log("🎮 Proceed button logic:", {
                selectionMode,
                selectedCount: selectedOutfitIds.size,
                shouldShowButton,
                selectedIds: Array.from(selectedOutfitIds),
              });
              return (
                shouldShowButton && (
                  <button
                    className="process-multiple-button"
                    onClick={handleMultipleSelection}
                    style={{
                      display: "block !important",
                      width: "100%",
                      margin: "10px 0",
                      background: "#ff3f6c !important",
                      color: "white !important",
                      border: "2px solid #fff !important",
                      padding: "15px",
                      borderRadius: "20px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      zIndex: 9999,
                      position: "relative",
                    }}
                  >
                    🚀 Process {selectedOutfitIds.size} Outfits
                  </button>
                )
              );
            })()}
            {currentTryOnResult && (
              <div className="outfit-tried">
                <small>Tried: {currentTryOnResult.outfit.name}</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selection Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>How would you like to try outfits?</h3>
            <div className="popup-buttons">
              <button
                className="popup-button"
                onClick={() => handleSelectionModeChoice("specific")}
              >
                <span className="button-icon">🎯</span>
                <span>Try One by One</span>
                <span className="button-desc">
                  Tap 'Try On' for each outfit
                </span>
              </button>
              <button
                className="popup-button"
                onClick={() => handleSelectionModeChoice("ai-suggestion")}
              >
                <span className="button-icon">🤖</span>
                <span>AI Suggestion</span>
                <span className="button-desc">Get personalized picks</span>
              </button>
              <button
                className="popup-button"
                onClick={() => handleSelectionModeChoice("multiple")}
              >
                <span className="button-icon">✅</span>
                <span>Select Multiple</span>
                <span className="button-desc">Choose and process many</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CombinedTryOnPage;
