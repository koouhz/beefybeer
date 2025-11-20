import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./Index.css";
import { BrowserRouter } from "react-router-dom"; // <--- Importa BrowserRouter

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter> {/* <--- Envuelve App en BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
