import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toggleTheme, initTheme } from "../utils/theme";
import logo from "../assets/logo.png";
import "./Navbar.css";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState("light");

  const handleThemeToggle = () => {
    toggleTheme();
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  useEffect(() => {
    initTheme();
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
  }, []);

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="Roadmap Logo" />
      </div>
      <div className="nav-links">
        <Link to="/">Roadmap</Link>
        {user ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
        <button className="theme-toggle-button" onClick={handleThemeToggle}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
