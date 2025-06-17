import { useState } from "react";
import axios from "axios";
import "./CommentThread.css";

function CommentThread({
  roadmapItemId,
  userId,
  comments = [],
  onCommentUpdate,
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);

  const handleCommentSubmit = async (parentCommentId = null) => {
    setError("");

    // Determine which content to use based on the current mode
    const isEditMode = !!editingCommentId;
    const isReplyMode = !!replyingToCommentId;

    const textToSubmit = isEditMode ? editContent : content;

    if (!textToSubmit.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (textToSubmit.length > 300) {
      setError("Comment too long (max 300 characters)");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please log in to comment");
      }

      if (isEditMode) {
        // Handle edit
        await axios.put(
          `http://localhost:5000/api/comments/${editingCommentId}`,
          { content: editContent },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEditingCommentId(null);
        setEditContent("");
      } else {
        // Handle new comment/reply
        await axios.post(
          `http://localhost:5000/api/roadmap/${roadmapItemId}/comments`,
          {
            content: textToSubmit,
            parentCommentId: isReplyMode
              ? replyingToCommentId
              : parentCommentId || undefined,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setReplyingToCommentId(null);
        setContent("");
      }

      if (onCommentUpdate) await onCommentUpdate();
    } catch (err) {
      console.error("Comment error:", err);
      setError(err.response?.data?.error || err.message || "Operation failed");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment and all replies?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onCommentUpdate) await onCommentUpdate();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  };

  const renderComments = (commentsToRender, depth = 0) => {
    if (!Array.isArray(commentsToRender) || !commentsToRender.length)
      return null;

    return commentsToRender.map((comment) => {
      const isOwner =
        String(comment.user?._id) === String(userId) ||
        String(comment.user) === String(userId);
      const isReplying = replyingToCommentId === comment._id;
      const isEditing = editingCommentId === comment._id;

      return (
        <div key={comment._id} className={`comment depth-${depth}`}>
          {isEditing ? (
            <div className="comment-editor">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={300}
              />
              <div className="comment-actions">
                <button onClick={() => handleCommentSubmit()}>Save</button>
                <button onClick={() => setEditingCommentId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>
                {comment.content}
                <small>
                  by {comment.user?.email || "Deleted User"} •
                  {comment.createdAt
                    ? new Date(comment.createdAt).toLocaleString()
                    : "Unknown date"}
                </small>
              </p>

              <div className="comment-controls">
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setEditingCommentId(comment._id);
                        setEditContent(comment.content);
                        setReplyingToCommentId(null); // Clear any reply state when editing
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
                  <button
                    onClick={() => {
                      setReplyingToCommentId(comment._id);
                      setContent("");
                      setEditingCommentId(null); // Clear any edit state when replying
                    }}
                  >
                    Reply
                  </button>
                )}
              </div>

              {isReplying && (
                <div className="reply-box">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your reply..."
                    maxLength={300}
                  />
                  <div
                    className={`character-counter ${
                      content.length > 280
                        ? "warning"
                        : content.length >= 300
                        ? "error"
                        : ""
                    }`}
                  >
                    {content.length}/300 characters
                  </div>
                  <div className="comment-actions">
                    <button onClick={() => handleCommentSubmit(comment._id)}>
                      Post Reply
                    </button>
                    <button onClick={() => setReplyingToCommentId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {comment.replies && renderComments(comment.replies, depth + 1)}
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div className="comment-section">
      <h3>Comments</h3>
      {error && <div className="error-message">{error}</div>}

      {/* Main comment input */}
      {!replyingToCommentId && (
        <div className="comment-input-area">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            maxLength={300}
          />
          <div
            className={`character-counter ${
              content.length > 280
                ? "warning"
                : content.length >= 300
                ? "error"
                : ""
            }`}
          >
            {content.length}/300 characters
          </div>
          <button onClick={() => handleCommentSubmit()}>Submit</button>
        </div>
      )}

      {comments?.length ? (
        renderComments(comments)
      ) : (
        <p>No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}

export default CommentThread;
