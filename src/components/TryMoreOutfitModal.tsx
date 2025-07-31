import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TryMoreOutfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  capturedImage: string;
  currentGender?: string;
}

type PoseType = 'same' | 'different';
type OutfitType = 'formal' | 'casual';
type GenderType = 'men' | 'women';

const TryMoreOutfitModal: React.FC<TryMoreOutfitModalProps> = ({
  isOpen,
  onClose,
  capturedImage,
  currentGender = 'men'
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'pose' | 'outfit' | 'gender'>('pose');
  const [selectedPose, setSelectedPose] = useState<PoseType | null>(null);
  const [selectedGender, setSelectedGender] = useState<GenderType>(currentGender as GenderType);

  if (!isOpen) return null;

  const handlePoseSelection = (pose: PoseType) => {
    setSelectedPose(pose);
    if (pose === 'same') {
      setStep('outfit');
    } else {
      setStep('outfit'); // Will open camera after outfit selection
    }
  };

  const handleOutfitSelection = (outfitType: OutfitType) => {
    const categoryMap = {
      'formal': selectedGender === 'men' ? 'suits' : 'dresses',
      'casual': selectedGender === 'men' ? 'casual-shirts' : 'casual-tops'
    };
    
    if (selectedPose === 'same') {
      // Same pose - use current captured image and skip camera
      navigate(`/outfits/${selectedGender}/${categoryMap[outfitType]}`, {
        state: { 
          capturedImage: capturedImage,
          skipCamera: true 
        }
      });
    } else {
      // Different pose - open camera normally (reset image)
      navigate(`/outfits/${selectedGender}/${categoryMap[outfitType]}`, {
        state: { 
          forceCamera: true,
          resetImage: true 
        }
      });
    }
    onClose();
  };

  const renderPoseStep = () => (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-white mb-6">Choose Your Pose</h3>
      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button
          onClick={() => handlePoseSelection('same')}
          className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'var(--bg-card-hover)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div className="text-4xl mb-3">🤳</div>
          <div className="text-lg font-semibold">Same Pose</div>
          <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Keep current photo and try different outfits</div>
        </button>
        
        <button
          onClick={() => handlePoseSelection('different')}
          className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'var(--bg-card-hover)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div className="text-4xl mb-3">📸</div>
          <div className="text-lg font-semibold">Different Pose</div>
          <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Take a new photo with different pose</div>
        </button>
      </div>
    </div>
  );

  const renderOutfitStep = () => (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-white mb-6">Choose Outfit Type</h3>
      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button
          onClick={() => handleOutfitSelection('formal')}
          className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'var(--bg-card-hover)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div className="text-4xl mb-3">👔</div>
          <div className="text-lg font-semibold">Formal</div>
          <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {selectedGender === 'men' ? 'Suits, formal shirts' : 'Dresses, formal wear'}
          </div>
        </button>
        
        <button
          onClick={() => handleOutfitSelection('casual')}
          className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'var(--bg-card-hover)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div className="text-4xl mb-3">👕</div>
          <div className="text-lg font-semibold">Casual</div>
          <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {selectedGender === 'men' ? 'T-shirts, casual wear' : 'Casual tops, everyday wear'}
          </div>
        </button>
      </div>
      
      {/* Gender toggle if needed */}
      <div className="mt-8">
        <p className="text-gray-300 mb-3">Wrong gender? Select:</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setSelectedGender('men')}
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              background: selectedGender === 'men' ? 'var(--accent-secondary)' : 'var(--bg-card)',
              color: selectedGender === 'men' ? 'var(--bg-primary)' : 'var(--text-primary)',
              border: '1px solid var(--border-light)'
            }}
          >
            👨 Men
          </button>
          <button
            onClick={() => setSelectedGender('women')}
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              background: selectedGender === 'women' ? 'var(--accent-secondary)' : 'var(--bg-card)',
              color: selectedGender === 'women' ? 'var(--bg-primary)' : 'var(--text-primary)',
              border: '1px solid var(--border-light)'
            }}
          >
            👩 Women
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-8 max-w-2xl w-full relative" style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-light)'
      }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ✕
        </button>
        
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${step === 'pose' ? 'bg-white' : 'bg-gray-600'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 'outfit' ? 'bg-white' : 'bg-gray-600'}`}></div>
            </div>
          </div>
        </div>

        {step === 'pose' && renderPoseStep()}
        {step === 'outfit' && renderOutfitStep()}
        
        {step === 'outfit' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setStep('pose')}
              className="text-gray-400 hover:text-white underline"
            >
              ← Back to pose selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TryMoreOutfitModal;
