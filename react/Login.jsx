import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirecionarAposLogin = async (user) => {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      navigate("/perfil");
    } else {
      navigate("/perfil_cadastro");
    }
  };

  const login = async () => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    redirecionarAposLogin(cred.user);
  };

  const cadastro = async () => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    navigate("/perfil_cadastro");
  };

  const loginGoogle = async () => {
    const result = await signInWithPopup(auth, provider);
    redirecionarAposLogin(result.user);
  };

  return (
    <div style={styles.container}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={login}>Entrar</button>
      <button onClick={cadastro}>Criar Conta</button>
      <button onClick={loginGoogle}>Entrar com Google</button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "100px auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  }
};

export default Login;
