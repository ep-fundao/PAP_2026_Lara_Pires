const { useState } = React;

// Escala padrão 1-4
const scaleOptions = [
  { value: 1, label: "1 — Nada" },
  { value: 2, label: "2 — Pouco" },
  { value: 3, label: "3 — Moderado" },
  { value: 4, label: "4 — Muito" },
];

const questions = [
  // --- Interesses RIASEC (1-28) ---
  { id: 1, text: "Gostaria de trabalhar com ferramentas, máquinas ou equipamentos.", dimension: "R", type: "scale" },
  { id: 2, text: "Interessa-me montar, reparar ou construir objetos.", dimension: "R", type: "scale" },
  { id: 3, text: "Gosto de atividades práticas ao ar livre ou em oficinas.", dimension: "R", type: "scale" },
  { id: 4, text: "Gosto de resolver problemas complexos ou lógicos.", dimension: "I", type: "scale" },
  { id: 5, text: "Interessa-me compreender como as coisas funcionam por dentro.", dimension: "I", type: "scale" },
  { id: 6, text: "Gosto de investigar, analisar dados ou testar hipóteses.", dimension: "I", type: "scale" },
  { id: 7, text: "Gosto de criar design, arte ou conteúdos visuais/sonoros.", dimension: "A", type: "scale" },
  { id: 8, text: "Sinto-me motivado/a em atividades que exigem criatividade.", dimension: "A", type: "scale" },
  { id: 9, text: "Aprecio expressar ideias de forma original ou não convencional.", dimension: "A", type: "scale" },
  { id: 10, text: "Gosto de ajudar colegas, explicar ou ensinar conceitos.", dimension: "S", type: "scale" },
  { id: 11, text: "Sinto satisfação quando contribuo para o bem-estar de outras pessoas.", dimension: "S", type: "scale" },
  { id: 12, text: "Gosto de participar em projetos de grupo ou voluntariado.", dimension: "S", type: "scale" },
  { id: 13, text: "Gosto de liderar projetos, apresentar ideias ou influenciar decisões.", dimension: "E", type: "scale" },
  { id: 14, text: "Interessa-me organizar eventos, campanhas ou iniciativas.", dimension: "E", type: "scale" },
  { id: 15, text: "Sinto interesse em gerir negócios, vendas ou comunicação.", dimension: "E", type: "scale" },
  { id: 16, text: "Gosto de organizar informação, tabelas, documentos ou dados.", dimension: "C", type: "scale" },
  { id: 17, text: "Prefiro tarefas com regras claras e procedimentos definidos.", dimension: "C", type: "scale" },
  { id: 18, text: "Sinto-me bem em ambientes estruturados e previsíveis.", dimension: "C", type: "scale" },
  { id: 19, text: "Tenho facilidade em aprender ferramentas digitais ou software.", dimension: "Tech", type: "scale" },
  { id: 20, text: "Sou persistente quando tenho de resolver um problema difícil.", dimension: "Tech", type: "scale" },
  { id: 21, text: "Tenho criatividade para propor novas ideias ou soluções.", dimension: "General", type: "scale" },
  { id: 22, text: "Tenho boa capacidade de comunicação com diferentes pessoas.", dimension: "Soc", type: "scale" },
  { id: 23, text: "Consigo trabalhar bem em equipa.", dimension: "Soc", type: "scale" },
  { id: 24, text: "Tenho capacidade de organização e gestão do tempo.", dimension: "Org", type: "scale" },
  { id: 25, text: "Sou capaz de trabalhar autonomamente sem supervisão constante.", dimension: "Org", type: "scale" },
  { id: 26, text: "Tenho atenção ao detalhe e cuidado com precisão.", dimension: "Tech", type: "scale" },
  { id: 27, text: "Consigo tomar decisões rapidamente quando preciso.", dimension: "Soc", type: "scale" },
  { id: 28, text: "Sou bom a compreender instruções e segui-las corretamente.", dimension: "Org", type: "scale" },

  // Preferências (29–34 agora com escala)
  { id: 29, text: "Prefiro ambientes calmos e estruturados.", dimension: "Ambiente_Calmo", type: "scale" },
  { id: 30, text: "Prefiro ambientes dinâmicos e com muita interação.", dimension: "Ambiente_Dinamico", type: "scale" },
  { id: 31, text: "Gosto de trabalhar em interior, com computador.", dimension: "Interior", type: "scale" },
  { id: 32, text: "Gosto de trabalhar em exterior ou em movimento.", dimension: "Exterior", type: "scale" },
  { id: 33, text: "Prefiro trabalhos criativos e flexíveis.", dimension: "Criatividade", type: "scale" },
  { id: 34, text: "Prefiro trabalhos com regras claras e objetivos definidos.", dimension: "Estruturado", type: "scale" },

  // Selects
  { id: 35, text: "Depois do 12.º ano, gostaria de:", dimension: "Objetivo", type: "select",
    options: ["Trabalhar", "Estudar mais", "Não sei"] },

  { id: 36, text: "O que valorizo mais numa área profissional?", dimension: "Valores", type: "select",
    options: ["Estabilidade", "Criatividade", "Remuneração", "Ajudar pessoas", "Tecnologia", "Variedade", "Outro"] },

  // Exercícios
  { id: "E1", text: "Complete a sequência: 2, 4, 8, 16, __", dimension: "I", type: "text" },
  { id: "E2", text: "Quantos símbolos '@' existem nesta sequência? @ # @ * & @ % * @ # & @ @ % $ @ ^ @", dimension: "C", type: "text" },
  { id: "E3", text: "Imagina que tens de criar um logótipo para um projeto de sustentabilidade. Que ideia desenharias?", dimension: "A", type: "textarea" }
];

