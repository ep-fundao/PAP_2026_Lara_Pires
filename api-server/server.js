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
 * MODELO RIASEC BASE (mantido para cálculo final)
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
 * 🔥 SISTEMA DE SCORES RIASEC (CORRIGIDO)
 */
function calcularScores(history = []) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  let userIndex = 0;

  history.forEach((msg) => {
    if (msg.from !== "user") return;

    const question = QUESTIONS[userIndex];
    if (!question) return;

    const text = (msg.text || "").toLowerCase().trim();

    let value = 0;

    if (["sim", "gosto", "claro"].some(w => text.includes(w))) {
      value = 2;
    } 
    else if (["talvez", "às vezes", "depende"].some(w => text.includes(w))) {
      value = 1;
    } 
    else if (["não sei", "nao sei", "sei lá", "nao tenho a certeza"].some(w => text.includes(w))) {
      value = 0;
    }

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
 * 🤖 IA PSICOLÓGICA (NOVA LÓGICA)
 */
async function buildAIReply(message, history = []) {
  const systemPrompt = `
És um psicólogo de orientação vocacional especializado no modelo RIASEC.

Objetivo:
- Conversar naturalmente com o utilizador
- Entender interesses, personalidade e motivações
- Fazer perguntas adaptativas (não fixas)
- Reformular perguntas se o utilizador não souber responder
- Evitar repetição
- Ser empático e humano

Regras:
- Nunca faças perguntas iguais
- Adapta-te à resposta anterior
- Se o utilizador disser "não sei", ajuda com exemplos
- Mantém conversa fluida

Responde SEMPRE em JSON:
{
  "reply": "mensagem para o utilizador",
  "focus": "R|I|A|S|E|C ou null"
}
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: String(m.text || "")
      })),
        { role: "user", content: message }
      ],
      temperature: 0.7
    }),
  });

  const data = await response.json();

  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) {
    return { reply: "Não consegui processar a tua resposta. Podes reformular?" };
  }

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { reply: raw };
  }
}

/**
 * RESULTADO FINAL (RIASEC)
 */
async function gerarResultado(history) {
  const scores = calcularScores(history);

  const messages = [
    {
      role: "system",
      content: `
És um orientador vocacional especializado em RIASEC.

Gera um relatório profissional em português de Portugal.

Responde APENAS em JSON:
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
    }),
  });

  const data = await response.json();

  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) throw new Error("Sem resposta da IA");

  const cleaned = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}

/**
 * API PRINCIPAL
 */
app.post("/api/chatai", async (req, res) => {
  try {
    const { message = "", history = [], mode = "chat" } = req.body;

    /**
     * 💬 CHAT IA (NOVO SISTEMA INTELIGENTE)
     */
if (mode === "chat") {
  const resposta = await buildAIReply(message, history);

  return res.json({
    reply: resposta.reply,
    focus: resposta.focus || null
  });
}

    /**
     * 📊 RESULTADO FINAL RIASEC
     */
    if (mode === "resultado") {
      const resultado = await gerarResultado(history);
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