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
  const [modo, setModo] = useState("login"); // "login" | "cadastro"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function redirecionarAposLogin(user) {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) navigate("/perfil");
    else navigate("/perfil_cadastro");
  }

  async function entrar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await redirecionarAposLogin(cred.user);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function criarConta(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // cadastro vai sempre para perfil_cadastro
      navigate("/perfil_cadastro");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function entrarGoogle() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await redirecionarAposLogin(res.user);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", padding: 20, borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,.08)" }}>
        <h1 style={{ margin: 0 }}>ProfChoise.IA</h1>
        <p style={{ marginTop: 6, color: "#555" }}>Descobre a tua vocação</p>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={() => setModo("login")}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd", background: modo === "login" ? "#111" : "#fff", color: modo === "login" ? "#fff" : "#111" }}
          >
            Login
          </button>
          <button
            onClick={() => setModo("cadastro")}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd", background: modo === "cadastro" ? "#111" : "#fff", color: modo === "cadastro" ? "#fff" : "#111" }}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={modo === "login" ? entrar : criarConta} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
          <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 10, border: "none", background: "#4f46e5", color: "#fff" }}>
            {loading ? "Aguarda..." : (modo === "login" ? "Entrar" : "Criar Conta")}
          </button>

          <button type="button" onClick={entrarGoogle} disabled={loading} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", background: "#fff" }}>
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  );
}