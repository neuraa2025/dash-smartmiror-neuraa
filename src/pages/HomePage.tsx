import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Images/smart_miror_logo.png"; // Adjust this path to your logo
import "../styles/home.css";

interface Gender {
  id: number;
  name: string;
  displayName: string;
  bannerImage: string;
}

const HomePage: FC = () => {
  const navigate = useNavigate();
  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenders();
  }, []);

  const fetchGenders = async () => {
    try {
      const response = await fetch("/api/outfits/genders");
      const data = await response.json();

      if (data.success) {
        setGenders(data.data);
      }
    } catch (error) {
      console.error("Error fetching genders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenderSelection = (genderName: string) => {
    navigate(`/outfits/${genderName}`);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="home-logo-container">
          <img
            src={logo}
            alt="Logo"
            className="logo"
            onClick={() => navigate("/home")}
          />
        </div>
        <p className="home-subtitle">Choose your style preference</p>
      </div>

      <div className="gender-selection">
        {loading ? (
          <div className="loading">Loading genders...</div>
        ) : (
          <div className="gender-options">
            {genders.map((gender) => (
              <button
                key={gender.id}
                className={`gender-card ${gender.name}-card`}
                onClick={() => handleGenderSelection(gender.name)}
              >
                <div className="gender-image">
                  <img
                    src={gender.bannerImage}
                    alt={`${gender.displayName} fashion`}
                  />
                </div>
                <div className="gender-content">
                  <h3>{gender.displayName} Collection</h3>
                  <p>
                    Discover stylish outfits for{" "}
                    {gender.displayName.toLowerCase()}
                  </p>
                  <span className="arrow">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* 
      <div className="home-features">
        <div className="feature-item">
          <span className="feature-icon">🔍</span>
          <span>Browse Collections</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📱</span>
          <span>Virtual Try-On</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🤖</span>
          <span>AI Recommendations</span>
        </div>
      </div> */}
    </div>
  );
};

export default HomePage;
