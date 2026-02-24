import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import PerfilCadastro from "./pages/PerfilCadastro";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil_cadastro" element={<PerfilCadastro />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
