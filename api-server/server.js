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

/* =====================================================
   CONFIG
===================================================== */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

/* =====================================================
   HELPERS
===================================================== */

function userMessages(history = []) {
  return history.filter((m) => m.from === "user");
}

function botMessages(history = []) {
  return history.filter((m) => m.from === "bot");
}

function countUserAnswers(history = []) {
  return userMessages(history).length;
}

function buildConversation(history = []) {
  return history
    .map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }))
    .slice(-20);
}

async function askAI(messages, temperature = 0.7, max_tokens = 500) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao contactar OpenRouter."
    );
  }

  return data?.choices?.[0]?.message?.content || "";
}

/* =====================================================
   CHAT MODE
===================================================== */

async function gerarPerguntaIA(history = []) {
  const respostas = countUserAnswers(history);

  const systemPrompt = `
És uma IA especialista em orientação vocacional e psicologia de carreira.

O teu trabalho é conversar naturalmente com o utilizador e descobrir o seu perfil profissional.

REGRAS IMPORTANTES:

1. Faz APENAS uma pergunta de cada vez.
2. Nunca repitas perguntas já feitas.
3. Adapta a próxima pergunta às respostas anteriores.
4. Fala como um psicólogo profissional e acolhedor.
5. Usa português de Portugal.
6. Perguntas curtas e inteligentes.
7. Explora:
- gostos
- personalidade
- liderança
- criatividade
- lógica
- rotina
- trabalho em equipa
- autonomia
- pressão
- ambiente ideal
8. NÃO dês resultado ainda.
9. Quando já existirem ${respostas} respostas, continua a aprofundar.
10. Responde APENAS com a próxima pergunta.

Exemplo:
"Preferes resolver problemas complexos ou trabalhar diretamente com pessoas?"
`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...buildConversation(history),
  ];

  return await askAI(messages, 0.8, 180);
}

/* =====================================================
   RESULTADO MODE
===================================================== */

async function gerarResultadoIA(history = []) {
  const textoConversa = history
    .map((m) => `${m.from === "user" ? "Utilizador" : "IA"}: ${m.text}`)
    .join("\n");

  const systemPrompt = `
És um especialista em orientação vocacional baseado no modelo RIASEC.

Analisa toda a conversa entre IA e utilizador.

Quero um relatório PROFISSIONAL e realista.

Responde APENAS em JSON válido:

{
  "dominante": "tipo principal",
  "riasec": {
    "R": 0,
    "I": 0,
    "A": 0,
    "S": 0,
    "E": 0,
    "C": 0
  },
  "topAreas": ["area1","area2","area3"],
  "relatorio": "texto completo detalhado",
  "cursos": ["curso1","curso2","curso3","curso4"],
  "profissoes": ["profissao1","profissao2","profissao3","profissao4"]
}

Notas:
- valores de 0 a 100
- relatório profundo
- português de Portugal
- coerente com a conversa
`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: textoConversa },
  ];

  const raw = await askAI(messages, 0.4, 1200);

  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(cleaned);
}

/* =====================================================
   ROUTE
===================================================== */

app.post("/api/chatai", async (req, res) => {
  try {
    const {
      mode = "chat",
      history = [],
      message = "",
    } = req.body;

    /* ================= CHAT ================= */
    if (mode === "chat") {
      const respostas = countUserAnswers(history);

      // Primeira mensagem
      if (respostas === 0) {
        return res.json({
          reply:
            "Olá. Sou a tua IA de orientação vocacional. Para começar, fala-me um pouco sobre ti e sobre o que gostas de fazer no teu dia a dia.",
        });
      }

      // após 10 respostas terminar chat
      if (respostas >= 10) {
        return res.json({
          reply:
            "Excelente. Já reuni informação suficiente para gerar a tua análise vocacional completa. Consulta a área Resultados.",
        });
      }

      const pergunta = await gerarPerguntaIA(history);

      return res.json({
        reply: pergunta,
      });
    }

    /* ================= RESULTADO ================= */
    if (mode === "resultado") {
      const resultado = await gerarResultadoIA(history);

      return res.json({
        resultado,
      });
    }

    return res.status(400).json({
      error: "Modo inválido.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro na IA.",
    });
  }
});

/* =====================================================
   START
===================================================== */

app.listen(process.env.PORT || 3001, () => {
  console.log(
    `Servidor IA ativo na porta ${process.env.PORT || 3001}`
  );
});