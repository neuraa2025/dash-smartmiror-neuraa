// Device detection utilities

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth <= 768 
    || 'ontouchstart' in window;
};

export const isTabletDevice = (): boolean => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktopDevice = (): boolean => {
  return window.innerWidth > 1024;
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};

// Camera utilities
export const supportsCameraAPI = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const shouldUseNativeCamera = (): boolean => {
  // Force web camera for desktop browsers regardless of device detection
  if (window.innerWidth > 1024) {
    return false;
  }
  return isMobileDevice() && 'capture' in document.createElement('input');
};

// Image utilities
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Download utilities
export const downloadImage = (imageUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Share utilities
export const shareImage = async (imageUrl: string, title: string = 'Smart Mirror Try-On') => {
  if (navigator.share) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'tryon-result.jpg', { type: 'image/jpeg' });
      
      await navigator.share({
        title,
        files: [file]
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copy URL
      fallbackShare(imageUrl);
    }
  } else {
    fallbackShare(imageUrl);
  }
};

const fallbackShare = (imageUrl: string) => {
  // Copy to clipboard as fallback
  navigator.clipboard.writeText(imageUrl).then(() => {
    alert('Image URL copied to clipboard!');
  }).catch(() => {
    // Show share options modal
    showShareModal(imageUrl);
  });
};

const showShareModal = (imageUrl: string) => {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;">
      <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
        <h3>Share this image</h3>
        <div style="margin: 15px 0;">
          <a href="mailto:?subject=Check out my try-on&body=${encodeURIComponent(imageUrl)}" style="display: inline-block; margin: 5px; padding: 10px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">📧 Email</a>
          <a href="https://wa.me/?text=${encodeURIComponent(imageUrl)}" target="_blank" style="display: inline-block; margin: 5px; padding: 10px; background: #25d366; color: white; text-decoration: none; border-radius: 5px;">📱 WhatsApp</a>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};
