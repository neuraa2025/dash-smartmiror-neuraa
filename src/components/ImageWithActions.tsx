import React, { useState } from "react";
import { downloadImage, shareImage } from "../utils/deviceUtils";

interface ImageWithActionsProps {
  src: string;
  alt: string;
  className?: string;
  showActions?: boolean;
  filename?: string;
}

const ImageWithActions: React.FC<ImageWithActionsProps> = ({
  src,
  alt,
  className = "",
  showActions = true,
  filename = "smart-mirror-tryon.jpg",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  // No longer need image orientation check since we use object-contain

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadImage(src, filename);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareImage(src, "Smart Mirror Try-On Result");
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullscreen(true);
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
  };

  return (
    <>
      <div
        className={`relative w-full h-full overflow-hidden rounded-lg ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain transition-transform duration-300 hover:scale-105`}
        />

        {showActions && isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-4 transition-opacity duration-300">
            <button
              onClick={handleView}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-opacity-30 transition-all duration-200 hover:scale-110"
              title="View Fullscreen"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>

            <button
              onClick={handleDownload}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-opacity-30 transition-all duration-200 hover:scale-110"
              title="Download PNG"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>

            <button
              onClick={handleShare}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-opacity-30 transition-all duration-200 hover:scale-110"
              title="Share JPEG"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-screen-lg max-h-screen-lg">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-opacity-30 transition-all duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageWithActions;
