import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

function Perfil() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null); // null = primeira vez
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState(null); // qual campo está a editar

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/";
        return;
      }
      setUser(u);

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setPerfil(snap.data());
      } else {
        // primeira vez
        setPerfil({
          nome: "",
          genero: "",
          nascimento: ""
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const salvarCampo = async (campo) => {
    await setDoc(
      doc(db, "users", user.uid),
      { ...perfil, email: user.email, atualizadoEm: serverTimestamp() },
      { merge: true }
    );
    setEditField(null);
  };

  const resetPassword = async () => {
    await sendPasswordResetEmail(auth, user.email);
    alert(`Email de reposição enviado para ${user.email}`);
  };

  if (loading) return <p>A carregar...</p>;

  // primeira vez = perfil vazio
  const primeiraVez = !perfil.nome && !perfil.genero && !perfil.nascimento;

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", padding: "20px", background: "#fff", borderRadius: "10px" }}>
      <h1>O teu perfil</h1>

      {primeiraVez ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await setDoc(
              doc(db, "users", user.uid),
              { ...perfil, email: user.email, atualizadoEm: serverTimestamp() },
              { merge: true }
            );
            alert("Perfil guardado!");
          }}
        >
          <input
            name="nome"
            value={perfil.nome}
            onChange={handleChange}
            placeholder="Nome"
            required
          />
          <input
            type="date"
            name="nascimento"
            value={perfil.nascimento}
            onChange={handleChange}
            required
          />
          <select
            name="genero"
            value={perfil.genero}
            onChange={handleChange}
            required
          >
            <option value="">Seleciona o género</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </select>
          <button type="submit" style={{ marginTop: "10px", background: "#4f46e5", color: "#fff", padding: "10px", border: "none", borderRadius: "6px" }}>Guardar</button>
        </form>
      ) : (
        <div>
          {/* Mostrar perfil em modo visualização */}
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>UID:</strong> {user.uid}</p>

          <p>
            <strong>Nome:</strong>{" "}
            {editField === "nome" ? (
              <>
                <input name="nome" value={perfil.nome} onChange={handleChange} />
                <button type="button" onClick={() => salvarCampo("nome")}>💾</button>
                <button type="button" onClick={() => setEditField(null)}>❌</button>
              </>
            ) : (
              <>
                {perfil.nome} <button type="button" onClick={() => setEditField("nome")}>✏️</button>
              </>
            )}
          </p>

          <p>
            <strong>Data de nascimento:</strong>{" "}
            {editField === "nascimento" ? (
              <>
                <input type="date" name="nascimento" value={perfil.nascimento} onChange={handleChange} />
                <button type="button" onClick={() => salvarCampo("nascimento")}>💾</button>
                <button type="button" onClick={() => setEditField(null)}>❌</button>
              </>
            ) : (
              <>
                {perfil.nascimento} <button type="button" onClick={() => setEditField("nascimento")}>✏️</button>
              </>
            )}
          </p>

          <p>
            <strong>Género:</strong>{" "}
            {editField === "genero" ? (
              <>
                <select name="genero" value={perfil.genero} onChange={handleChange}>
                  <option value="">Seleciona o género</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
                <button type="button" onClick={() => salvarCampo("genero")}>💾</button>
                <button type="button" onClick={() => setEditField(null)}>❌</button>
              </>
            ) : (
              <>
                {perfil.genero} <button type="button" onClick={() => setEditField("genero")}>✏️</button>
              </>
            )}
          </p>

          <button
            style={{ marginTop: "10px", background: "#e11d48", color: "#fff", padding: "10px", border: "none", borderRadius: "6px" }}
            onClick={resetPassword}
          >
            Repor password
          </button>
        </div>
      )}
    </div>
  );
}

export default Perfil;
