export const SCORE_MAP = {
  Nada: 0,
  Pouco: 25,
  Médio: 50,
  Muito: 75,
  Totalmente: 100,
};

export function calcularResultados(respostas) {
  const scores = {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  };

  respostas.forEach((r) => {
    scores[r.type] += SCORE_MAP[r.value];
  });

  // Converter para percentagens
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const percentagens = {};
  for (let key in scores) {
    percentagens[key] = Math.round((scores[key] / total) * 100);
  }

  // Ordenar top áreas
  const top = Object.entries(percentagens)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ nome: key, percentagem: value }));

  return {
    riasec: percentagens,
    dominante: top[0]?.nome,
    topAreas: top,
  };
}