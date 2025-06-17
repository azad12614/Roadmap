// RoadmapItem.jsx
import { API_BASE_URL } from "../utils/constants";
import { useState, useEffect } from "react";
import axios from "axios";
import CommentThread from "./CommentThread";
import "./CommentThread.css";

function RoadmapItem({ item, userId }) {
  const [upvoted, setUpvoted] = useState(item.upvotes.includes(userId));
  const [upvoteCount, setUpvoteCount] = useState(item.upvotes.length);

  const handleUpvote = async () => {
    const prevUpvoted = upvoted;
    const prevCount = upvoteCount;

    // Optimistic update
    setUpvoted(!prevUpvoted);
    setUpvoteCount(prevUpvoted ? prevCount - 1 : prevCount + 1);

    try {
      await axios.post(
        `${API_BASE_URL}/roadmap/${item._id}/upvote`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
    } catch (error) {
      // Rollback on error
      setUpvoted(prevUpvoted);
      setUpvoteCount(prevCount);
      alert("Upvote failed");
    }
  };

  return (
    <div className="roadmap-item">
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      <p>
        Category: {item.category} | Status: {item.status}
      </p>
      <button onClick={handleUpvote} disabled={upvoted}>
        {upvoted ? "Upvoted" : "Upvote"} ({upvoteCount})
      </button>
      <CommentThread
        roadmapItemId={item._id}
        userId={userId}
        comments={item.comments}
      />
    </div>
  );
}

export default RoadmapItem;
