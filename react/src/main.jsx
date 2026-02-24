import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Perfil from "./pages/Perfil.jsx";
import PerfilCadastro from "./pages/PerfilCadastro.jsx";
// import Chat from "./pages/Chat.jsx"; // quando tiveres

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/perfil" replace />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/perfil_cadastro" element={<PerfilCadastro />} />
      <Route path="/chat" element={<div style={{padding:20}}>Chat (em breve)</div>} />
      <Route path="*" element={<Navigate to="/perfil" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);