function Questionario() {
  const [personal, setPersonal] = useState({ nome: "", genero: "", nascimento: "" });
  const [answers, setAnswers] = useState({});

  const handlePersonalChange = (e) => {
    setPersonal({...personal, [e.target.name]: e.target.value});
  };

const handleScaleChange = (qId, value) => {
  setAnswers(prev => ({ 
    ...prev, 
    [qId]: value 
  }));
};

  const handleChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const user_id = localStorage.getItem("uid");
    const unanswered = questions
  .filter(q => q.type === "scale")
  .some(q => !answers[q.id]);

if (unanswered) {
  alert("Por favor responde a todas as perguntas de escala.");
  return;
}

    fetch("/save_questionario", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id, personal, answers })
})
.then(async res => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro no servidor");
  return data;
})
.then(data => {

  window.location.href = "/chat-ia";
})
.catch(err => {
  alert("Erro ao submeter questionário: " + err.message);
});

  };

  return (
    <form className="questionario-container" onSubmit={handleSubmit}>
      <h1>Descobre o teu caminho profissional</h1>

      {/* Informações pessoais */}
      <div className="question-block spacing">
        <label className="question-label">Nome:</label>
        <input type="text" name="nome" value={personal.nome} onChange={handlePersonalChange} required />
      </div>

      <div className="question-block spacing">
        <label className="question-label">Género:</label>
        <select name="genero" value={personal.genero} onChange={handlePersonalChange} required>
          <option value="">Seleciona...</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div className="question-block spacing">
        <label className="question-label">Data de nascimento:</label>
        <input type="date" name="nascimento" value={personal.nascimento} onChange={handlePersonalChange} required />
      </div>

      {/* Perguntas */}
      {questions.map(q => (
        <div key={q.id} className="question-block spacing">
          <label className="question-label">{q.id}. {q.text}</label>

          {q.type === "scale" && (
            <div className="scale-options">
              {scaleOptions.map(opt => (
                <div key={opt.value} className="option-item">
                  <label>
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      checked={answers[q.id] === opt.value}
                      onChange={() => handleScaleChange(q.id, opt.value)}
                    />
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          )}

          {q.type === "text" && (
            <input type="text" onChange={(e) => handleChange(q.id, e.target.value)} />
          )}

          {q.type === "textarea" && (
            <textarea onChange={(e) => handleChange(q.id, e.target.value)} />
          )}

          {q.type === "select" && (
            <select onChange={(e) => handleChange(q.id, e.target.value)}>
              <option value="">Seleciona...</option>
              {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
        </div>
      ))}

      <button className="btn-enviar" type="submit">Enviar e Conversar com a IA</button>
    </form>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Questionario />);
