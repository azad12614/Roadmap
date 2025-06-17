import { useState } from "react";
import axios from "axios";
import "./CommentThread.css";

function CommentThread({ roadmapItemId, userId, comments }) {
  const [content, setContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [localComments, setLocalComments] = useState(comments);

  const handleCommentSubmit = async (parentCommentId = null) => {
    if (content.length > 300) return alert("Comment too long");

    const newComment = {
      _id: `temp-${Date.now()}`,
      content,
      userId,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setLocalComments([...localComments, newComment]);
    setContent("");

    try {
      await axios.post(
        `${API_BASE_URL}/roadmap/${roadmapItemId}/comments`,
        { content, parentCommentId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
    } catch (error) {
      setLocalComments(comments); // Rollback
      alert("Failed to post comment");
    }
  };

  const handleEdit = async (commentId) => {
    if (editContent.length > 300) return alert("Comment too long");
    await axios.put(
      `http://localhost:5000/api/comments/${commentId}`,
      { content: editContent },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    setEditingCommentId(null);
    window.location.reload();
  };

  const handleDelete = async (commentId) => {
    if (window.confirm("Delete comment?")) {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      window.location.reload();
    }
  };

  const renderComments = (comments, depth = 0) => {
    return comments.map((comment) => (
      <div key={comment._id} className={`comment depth-${depth}`}>
        {editingCommentId === comment._id ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={300}
            />
            <button onClick={() => handleEdit(comment._id)}>Save</button>
            <button onClick={() => setEditingCommentId(null)}>Cancel</button>
          </div>
        ) : (
          <>
            <p>
              {comment.content}{" "}
              <small>
                by {comment.userId} at{" "}
                {new Date(comment.createdAt).toLocaleString()}
              </small>
            </p>
            {comment.userId === userId && (
              <>
                <button
                  onClick={() => {
                    setEditingCommentId(comment._id);
                    setEditContent(comment.content);
                  }}
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(comment._id)}>
                  Delete
                </button>
              </>
            )}
            {depth < 3 && (
              <button onClick={() => handleCommentSubmit(comment._id)}>
                Reply
              </button>
            )}
            {comment.replies && renderComments(comment.replies, depth + 1)}
          </>
        )}
      </div>
    ));
  };

  return (
    <div className="comment-section">
      <h3>Comments</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={300}
        placeholder="Add a comment..."
      />
      <button onClick={() => handleCommentSubmit()}>Submit</button>
      {renderComments(comments)}
    </div>
  );
}

export default CommentThread;
