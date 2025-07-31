import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SelectedOutfitsProvider } from './components/SelectedOutfitsProvider'
import SplashScreen from './pages/SplashScreen'
import HomePage from './pages/HomePage'
import OutfitGallery from './pages/OutfitGallery'
import CombinedTryOnPage from './pages/CombinedTryOnPage'

import MultipleResults from './pages/MultipleResults'
// import AISuggestionResults from './pages/AISuggestionResults'
// Legacy components (keeping for reference)
// import CategoryOutfits from './pages/CategoryOutfits'
// import CameraCapture from './pages/CameraCapture'
// import TryOnResults from './pages/TryOnResults'
import './App.css'

function App() {
  return (
    <SelectedOutfitsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/outfits/:gender" element={<OutfitGallery />} />
          
          {/* New combined flow */}
          <Route path="/outfits/:gender/:category" element={<CombinedTryOnPage />} />
          {/* <Route path="/ai-suggestion-results" element={<AISuggestionResults />} /> */}
          <Route path="/multiple-results" element={<MultipleResults />} />
          
          {/* Legacy routes (for backward compatibility) */}
          {/* <Route path="/legacy/outfits/:gender/:category" element={<CategoryOutfits />} />
          <Route path="/camera" element={<CameraCapture />} />
          <Route path="/results" element={<TryOnResults />} /> */}
        </Routes>
      </Router>
    </SelectedOutfitsProvider>
  )
}

export default App
