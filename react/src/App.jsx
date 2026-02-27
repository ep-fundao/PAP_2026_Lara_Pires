import { Routes, Route, Navigate } from "react-router-dom";
import Perfil from "./pages/Perfil";
import PerfilCadastro from "./pages/PerfilCadastro";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/perfil" replace />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/perfil_cadastro" element={<PerfilCadastro />} />
      <Route path="/chat" element={<div style={{padding:20}}>Chat (a seguir fazemos!)</div>} />
      <Route path="*" element={<Navigate to="/perfil" replace />} />
    </Routes>
  );
}