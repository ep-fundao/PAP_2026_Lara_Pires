import { useState } from "react";
import Footer from "../components/Footer";

export default function Chat() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Olá! Sou a tua IA de orientação vocacional. Em que te posso ajudar?"
    }
  ]);

  async function enviarMensagem() {
    if (!input.trim()) return;

    const userText = input;

    const mensagemUser = {
      from: "user",
      text: userText
    };

    setMessages((prev) => [...prev, mensagemUser]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/chatai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText
        })
      });

      const data = await response.json();

      const respostaIA = {
        from: "bot",
        text: data.reply || "Sem resposta da IA."
      };

      setMessages((prev) => [...prev, respostaIA]);
    } catch (error) {
      console.error("Erro ao contactar a IA:", error);

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Erro ao contactar a IA."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.chatWrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Chat IA</h1>
          <p style={styles.subtitle}>Explora a tua vocação profissional</p>
        </div>

        <div style={styles.messages}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent: m.from === "user" ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.from === "user" ? styles.userBubble : styles.botBubble)
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.botBubble }}>
                A pensar...
              </div>
            </div>
          )}
        </div>

        <div style={styles.inputBar}>
          <input
            style={styles.input}
            type="text"
            placeholder="Escreve a tua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                enviarMensagem();
              }
            }}
          />

          <button
            style={styles.sendBtn}
            onClick={enviarMensagem}
            disabled={loading}
          >
            Enviar
          </button>
        </div>
      </div>

      <div style={{ height: 90 }} />
      <Footer />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "20px 14px",
    boxSizing: "border-box"
  },
  chatWrapper: {
    maxWidth: 900,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 14px 40px rgba(0,0,0,.08)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 140px)"
  },
  header: {
    padding: "18px 18px 10px",
    borderBottom: "1px solid rgba(17,24,39,.08)"
  },
  title: {
    margin: 0,
    fontSize: 24
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280"
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  messageRow: {
    display: "flex"
  },
  bubble: {
    maxWidth: "75%",
    padding: "12px 14px",
    borderRadius: 16,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  userBubble: {
    background: "#4f46e5",
    color: "#fff",
    borderBottomRightRadius: 6
  },
  botBubble: {
    background: "#f3f4f6",
    color: "#111827",
    borderBottomLeftRadius: 6
  },
  inputBar: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop: "1px solid rgba(17,24,39,.08)",
    background: "#fff"
  },
  input: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,.12)",
    outline: "none"
  },
  sendBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer"
  }
};