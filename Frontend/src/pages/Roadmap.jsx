import { useState, useEffect } from "react";
import axios from "axios";
import RoadmapItem from "../components/RoadmapItem";

function Roadmap({ user }) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      const res = await axios.get("http://localhost:5000/api/roadmap", {
        params: { category, status, sort },
      });
      setItems(res.data);
    };
    fetchItems();
  }, [category, status, sort]);

  return (
    <div className="container">
      <header>
        <h1>Roadmap</h1>
        <div>
          <select onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Feature">Feature</option>
            <option value="Bug">Bug</option>
          </select>
          <select onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select onChange={(e) => setSort(e.target.value)}>
            <option value="">Sort by Date</option>
            <option value="upvotes">Sort by Upvotes</option>
          </select>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.reload();
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <div className="roadmap-list">
        {items.map((item) => (
          <RoadmapItem key={item._id} item={item} userId={user.userId} />
        ))}
      </div>
    </div>
  );
}

export default Roadmap;
