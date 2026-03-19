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

app.post("/api/chatai", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const messages = [
      {
        role: "system",
        content:
          "És um orientador vocacional especializado em ajudar jovens a descobrir a sua vocação profissional. Responde apenas sobre carreira, cursos, vocação profissional, áreas de estudo, competências e orientação. Responde sempre em português de Portugal, de forma clara e estruturada."
      },
      ...history.map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/auto",
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Erro no OpenRouter.",
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "Sem resposta da IA.";

    res.json({ reply });
  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({ error: "Erro na IA." });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor da IA a correr na porta ${process.env.PORT || 3001}`);
});