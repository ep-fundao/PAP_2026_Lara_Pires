import { useNavigate } from "react-router-dom";

export default function Chat() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: 16 }}>
      <h1>Chat IA</h1>
      <p>Aqui vai ficar o chat com a IA (vamos implementar a seguir).</p>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => navigate("/perfil")}>👤 Perfil</button>
        <button onClick={() => navigate("/perfil_cadastro")}>📝 Perfil (cadastro)</button>
      </div>
    </div>
  );
}