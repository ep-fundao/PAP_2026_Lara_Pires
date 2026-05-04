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


const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

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
És um psicólogo vocacional especialista no modelo RIASEC.

Quero um relatório MUITO preciso, estruturado e diferenciado.

REGRAS IMPORTANTES:

1. Tens de ordenar claramente os 6 tipos RIASEC do mais forte para o mais fraco.
2. NÃO podes empatar tipos sem explicação.
3. Tens de identificar:
   - 1 tipo dominante claro
   - 1 tipo secundário forte
   - 1 tipo complementar médio
   - restantes baixos

4. Mesmo que um tipo seja baixo, se tiver sinais relevantes tens de explicar isso no relatório.

5. O relatório tem de ser analítico, não genérico.

6. Tens de justificar CADA tipo com base na conversa.

7. Não podes repetir frases tipo "interesse moderado" sem explicar.

8. O output JSON OBRIGATÓRIO:

{
  "dominante": "",
  "ranking": [
    {"tipo":"R","score":0,"analise":""},
    {"tipo":"I","score":0,"analise":""},
    {"tipo":"A","score":0,"analise":""},
    {"tipo":"S","score":0,"analise":""},
    {"tipo":"E","score":0,"analise":""},
    {"tipo":"C","score":0,"analise":""}
  ],
  "topAreas": [],
  "relatorio": "",
  "cursos": [],
  "profissoes": []
}

9. O "relatorio" deve explicar:
- porque o dominante é dominante
- porque o 2º e 3º também são relevantes
- e porque os outros não dominam

10. Português de Portugal.
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