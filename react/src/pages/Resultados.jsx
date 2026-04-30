import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function Resultados() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(u);
      await carregarResultados(u.uid);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  async function carregarResultados(uid) {
    const q = query(
      collection(db, "users", uid, "resultados"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setResultados(lista);
  }

  async function apagarResultado(id) {
    if (!user) return;

    const confirmar = window.confirm("Queres mesmo apagar este resultado?");
    if (!confirmar) return;

    await deleteDoc(doc(db, "users", user.uid, "resultados", id));

    await carregarResultados(user.uid);
  }

  if (loading) return <p style={{ padding: 30 }}>A carregar...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Resultados</h1>

      {resultados.length === 0 && <p>Ainda não tens resultados.</p>}

      {resultados.map((resultado) => {
        const chartData = [
          { name: "R", value: resultado.riasec?.R || 0 },
          { name: "I", value: resultado.riasec?.I || 0 },
          { name: "A", value: resultado.riasec?.A || 0 },
          { name: "S", value: resultado.riasec?.S || 0 },
          { name: "E", value: resultado.riasec?.E || 0 },
          { name: "C", value: resultado.riasec?.C || 0 },
        ];

        return (
          <div
            key={resultado.id}
            style={{
              marginBottom: 30,
              padding: 16,
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,.05)",
            }}
          >
            <h3>{resultado.title}</h3>

            <p>
              Perfil dominante: <b>{resultado.dominante}</b>
            </p>

            <BarChart width={350} height={220} data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>

            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <button
                onClick={() => navigate(`/resultados/${resultado.id}`)}
                style={btnStyle}
              >
                Ver mais
              </button>

              <button
                onClick={() => apagarResultado(resultado.id)}
                style={{ ...btnStyle, background: "#ef4444" }}
              >
                Apagar
              </button>
            </div>
          </div>
        );
      })}

      <Footer />
    </div>
  );
}

const btnStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  cursor: "pointer",
};