import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/healthz", (_, res) => {
  res.status(200).send("ok");
});

/**
 * PERGUNTAS FIXAS DO CHAT (RIASEC)
 */
export const QUESTIONS = [
  { text: "Gostas de trabalhar com ferramentas ou atividades práticas?", type: "R" },
  { text: "Sentes curiosidade em perceber como as coisas funcionam?", type: "I" },
  { text: "Gostas de atividades criativas como escrever, desenhar ou criar?", type: "A" },
  { text: "Gostas de ajudar e apoiar outras pessoas?", type: "S" },
  { text: "Gostas de liderar ou tomar decisões em grupo?", type: "E" },
  { text: "Preferes tarefas organizadas e com regras bem definidas?", type: "C" },
  { text: "Preferes atividades físicas e práticas em vez de teóricas?", type: "R" },
  { text: "Gostas de resolver problemas complexos e analisar informação?", type: "I" },
  { text: "Sentes-te confortável a expressar ideias criativas?", type: "A" },
  { text: "Sentes empatia e facilidade em comunicar com os outros?", type: "S" },
  { text: "Tens iniciativa para criar projetos ou negócios?", type: "E" },
  { text: "És uma pessoa organizada e metódica?", type: "C" }
];

/**
 * CALCULAR SCORES RIASEC (🔥 NOVO)
 */
function calcularScores(history = []) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  let userIndex = 0;

  history.forEach((msg) => {
    if (msg.from !== "user") return;

    const question = QUESTIONS[userIndex];
    if (!question) return;

    const text = msg.text.toLowerCase();

    let value = 0;
    if (text.includes("sim")) value = 2;
    else if (text.includes("talvez")) value = 1;

    scores[question.type] += value;

    userIndex++;
  });

  return scores;
}

/**
 * Conta mensagens do user
 */
function countUserMessages(history = []) {
  return history.filter((m) => m.from === "user").length;
}

/**
 * Próxima pergunta
 */
function getNextQuestion(history = []) {
  const userCount = countUserMessages(history);

  if (userCount < QUESTIONS.length) {
    return QUESTIONS[userCount];
  }

  return null;
}

/**
 * Fluxo do chat
 */
function buildChatReply(message, history = []) {
  const userCount = countUserMessages(history);

  if (userCount === 1) {
    return QUESTIONS[0];
  }

  const nextQuestion = getNextQuestion(history);

  if (nextQuestion) {
    return nextQuestion;
  }

  return "Já reuni informação suficiente para gerar a tua análise vocacional. Consulta a secção Resultados.";
}

/**
 * API
 */
app.post("/api/chatai", async (req, res) => {
  try {
    const { message = "", history = [], mode = "chat" } = req.body;

    // ==========================
    // MODO CHAT
    // ==========================
    if (mode === "chat") {
      const reply = buildChatReply(message, history);

      return res.json({
        reply: typeof reply === "string" ? reply : reply.text
      });
    }

    // ==========================
    // MODO RESULTADO
    // ==========================
    if (mode === "resultado") {

      // 🔥 CALCULAR SCORES REAIS
      const scores = calcularScores(history);

      const messages = [
        {
          role: "system",
          content: `
És um orientador vocacional especializado no modelo RIASEC.

Recebeste um perfil com pontuações RIASEC.

Gera um relatório profissional em português de Portugal.

Responde APENAS em JSON válido com:
- dominante
- riasec
- topAreas
- relatorio
- cursos
- profissoes
          `.trim(),
        },
        {
          role: "user",
          content: JSON.stringify(scores),
        },
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo",
          messages,
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || "Erro no OpenRouter.",
        });
      }

      const rawReply = data?.choices?.[0]?.message?.content;

      if (!rawReply) {
        return res.status(500).json({
          error: "A IA não devolveu um resultado.",
        });
      }

      let resultado;
      try {
        // 🔥 REMOVE ```json
        const cleaned = rawReply.trim().replace(/```json|```/g, "");
        resultado = JSON.parse(cleaned);
      } catch (e) {
        console.error("JSON inválido:", rawReply);
        return res.status(500).json({
          error: "A IA não devolveu JSON válido.",
        });
      }

      return res.json({ resultado });
    }

    return res.status(400).json({ error: "Modo inválido." });

  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({ error: "Erro na IA." });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor da IA a correr na porta ${process.env.PORT || 3001}`);
});