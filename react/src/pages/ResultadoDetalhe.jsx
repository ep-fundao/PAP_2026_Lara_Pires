import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ResultadoDetalhe() {
  const { resultadoId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function carregar() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const ref = doc(db, "users", user.uid, "resultados", resultadoId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setData(snap.data());
        }
      } catch (e) {
        console.error("Erro ao carregar detalhe:", e);
      }
    }

    carregar();
  }, [resultadoId]);

  if (!data) {
    return (
      <div style={{ padding: 30 }}>
        <p>A carregar resultado...</p>
      </div>
    );
  }

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
      <h1>{data.title || "Resultado"}</h1>

      <h2>Perfil dominante: {data.dominante}</h2>

      {/* ✅ GRÁFICO SEGURO */}
      <BarChart width={500} height={300} data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" />
      </BarChart>

      <h3>Relatório</h3>
      <p>{data.relatorio}</p>

      <h3>Cursos</h3>
      <ul>
        {data.cursos?.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <h3>Profissões</h3>
      <ul>
        {data.profissoes?.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}