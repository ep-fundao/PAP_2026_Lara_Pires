import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modoEdicao, setModoEdicao] = useState(false);
  const [draft, setDraft] = useState({ nome: "", nascimento: "", genero: "" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setErro("");

        if (!u) {
          window.location.href = "/";
          return;
        }

        setUser(u);

        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        // React decide: se não existir perfil → manda para cadastro
        if (!snap.exists()) {
          navigate("/perfil_cadastro", { replace: true });
          return;
        }

        const data = snap.data();
        setPerfil(data);

        setDraft({
          nome: data.nome || "",
          nascimento: data.nascimento || "",
          genero: data.genero || "",
        });
      } catch (e) {
        console.error("Erro ao carregar perfil:", e);
        setErro(e?.message || "Erro ao carregar o perfil.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [navigate]);

  const resetPassword = async () => {
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
    alert(`Email de reposição enviado para ${user.email}`);
  };

  const guardarAlteracoes = async () => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...draft,
          email: user.email,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      setPerfil({ ...perfil, ...draft });
      setModoEdicao(false);
      alert("Perfil atualizado!");
    } catch (e) {
      console.error("Erro a guardar:", e);
      alert(e?.message || "Erro a guardar alterações.");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>A carregar...</p>;
  if (erro) return <p style={{ textAlign: "center", color: "crimson" }}>{erro}</p>;
  if (!user || !perfil) return null;

  return (
    <div style={{ maxWidth: 700, margin: "30px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>O teu perfil</h1>

      <div style={{
        background: "#fff", borderRadius: 14, padding: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,.08)"
      }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>UID:</strong> {user.uid}</div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <strong>Nome:</strong>
            {!modoEdicao ? (
              <span>{perfil.nome || "-"}</span>
            ) : (
              <input
                value={draft.nome}
                onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
              />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <strong>Nascimento:</strong>
            {!modoEdicao ? (
              <span>{perfil.nascimento || "-"}</span>
            ) : (
              <input
                type="date"
                value={draft.nascimento}
                onChange={(e) => setDraft({ ...draft, nascimento: e.target.value })}
              />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <strong>Género:</strong>
            {!modoEdicao ? (
              <span>{perfil.genero || "-"}</span>
            ) : (
              <select
                value={draft.genero}
                onChange={(e) => setDraft({ ...draft, genero: e.target.value })}
              >
                <option value="">Seleciona...</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {!modoEdicao ? (
            <button onClick={() => setModoEdicao(true)}>✏️ Editar</button>
          ) : (
            <button onClick={guardarAlteracoes}>Guardar alterações</button>
          )}

          <button onClick={resetPassword} style={{ background: "#e11d48", color: "#fff" }}>
            Repor password
          </button>

          <button onClick={() => navigate("/chat")} style={{ marginLeft: "auto" }}>
            💬 Ir para o chat
          </button>
        </div>
      </div>
    </div>
  );
}