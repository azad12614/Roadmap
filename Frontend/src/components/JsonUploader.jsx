import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api.js";
import "./JsonUploader.css";

function JsonUploader({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a JSON file to upload.");
      return;
    }

    setLoading(true);
    setMessage("Uploading...");

    try {
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(selectedFile);
      });

      const jsonContent = JSON.parse(fileContent);

      // Validate JSON structure before sending
      if (!Array.isArray(jsonContent)) {
        throw new Error("JSON must contain an array of roadmap items");
      }

      const response = await axios.post(
        `${API_BASE_URL}/admin/roadmap/upload-json`,
        { roadmapItems: jsonContent },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage(response.data.message || "Upload successful!");
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      let errorMessage = "Upload failed";

      if (error instanceof SyntaxError) {
        errorMessage = "Invalid JSON file";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage(errorMessage);
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="json-uploader-container">
      <h3>Upload Roadmap JSON</h3>
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="json-uploader-input"
      />
      <button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="json-uploader-button"
      >
        {loading ? "Uploading..." : "Upload JSON"}
      </button>
      {message && <p className="json-uploader-message">{message}</p>}
      <p className="json-uploader-note">
        Note: JSON must be an array of objects with title, description,
        category, and status fields.
      </p>
    </div>
  );
}

export default JsonUploader;
