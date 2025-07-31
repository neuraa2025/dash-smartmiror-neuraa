export interface SelectedOutfit {
  id: number;
  name: string;
  imageUrl: string;
  description?: string;
  clothType: string;
  price: number;
  category: {
    displayName: string;
    gender: {
      displayName: string;
    };
  };
}

export interface SelectedOutfitsContextType {
  selectedOutfits: SelectedOutfit[];
  addOutfit: (outfit: SelectedOutfit) => void;
  removeOutfit: (outfitId: number) => void;
  clearOutfits: () => void;
  isSelected: (outfitId: number) => boolean;
  toggleOutfit: (outfit: SelectedOutfit) => void;
}
