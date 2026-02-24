import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function PerfilCadastro() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState({ nome: "", nascimento: "", genero: "" });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = "/";
        return;
      }
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setErro("");
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...perfil,
          email: user.email,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/perfil", { replace: true });
    } catch (e) {
      console.error("Erro a guardar perfil:", e);
      setErro(e?.message || "Erro a guardar perfil.");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>A carregar...</p>;

  return (
    <div style={{ maxWidth: 520, margin: "30px auto", padding: 16 }}>
      <h1>Completa o teu perfil</h1>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      <form onSubmit={guardar} style={{
        background: "#fff", borderRadius: 14, padding: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,.08)",
        display: "grid", gap: 10
      }}>
        <input
          placeholder="Nome"
          value={perfil.nome}
          onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
          required
        />

        <input
          type="date"
          value={perfil.nascimento}
          onChange={(e) => setPerfil({ ...perfil, nascimento: e.target.value })}
          required
        />

        <select
          value={perfil.genero}
          onChange={(e) => setPerfil({ ...perfil, genero: e.target.value })}
          required
        >
          <option value="">Seleciona o género</option>
          <option value="Feminino">Feminino</option>
          <option value="Masculino">Masculino</option>
          <option value="Outro">Outro</option>
        </select>

        <button type="submit" style={{ padding: 10 }}>
          Guardar
        </button>
      </form>
    </div>
  );
}