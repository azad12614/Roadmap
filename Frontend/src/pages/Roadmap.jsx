import { useState, useEffect } from "react";
import axios from "axios";
import RoadmapItem from "../components/RoadmapItem";
import JsonUploader from "../components/JsonUploader"; // Import the new component
// import { API_BASE_URL } from "../utils/api.js"; // Ensure API_BASE_URL is imported or defined
import "./Roadmap.css";

function Roadmap({ user }) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("");

  // Function to fetch roadmap items. This will be passed to JsonUploader.
  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/roadmap", {
        params: { category, status, sort },
      });
      setItems(res.data);
    } catch (error) {
      console.error("Failed to fetch roadmap items:", error);
      // Optionally set an error state to display to the user
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, status, sort]); // Re-fetch when filters/sort change

  return (
    <div className="container">
      <header>
        <h1>Roadmap</h1>
        <div className="controls">
          <select onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Feature">Feature</option>
            <option value="Bug">Bug</option>
            <option value="Enhancement">Enhancement</option>
            <option value="Other">Other</option>
          </select>
          <select onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
          <select onChange={(e) => setSort(e.target.value)}>
            <option value="">Sort by Date</option>
            <option value="upvotes">Sort by Upvotes</option>
          </select>
          <button
            onClick={() => {
              localStorage.removeItem("token"); // Remove token
              localStorage.removeItem("user"); // Remove user data
              window.location.reload(); // Reload to force re-authentication
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Add the JsonUploader component */}
      {/* You might want to conditionally render this only for admin users */}
      <JsonUploader onUploadSuccess={fetchItems} />

      <div className="roadmap-list">
        {items.length > 0 ? (
          items.map((item) => (
            <RoadmapItem key={item._id} item={item} userId={user.userId} />
          ))
        ) : (
          <p>No roadmap items found. Upload some JSON data!</p>
        )}
      </div>
    </div>
  );
}

export default Roadmap;
