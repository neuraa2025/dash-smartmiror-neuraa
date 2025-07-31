import React, { useState, type ReactNode } from 'react';
import { type SelectedOutfit } from '../types/outfit';
import { SelectedOutfitsContext } from '../context/SelectedOutfitsContext';

interface SelectedOutfitsProviderProps {
  children: ReactNode;
}

export const SelectedOutfitsProvider: React.FC<SelectedOutfitsProviderProps> = ({ children }) => {
  const [selectedOutfits, setSelectedOutfits] = useState<SelectedOutfit[]>([]);

  const addOutfit = (outfit: SelectedOutfit) => {
    setSelectedOutfits(prev => [...prev, outfit]);
  };

  const removeOutfit = (outfitId: number) => {
    setSelectedOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
  };

  const clearOutfits = () => {
    setSelectedOutfits([]);
  };

  const isSelected = (outfitId: number): boolean => {
    return selectedOutfits.some(outfit => outfit.id === outfitId);
  };

  const toggleOutfit = (outfit: SelectedOutfit) => {
    if (isSelected(outfit.id)) {
      removeOutfit(outfit.id);
    } else {
      addOutfit(outfit);
    }
  };

  const value = {
    selectedOutfits,
    addOutfit,
    removeOutfit,
    clearOutfits,
    isSelected,
    toggleOutfit,
  };

  return (
    <SelectedOutfitsContext.Provider value={value}>
      {children}
    </SelectedOutfitsContext.Provider>
  );
};
