import { useEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const BOT_WELCOME = {
  from: "bot",
  text: "Olá. Sou a tua IA de orientação vocacional. Vou conversar contigo para descobrir o teu perfil profissional. Comecemos: qual a tua discilpina preferida na escola",
  createdAt: new Date().toISOString(),
};

export default function Chat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState("");

  // ================= AUTH =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(u);
      await carregarChats(u.uid);
      setAuthLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ================= FIREBASE =================
  async function carregarChats(uid) {
    try {
      const q = query(
        collection(db, "users", uid, "chats"),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);

      const lista = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setChats(lista);

      if (lista.length > 0) {
        const existe = lista.find((c) => c.id === activeChatId);

        if (existe) {
          await abrirChat(uid, activeChatId);
        } else {
          await abrirChat(uid, lista[0].id);
        }
      } else {
        setChats([]);
        setMessages([]);
        setActiveChatId(null);
      }
    } catch (error) {
      console.error("Erro carregar chats:", error);
    }
  }

  async function criarNovoChat(uid) {
    const ref = await addDoc(collection(db, "users", uid, "chats"), {
      title: "Nova conversa",
      messages: [BOT_WELCOME],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  }

  async function abrirChat(uid, chatId) {
    try {
      const ref = doc(db, "users", uid, "chats", chatId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        setActiveChatId(chatId);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Erro abrir chat:", error);
    }
  }

  async function guardarMensagens(uid, chatId, novasMensagens, titulo = null) {
    const ref = doc(db, "users", uid, "chats", chatId);

    const payload = {
      messages: novasMensagens,
      updatedAt: serverTimestamp(),
    };

    if (titulo) payload.title = titulo;

    await updateDoc(ref, payload);
  }

  // ================= UTIL =================
  function contarMensagensUser(lista) {
    return lista.filter((m) => m.from === "user").length;
  }

  function gerarNomeResultado() {
    const agora = new Date();

    const data = agora.toLocaleDateString("pt-PT");

    const hora = agora.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `Análise RIASEC — ${data}, ${hora}`;
  }

  // ================= RESULTADO =================
  async function criarResultadoRiasec(uid, chatId, mensagens) {
    try {
      const response = await fetch(`${API_URL}/api/chatai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "resultado",
          history: mensagens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro gerar resultado.");
      }

      const resultado = data.resultado;
      const title = gerarNomeResultado();

      await addDoc(collection(db, "users", uid, "resultados"), {
        title,
        chatId,
        dominante: resultado.dominante,
        riasec: resultado.riasec,
        topAreas: resultado.topAreas,
        relatorio: resultado.relatorio,
        cursos: resultado.cursos,
        profissoes: resultado.profissoes,
        createdAt: serverTimestamp(),
      });

      return title;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // ================= NOVO CHAT =================
  async function handleNovoChat() {
    if (!user) return;

    try {
      const novoId = await criarNovoChat(user.uid);

      setActiveChatId(novoId);
      setMessages([BOT_WELCOME]);

      await carregarChats(user.uid);
      await abrirChat(user.uid, novoId);
    } catch (error) {
      console.error(error);
    }
  }

  // ================= ENVIAR =================
  async function enviarMensagem() {
    if (!input.trim() || !user || loading) return;

    let chatId = activeChatId;
    let currentMessages = [...messages];

    if (!chatId) {
      chatId = await criarNovoChat(user.uid);
      setActiveChatId(chatId);
      currentMessages = [BOT_WELCOME];
    }

    const texto = input.trim();

    const mensagemUser = {
      from: "user",
      text: texto,
      createdAt: new Date().toISOString(),
    };

    const mensagensAtualizadas = [...currentMessages, mensagemUser];

    setMessages(mensagensAtualizadas);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chatai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "chat",
          message: texto,
          history: mensagensAtualizadas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro IA.");
      }

      const respostaIA = {
        from: "bot",
        text:
          typeof data.reply === "string"
            ? data.reply
            : data.reply?.text || JSON.stringify(data.reply),
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...mensagensAtualizadas, respostaIA];

      setMessages(finalMessages);

      const chatAtual = chats.find((c) => c.id === chatId);

      const precisaTitulo =
        !chatAtual || chatAtual.title === "Nova conversa";

      const totalUser = contarMensagensUser(finalMessages);

      // quando chegar a 10 respostas do user cria resultado
      if (totalUser >= 10) {
        const nomeResultado = await criarResultadoRiasec(
          user.uid,
          chatId,
          finalMessages
        );

        if (nomeResultado) {
          const aviso = {
            from: "bot",
            text:
              `A tua análise vocacional está pronta.\n\n` +
              `Consulta a área Resultados.\n` +
              `Nome: ${nomeResultado}`,
            createdAt: new Date().toISOString(),
          };

          const finalAviso = [...finalMessages, aviso];

          setMessages(finalAviso);

          await guardarMensagens(
            user.uid,
            chatId,
            finalAviso,
            precisaTitulo ? texto.slice(0, 40) : null
          );

          await carregarChats(user.uid);
          return;
        }
      }

      await guardarMensagens(
        user.uid,
        chatId,
        finalMessages,
        precisaTitulo ? texto.slice(0, 40) : null
      );

      await carregarChats(user.uid);
    } catch (error) {
      console.error(error);

      const erroMsg = {
        from: "bot",
        text: "Erro ao contactar a IA.",
        createdAt: new Date().toISOString(),
      };

      const finalErro = [...mensagensAtualizadas, erroMsg];

      setMessages(finalErro);

      await guardarMensagens(user.uid, chatId, finalErro);
      await carregarChats(user.uid);
    } finally {
      setLoading(false);
    }
  }

  // ================= APAGAR =================
  function abrirModalApagar(chat) {
    setChatToDelete(chat);
    setDeleteModalOpen(true);
  }

  function fecharModalApagar() {
    setDeleteModalOpen(false);
    setChatToDelete(null);
  }

  async function confirmarApagarChat() {
    if (!user || !chatToDelete) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "chats", chatToDelete.id));

      fecharModalApagar();

      await carregarChats(user.uid);
    } catch (error) {
      console.error(error);
    }
  }

  // ================= RENOMEAR =================
  function abrirModalRenomear(chat) {
    setChatToRename(chat);
    setNewChatTitle(chat.title || "");
    setRenameModalOpen(true);
  }

  function fecharModalRenomear() {
    setRenameModalOpen(false);
    setChatToRename(null);
    setNewChatTitle("");
  }

  async function confirmarRenomearChat() {
    if (!user || !chatToRename || !newChatTitle.trim()) return;

    try {
      await updateDoc(doc(db, "users", user.uid, "chats", chatToRename.id), {
        title: newChatTitle.trim(),
        updatedAt: serverTimestamp(),
      });

      fecharModalRenomear();
      await carregarChats(user.uid);
    } catch (error) {
      console.error(error);
    }
  }

  // ================= LOADING =================
  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.center}>
          <p>A carregar...</p>
        </div>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTop}>
            <div>
              <h2 style={styles.sidebarTitle}>Conversas</h2>
              <p style={styles.sidebarSubtitle}>Histórico guardado</p>
            </div>

            <button onClick={handleNovoChat} style={styles.newChatBtn}>
              + Nova
            </button>
          </div>

          <div style={styles.chatList}>
            {chats.map((chat) => (
              <div
                key={chat.id}
                style={{
                  ...styles.chatItemWrap,
                  ...(activeChatId === chat.id
                    ? styles.chatItemWrapActive
                    : {}),
                }}
              >
                <button
                  style={styles.chatItem}
                  onClick={() => abrirChat(user.uid, chat.id)}
                >
                  <div style={styles.chatItemTitle}>
                    {chat.title || "Nova conversa"}
                  </div>
                </button>

                <div style={styles.chatActions}>
                  <button
                    style={styles.iconBtn}
                    onClick={() => abrirModalRenomear(chat)}
                  >
                    ✏️
                  </button>

                  <button
                    style={styles.iconBtn}
                    onClick={() => abrirModalApagar(chat)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main style={styles.chatArea}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Chat IA</h1>
              <p style={styles.subtitle}>
                Orientação vocacional inteligente
              </p>
            </div>

            <div style={styles.headerBadge}>
              <span style={styles.dot}></span>
              Online
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    m.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(m.from === "user"
                      ? styles.userBubble
                      : styles.botBubble),
                  }}
                >
                  {m.from === "bot" && (
                    <div style={styles.botLabel}>IA</div>
                  )}

                  {typeof m.text === "string"
                    ? m.text
                    : JSON.stringify(m.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex" }}>
                <div style={{ ...styles.bubble, ...styles.botBubble }}>
                  <div style={styles.botLabel}>IA</div>

                  <div style={styles.typing}>
                    <span style={styles.typingDot}></span>
                    <span style={styles.typingDot}></span>
                    <span style={styles.typingDot}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          <div style={styles.inputBar}>
            <input
              style={styles.input}
              placeholder="Escreve a tua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enviarMensagem();
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
        </main>
      </div>

      <Footer />

      {/* MODAL APAGAR */}
      {deleteModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3>Apagar conversa?</h3>

            <div style={styles.modalActions}>
              <button onClick={fecharModalApagar}>
                Cancelar
              </button>

              <button onClick={confirmarApagarChat}>
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RENOMEAR */}
      {renameModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3>Renomear conversa</h3>

            <input
              value={newChatTitle}
              onChange={(e) =>
                setNewChatTitle(e.target.value)
              }
            />

            <div style={styles.modalActions}>
              <button onClick={fecharModalRenomear}>
                Cancelar
              </button>

              <button onClick={confirmarRenomearChat}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(99,102,241,.12), transparent 25%), radial-gradient(circle at bottom right, rgba(168,85,247,.12), transparent 25%), #f6f7fb",
    padding: "22px 16px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  bgOrbOne: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(79,70,229,.15)",
    filter: "blur(90px)",
  },
  bgOrbTwo: {
    position: "absolute",
    bottom: 0,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "rgba(168,85,247,.12)",
    filter: "blur(100px)",
  },
  center: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  loader: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "3px solid rgba(79,70,229,.20)",
    borderTopColor: "#4f46e5",
    animation: "spin 1s linear infinite",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: 18,
    maxWidth: 1320,
    margin: "0 auto",
    height: "calc(100vh - 126px)",
    position: "relative",
    zIndex: 1,
  },
  sidebar: {
    background: "rgba(255,255,255,.88)",
    backdropFilter: "blur(18px)",
    borderRadius: 26,
    padding: 16,
    boxShadow: "0 20px 60px rgba(17,24,39,.10)",
    border: "1px solid rgba(255,255,255,.6)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  sidebarTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 22,
    color: "#111827",
  },
  sidebarSubtitle: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 600,
  },
  newChatBtn: {
    padding: "10px 14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(79,70,229,.25)",
    whiteSpace: "nowrap",
  },
  chatList: {
    overflowY: "auto",
    paddingRight: 2,
  },
  emptyState: {
    background: "rgba(17,24,39,.04)",
    border: "1px dashed rgba(17,24,39,.10)",
    borderRadius: 18,
    padding: 20,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 700,
  },
  chatItemWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    padding: 6,
    marginBottom: 8,
    border: "1px solid transparent",
    transition: "all .2s ease",
  },
  chatItemWrapActive: {
    background: "rgba(79,70,229,.08)",
    border: "1px solid rgba(79,70,229,.12)",
  },
  chatItem: {
    flex: 1,
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: 12,
  },
  chatItemTitle: {
    color: "#111827",
    fontWeight: 800,
    fontSize: 14,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  chatActions: {
    display: "flex",
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "none",
    background: "rgba(17,24,39,.06)",
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatArea: {
    background: "rgba(255,255,255,.90)",
    backdropFilter: "blur(18px)",
    borderRadius: 26,
    boxShadow: "0 20px 60px rgba(17,24,39,.10)",
    border: "1px solid rgba(255,255,255,.6)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "22px 22px 14px",
    borderBottom: "1px solid rgba(17,24,39,.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 30,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontWeight: 600,
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(16,185,129,.10)",
    color: "#047857",
    fontWeight: 800,
    fontSize: 13,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#10b981",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  emptyChat: {
    margin: "auto",
    textAlign: "center",
    background: "rgba(17,24,39,.04)",
    border: "1px dashed rgba(17,24,39,.10)",
    borderRadius: 24,
    padding: 30,
    maxWidth: 450,
  },
  emptyChatIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  messageRow: {
    display: "flex",
  },
  bubble: {
    maxWidth: "74%",
    padding: "14px 16px",
    borderRadius: 22,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 14,
    boxShadow: "0 10px 24px rgba(0,0,0,.05)",
  },
  userBubble: {
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "#fff",
    borderBottomRightRadius: 8,
  },
  botBubble: {
    background: "#ffffff",
    color: "#111827",
    border: "1px solid rgba(17,24,39,.06)",
    borderBottomLeftRadius: 8,
  },
  botLabel: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: ".04em",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  typing: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    height: 16,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#9ca3af",
    display: "inline-block",
  },
  inputBar: {
    display: "flex",
    gap: 12,
    padding: 16,
    borderTop: "1px solid rgba(17,24,39,.06)",
    background: "rgba(255,255,255,.94)",
  },
  input: {
    flex: 1,
    padding: "14px 16px",
    borderRadius: 18,
    border: "1px solid rgba(17,24,39,.10)",
    outline: "none",
    fontSize: 14,
    background: "#fff",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,.03)",
  },
  sendBtn: {
    padding: "14px 18px",
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(79,70,229,.25)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,24,39,.42)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 440,
    background: "#fff",
    borderRadius: 26,
    padding: 24,
    boxShadow: "0 30px 90px rgba(0,0,0,.20)",
    textAlign: "center",
  },
  modalIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  modalTitle: {
    margin: 0,
    fontSize: 24,
    color: "#111827",
  },
  modalText: {
    color: "#6b7280",
    lineHeight: 1.6,
    marginTop: 10,
    marginBottom: 18,
    fontWeight: 600,
  },
  modalInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,.12)",
    outline: "none",
    marginBottom: 16,
    fontSize: 14,
  },
  modalActions: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  cancelBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,.10)",
    background: "#fff",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "none",
    background: "#e11d48",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  saveBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};