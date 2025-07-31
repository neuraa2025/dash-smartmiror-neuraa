import { useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/splash-clean.css"; // We'll create this CSS file next
import logo from "../assets/Images/smart_miror_logo.png"; // <-- IMPORTANT: Adjust this path to your logo!

const SplashScreen: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timer to redirect the user after 3 seconds (3000 milliseconds)
    const timer = setTimeout(() => {
      navigate("/home"); // Redirect to the home page
    }, 3000);

    // This is a cleanup function. It clears the timer if the user navigates
    // away before the 3 seconds are up.
    return () => clearTimeout(timer);
  }, [navigate]); // The effect runs only once after the component mounts

  return (
    <div className="splash-container">
      <img src={logo} alt="Smart Mirror Logo" className="splash-logo" />
    </div>
  );
};

export default SplashScreen;
