import { createContext } from 'react';
import { type SelectedOutfitsContextType } from '../types/outfit';

export const SelectedOutfitsContext = createContext<SelectedOutfitsContextType | undefined>(undefined);
