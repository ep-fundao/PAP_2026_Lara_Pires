import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function PerfilCadastro() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState({
    nome: "",
    nascimento: "",
    genero: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const guardar = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          nome: perfil.nome,
          nascimento: perfil.nascimento,
          genero: perfil.genero,
          email: user.email,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/chat", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Erro ao guardar perfil.");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>A carregar...</p>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Completa o teu perfil</h1>
        <p style={styles.subtitle}>Só precisas fazer isto uma vez.</p>

        <form onSubmit={guardar} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Nome"
            value={perfil.nome}
            onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
            required
          />

          <input
            style={styles.input}
            type="date"
            value={perfil.nascimento}
            onChange={(e) => setPerfil({ ...perfil, nascimento: e.target.value })}
            required
          />

          <select
            style={styles.input}
            value={perfil.genero}
            onChange={(e) => setPerfil({ ...perfil, genero: e.target.value })}
            required
          >
            <option value="">Seleciona o género</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </select>

          <button style={styles.primaryBtn} type="submit">
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(180deg, #f6f7ff, #f3f4f6)",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 14px 40px rgba(0,0,0,.08)",
    border: "1px solid rgba(17,24,39,.06)",
  },
  title: { margin: 0, fontSize: 26 },
  subtitle: { margin: "6px 0 14px", color: "#6b7280", fontWeight: 700 },
  form: { display: "grid", gap: 10 },
  input: {
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,.14)",
    outline: "none",
    fontWeight: 700,
  },
  primaryBtn: {
    background: "#4f46e5",
    border: "none",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },
};