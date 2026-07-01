import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import "./index.min.css";
import { useNavigate, useParams } from "react-router-dom";
import boardContext from "../../store/board-context";

const Sidebar = () => {
  const [canvases, setCanvases] = useState([]);
  const token = localStorage.getItem("whiteboard_user_token");

  const {
    canvasId,
    setCanvasId,
    isUserLoggedIn,
    setUserLoginStatus,
  } = useContext(boardContext);

  const navigate = useNavigate();
  const { id } = useParams();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCanvasClick = (id) => {
    navigate(`/${id}`);
  };

  const handleCreateCanvas = async () => {
    try {
      const response = await axios.post(
        "https://api-whiteboard-az.onrender.com/api/canvas/create",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCanvasId(response.data.canvasId);
      handleCanvasClick(response.data.canvasId);

      return response.data;
    } catch (error) {
      console.error("Error creating canvas:", error);
      return null;
    }
  };

  const fetchCanvases = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://api-whiteboard-az.onrender.com/api/canvas/list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCanvases(response.data);

      if (response.data.length === 0) {
        const newCanvas = await handleCreateCanvas();
        if (newCanvas) {
          setCanvasId(newCanvas.canvasId);
          handleCanvasClick(newCanvas.canvasId);
        }
      } else if (!canvasId && response.data.length > 0 && !id) {
        setCanvasId(response.data[0]._id);
        handleCanvasClick(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching canvases:", error);
    }
  }, [token, canvasId, id, setCanvasId]);

  useEffect(() => {
    if (isUserLoggedIn) {
      fetchCanvases();
    }
  }, [isUserLoggedIn, fetchCanvases]);

  const handleDeleteCanvas = async (id) => {
    try {
      await axios.delete(
        `https://api-whiteboard-az.onrender.com/api/canvas/delete/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchCanvases();

      if (canvases.length > 0) {
        setCanvasId(canvases[0]._id);
        handleCanvasClick(canvases[0]._id);
      }
    } catch (error) {
      console.error("Error deleting canvas:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("whiteboard_user_token");
    setCanvases([]);
    setUserLoginStatus(false);
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await axios.put(
        `https://api-whiteboard-az.onrender.com/api/canvas/share/${canvasId}`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(response.data.message);

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to share canvas.");
      setTimeout(() => setError(""), 5000);
    }
  };

  return (
    <div className="sidebar">
      <button
        className="create-button"
        onClick={handleCreateCanvas}
        disabled={!isUserLoggedIn}
      >
        + Create New Canvas
      </button>

      <ul className="canvas-list">
        {canvases.map((canvas) => (
          <li
            key={canvas._id}
            className={`canvas-item ${
              canvas._id === canvasId ? "selected" : ""
            }`}
          >
            <span
              className="canvas-name"
              onClick={() => handleCanvasClick(canvas._id)}
            >
              {canvas._id}
            </span>

            <button
              className="delete-button"
              onClick={() => handleDeleteCanvas(canvas._id)}
            >
              del
            </button>
          </li>
        ))}
      </ul>

      <div className="share-container">
        <input
          type="email"
          placeholder="Enter the email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="share-button"
          onClick={handleShare}
          disabled={!isUserLoggedIn}
        >
          Share
        </button>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>

      {isUserLoggedIn ? (
        <button
          className="auth-button logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      ) : (
        <button
          className="auth-button login-button"
          onClick={handleLogin}
        >
          Login
        </button>
      )}
    </div>
  );
};

export default Sidebar;