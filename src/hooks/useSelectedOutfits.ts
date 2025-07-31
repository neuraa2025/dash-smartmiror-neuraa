import { useContext } from 'react';
import { SelectedOutfitsContext } from '../context/SelectedOutfitsContext';

export const useSelectedOutfits = () => {
  const context = useContext(SelectedOutfitsContext);
  if (context === undefined) {
    throw new Error('useSelectedOutfits must be used within a SelectedOutfitsProvider');
  }
  return context;
};
