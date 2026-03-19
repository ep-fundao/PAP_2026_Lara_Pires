import { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const irDepoisLogin = async (user) => {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) navigate("/perfil", { replace: true });
    else navigate("/perfil_cadastro", { replace: true });
  };

  const entrar = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await irDepoisLogin(cred.user);
    } catch (err) {
      alert(err.message);
    }
  };

  const criarConta = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/perfil_cadastro", { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  const entrarGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await irDepoisLogin(result.user);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>ProfChoise.IA</h1>
        <p style={styles.subtitle}>Descobre a tua vocação</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === "login" ? styles.tabActive : {}) }}
            onClick={() => setTab("login")}
            type="button"
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(tab === "cadastro" ? styles.tabActive : {}) }}
            onClick={() => setTab("cadastro")}
            type="button"
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={tab === "login" ? entrar : criarConta} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div style={styles.passwordWrapper}>
            <input
              style={{ ...styles.input, paddingRight: 44, marginBottom: 0 }}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              title={showPassword ? "Esconder password" : "Mostrar password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button style={styles.primaryBtn} type="submit">
            {tab === "login" ? "Entrar" : "Criar Conta"}
          </button>

          <button style={styles.googleBtn} type="button" onClick={entrarGoogle}>
            Entrar com Google
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
    maxWidth: 420,
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 14px 40px rgba(0,0,0,.08)",
    border: "1px solid rgba(17,24,39,.06)",
  },
  title: { margin: 0, fontSize: 28, color: "#111827" },
  subtitle: { margin: "6px 0 14px", color: "#6b7280", fontWeight: 700 },
  tabs: {
    display: "flex",
    gap: 8,
    background: "rgba(17,24,39,.06)",
    padding: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    color: "#374151",
  },
  tabActive: {
    background: "#fff",
    boxShadow: "0 10px 20px rgba(0,0,0,.06)",
    color: "#111827",
  },
  form: { display: "grid", gap: 10 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,.14)",
    outline: "none",
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 0,
    boxSizing: "border-box",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    padding: 0,
    lineHeight: 1,
  },
  primaryBtn: {
    background: "#4f46e5",
    border: "none",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 20px rgba(79,70,229,.25)",
  },
  googleBtn: {
    background: "rgba(17,24,39,.06)",
    border: "1px solid rgba(17,24,39,.10)",
    color: "#111827",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },
};