import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

export default function Perfil() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [draft, setDraft] = useState({ nome: "", nascimento: "", genero: "" });

  const [loading, setLoading] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(u);

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        navigate("/perfil_cadastro", { replace: true });
        return;
      }

      const data = snap.data();
      setPerfil(data);

      setDraft({
        nome: data?.nome || "",
        nascimento: data?.nascimento || "",
        genero: data?.genero || "",
      });

      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const uidCurto = useMemo(() => {
    if (!user?.uid) return "";
    return `${user.uid.slice(0, 6)}...${user.uid.slice(-4)}`;
  }, [user]);

const resetPassword = async () => {
  if (!user?.email) {
    alert("Não foi encontrado um email associado a esta conta.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, user.email);
    alert(
      `Email de reposição enviado para ${user.email}.\n\nSe não o encontrares na caixa de entrada, verifica também a pasta de spam/lixo eletrónico.`
    );
  } catch (e) {
    console.error("Erro ao enviar email de reposição:", e);
    alert("Ocorreu um erro ao enviar o email de reposição.");
  }
};

  const terminarSessao = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const guardar = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          nome: draft.nome.trim(),
          nascimento: draft.nascimento,
          genero: draft.genero,
          email: user.email,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      setPerfil((p) => ({
        ...(p || {}),
        nome: draft.nome.trim(),
        nascimento: draft.nascimento,
        genero: draft.genero,
      }));

      setModoEdicao(false);
      alert("Perfil guardado ✅");
    } catch (e) {
      console.error(e);
      alert("Erro ao guardar perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.center}>
          <div style={styles.loader} />
          <p style={{ marginTop: 10, color: "#6b7280" }}>A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user || !perfil) return null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>O teu perfil</h1>
            <p style={styles.subtitle}>Vê e edita os teus dados quando precisares.</p>
          </div>

          {!modoEdicao ? (
            <button style={styles.btnPrimary} onClick={() => setModoEdicao(true)}>
              ✏️ Editar
            </button>
          ) : (
            <button
              style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}
              onClick={guardar}
              disabled={saving}
            >
              {saving ? "A guardar..." : "Guardar alterações"}
            </button>
          )}
        </div>

        <div style={styles.card}>
          <Linha label="Email" value={user.email || "-"} />
          <Linha label="UID" value={user.uid || "-"} smallHint={`(${uidCurto})`} />

          <div style={styles.hr} />

          <Campo
            label="Nome"
            value={
              !modoEdicao ? (
                <span style={styles.valueText}>{perfil.nome || "-"}</span>
              ) : (
                <input
                  style={styles.input}
                  value={draft.nome}
                  onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
                  placeholder="O teu nome"
                />
              )
            }
          />

          <Campo
            label="Data de nascimento"
            value={
              !modoEdicao ? (
                <span style={styles.valueText}>{perfil.nascimento || "-"}</span>
              ) : (
                <input
                  type="date"
                  style={styles.input}
                  value={draft.nascimento}
                  onChange={(e) => setDraft({ ...draft, nascimento: e.target.value })}
                />
              )
            }
          />

          <Campo
            label="Género"
            value={
              !modoEdicao ? (
                <span style={styles.valueText}>{perfil.genero || "-"}</span>
              ) : (
                <select
                  style={styles.input}
                  value={draft.genero}
                  onChange={(e) => setDraft({ ...draft, genero: e.target.value })}
                >
                  <option value="">Seleciona...</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              )
            }
          />

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button style={styles.btnDanger} onClick={resetPassword}>
              Repor password
            </button>

            <button style={styles.btnGhost} onClick={terminarSessao}>
              Terminar sessão
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 90 }} />
      <Footer />
    </div>
  );
}

function Linha({ label, value, smallHint }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>
        {value}{" "}
        {smallHint ? <span style={{ color: "#9ca3af", fontWeight: 600 }}>{smallHint}</span> : null}
      </span>
    </div>
  );
}

function Campo({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <div style={{ minWidth: 240, display: "flex", justifyContent: "flex-end" }}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f7ff, #f3f4f6)",
    padding: "28px 14px",
    boxSizing: "border-box",
  },
  container: { maxWidth: 720, margin: "0 auto" },
  center: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  loader: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "3px solid rgba(79,70,229,.25)",
    borderTopColor: "#4f46e5",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: { margin: 0, fontSize: 26, color: "#111827" },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontWeight: 600 },
  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 14px 40px rgba(0,0,0,.08)",
    border: "1px solid rgba(17,24,39,.06)",
  },
  hr: { height: 1, background: "rgba(17,24,39,.08)", margin: "14px 0" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    alignItems: "center",
    flexWrap: "wrap",
  },
  label: { color: "#374151", fontWeight: 800 },
  value: { color: "#111827", fontWeight: 700, wordBreak: "break-word" },
  valueText: { color: "#111827", fontWeight: 800 },
  input: {
    width: 260,
    maxWidth: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,.14)",
    outline: "none",
    fontWeight: 700,
  },
  btnPrimary: {
    background: "#4f46e5",
    border: "none",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 20px rgba(79,70,229,.25)",
    whiteSpace: "nowrap",
  },
  btnDanger: {
    background: "#e11d48",
    border: "none",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
  },
  btnGhost: {
    background: "rgba(17,24,39,.06)",
    border: "1px solid rgba(17,24,39,.10)",
    color: "#111827",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
  },
};