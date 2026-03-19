import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Perfil from "./pages/Perfil.jsx";
import PerfilCadastro from "./pages/PerfilCadastro.jsx";
import Chat from "./pages/Chat.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/perfil_cadastro" element={<PerfilCadastro />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}