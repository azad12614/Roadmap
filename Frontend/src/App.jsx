import { useState, lazy, Suspense } from "react"; // Add lazy and Suspense imports
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Spinner from "./components/Spinner"; // Make sure to import Spinner
import "./App.css";

// Lazy-loaded components
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Navbar = lazy(() => import("./components/Navbar"));
const Footer = lazy(() => import("./components/Footer"));

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  return (
    <Suspense fallback={<Spinner />}>
      <Router>
        <Navbar />
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/roadmap" /> : <Login />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/roadmap" /> : <Signup />}
          />
          <Route
            path="/roadmap"
            element={user ? <Roadmap user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/roadmap" />} />
        </Routes>
        <Footer />
      </Router>
    </Suspense>
  );
}

export default App;
