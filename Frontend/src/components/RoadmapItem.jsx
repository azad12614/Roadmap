// RoadmapItem.jsx
import { API_BASE_URL } from "../utils/api.js";
import { useState, useEffect } from "react";
import axios from "axios";
import CommentThread from "./CommentThread";
import "./CommentThread.css"; // Ensure this is imported for styling

function RoadmapItem({ item, userId }) {
  const [upvoted, setUpvoted] = useState(item.upvotes.includes(userId));
  const [upvoteCount, setUpvoteCount] = useState(item.upvotes.length);
  const [comments, setComments] = useState(item.comments); // Manage comments state here

  // Function to re-fetch comments for this specific roadmap item
  const fetchComments = async () => {
    try {
      // You might need a specific endpoint to fetch comments for a single item
      // For now, let's assume we fetch the whole item again and extract comments
      // A better approach would be: GET /api/roadmap/:id/comments
      const res = await axios.get(`${API_BASE_URL}/roadmap/${item._id}`);
      setComments(res.data.comments); // Assuming the response contains the updated item with comments
    } catch (error) {
      console.error("Failed to fetch comments for item:", item._id, error);
    }
  };

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
      // No need to re-fetch comments for upvote
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
        comments={comments} // Pass the state-managed comments
        onCommentUpdate={fetchComments} // Pass the callback to re-fetch
      />
    </div>
  );
}

export default RoadmapItem;
