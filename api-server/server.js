import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/chatai", async (req, res) => {

  const { message } = req.body;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: "És um orientador vocacional especializado em ajudar jovens a descobrir a sua vocação profissional. Responde apenas sobre carreira, cursos e vocação profissional. Responde sempre em português de Portugal."
        },
        {
          role: "user",
          content: message
        }
      ]
    })
  });

  const data = await response.json();

  res.json({
    reply: data.choices[0].message.content
  });

});

app.listen(3001, () => {
  console.log("Servidor da IA a correr na porta 3001");
});