import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function ResultadoDetalhe() {
  const { resultadoId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  useEffect(() => {
    async function carregar() {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid, "resultados", resultadoId);
      const snap = await getDoc(ref);

      if (snap.exists()) setData(snap.data());
    }

    carregar();
  }, [resultadoId]);

  if (!data) return <p style={{ padding: 30 }}>A carregar...</p>;

  const chartData = [
    { name: "R", value: data.riasec?.R || 0 },
    { name: "I", value: data.riasec?.I || 0 },
    { name: "A", value: data.riasec?.A || 0 },
    { name: "S", value: data.riasec?.S || 0 },
    { name: "E", value: data.riasec?.E || 0 },
    { name: "C", value: data.riasec?.C || 0 },
  ];

  return (
    <div style={{ padding: 30 }}>
      
      {/* 🔙 VOLTAR */}
      <button
        onClick={() => navigate("/resultados")}
        style={{
          marginBottom: 20,
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "#111",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        ← Voltar
      </button>

      <h1>{data.title}</h1>
      <h2>Perfil dominante: {data.dominante}</h2>

      <BarChart width={500} height={300} data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" />
      </BarChart>

      <h3>Relatório completo</h3>
      <p style={{ whiteSpace: "pre-line" }}>{data.relatorio}</p>

      <h3>Cursos</h3>
      <ul>
        {data.cursos?.map((c, i) => <li key={i}>{c}</li>)}
      </ul>

      <h3>Profissões</h3>
      <ul>
        {data.profissoes?.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    </div>
  );
}