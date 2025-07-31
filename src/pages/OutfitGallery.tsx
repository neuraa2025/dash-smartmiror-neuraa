import { useState, useEffect, type FC } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/outfits.css";
import logo from "../assets/Images/smart_miror_logo.png"; // Adjust this path to your logo


interface Category {
  id: number;
  name: string;
  displayName: string;
  bannerImage: string;
  _count: {
    outfits: number;
  };
}

interface GenderData {
  id: number;
  name: string;
  displayName: string;
  bannerImage: string;
}

const OutfitGallery: FC = () => {
  const { gender } = useParams<{ gender: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [genderData, setGenderData] = useState<GenderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gender) {
      fetchCategories();
    }
  }, [gender]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/outfits/categories/${gender}`);
      const data = await response.json();

      if (data.success) {
        setCategories(data.data.categories);
        setGenderData(data.data.gender);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/outfits/${gender}/${categoryName}`);
  };

  if (loading) {
    return (
      <div className="outfits-container">
        {/* <div className="smart-mirror-logo">Smart Mirror</div>{" "} */}
        {/* Logo in loading state too */}
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="outfits-container">
    
      {/* Added Smart Mirror Logo */}
      <div className="outfits-header">
        <img src={logo} alt="Logo" className="logo" onClick={() => navigate("/home")}/>
{/* 
        <button className="back-button" onClick={() => navigate("/home")}>
          ← Back
        </button> */}
        <h1 className="outfits-title">
          {genderData?.displayName || "Collection"}
        </h1>
        <p className="outfits-subtitle">Choose a category to explore outfits</p>
      </div>
      <div className="outfit-grid">
        {categories.map((category) => (
          <div
            key={category.id}
            className="outfit-card category-card"
            onClick={() => handleCategoryClick(category.name)}
          >
            <div className="outfit-image">
              <img src={category.bannerImage} alt={category.displayName} />
              <div className="category-overlay">
                <h3>{category.displayName}</h3>
              </div>
            </div>
            <div className="outfit-info">
              <h3>{category.displayName}</h3>
              <p>{category._count.outfits} outfits available</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutfitGallery;
