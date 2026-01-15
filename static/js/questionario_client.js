// static/js/questionario_client.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('questionarioForm');
  const statusSpan = document.getElementById('formStatus');

  // preenche user_id hidden com o UID do firebase (se existir)
  const uid = localStorage.getItem('uid');
  if (uid) {
    const hid = document.getElementById('user_id');
    if (hid) hid.value = uid;
  }

  function serializeForm(formEl) {
    const obj = {};
    const formData = new FormData(formEl);

    // inputs simples: text, date, number, select (single)
    for (const [key, value] of formData.entries()) {
      // se for checkbox or multiple, FormData já repete a chave várias vezes
      if (obj[key] !== undefined) {
        // converte em array
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(value);
      } else {
        obj[key] = value;
      }
    }

    // Agora: tratar checkboxes agrupados (por exemplo 'valores' pode ficar como string se só um)
    // Mantemos assim — Firestore aceita arrays e strings.
    return obj;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusSpan.textContent = 'A enviar...';

    const payload = serializeForm(form);
    // assegurar que o user_id está no payload (vem do hidden ou do localStorage)
    payload.user_id = payload.user_id || localStorage.getItem('uid') || null;

    try {
      const res = await fetch('/save_questionario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro no servidor');

      statusSpan.textContent = 'Enviado com sucesso!';
      // redireciona para chat, se o backend indicar
      if (json.redirect) {
        window.location.href = json.redirect;
      } else {
        // fallback: vai para chat
        window.location.href = '/chat';
      }
    } catch (err) {
      console.error(err);
      statusSpan.textContent = 'Erro ao enviar. ' + (err.message || '');
    }
  });

  // footer buttons
  const btnChat = document.getElementById('btnChat');
  const btnPerfil = document.getElementById('btnPerfil');
  const btnIA = document.getElementById('btnIA');
  if (btnChat) btnChat.onclick = () => window.location.href = '/chat';
  if (btnPerfil) btnPerfil.onclick = () => window.location.href = '/perfil';
  if (btnIA) btnIA.onclick = () => window.location.href = '/ia';
});
