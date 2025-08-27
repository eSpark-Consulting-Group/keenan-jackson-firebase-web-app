import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.js";
import "./styles/index.css";

// Create root element
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render app with providers
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
