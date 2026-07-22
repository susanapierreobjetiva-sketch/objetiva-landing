/* ============================================
   Formulario de contacto Objetiva — envío a /reunion
   Reutiliza el backend asistente-api (bandeja de Lucy).
   ============================================ */
(function () {
  const API_BASE = '/asistente-api';

  const form = document.getElementById('contactForm');
  if (!form) return;

  const nombreEl = document.getElementById('nombre');
  const emailEl = document.getElementById('email');
  const telefonoEl = document.getElementById('telefono');
  const mensajeEl = document.getElementById('mensaje');
  const btn = form.querySelector('.btn-submit');
  const nota = form.querySelector('.form-note');

  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const TEL_RE = /^[+\d][\d\s]{7,}$/;

  function setNota(texto, tipo) {
    nota.textContent = texto;
    nota.classList.remove('ok', 'error');
    if (tipo) nota.classList.add(tipo);
  }

  async function enviar() {
    const nombre = nombreEl.value.trim();
    const email = emailEl.value.trim();
    const telefono = telefonoEl.value.trim();
    const mensaje = mensajeEl.value.trim();

    // Validación en cliente (refleja las reglas del backend)
    if (nombre.length < 2) {
      setNota('Escribe tu nombre completo.', 'error'); nombreEl.focus(); return;
    }
    // contacto = email si es válido; si no, teléfono
    let contacto = '';
    if (EMAIL_RE.test(email)) {
      contacto = email;
    } else if (TEL_RE.test(telefono)) {
      contacto = telefono;
    } else {
      setNota('Indica un email o un teléfono válido para poder responderte.', 'error');
      emailEl.focus(); return;
    }

    // motivo = mensaje + el dato de contacto que no fue al campo "contacto"
    let motivo = mensaje;
    const extra = [];
    if (contacto !== email && email) extra.push('Email: ' + email);
    if (contacto !== telefono && telefono) extra.push('Teléfono: ' + telefono);
    if (extra.length) motivo += (motivo ? '\n\n' : '') + extra.join(' · ');
    if (!motivo) motivo = '(sin mensaje)';

    btn.disabled = true;
    const txtOriginal = btn.textContent;
    btn.textContent = 'Enviando…';
    setNota('Enviando…', null);

    try {
      const res = await fetch(API_BASE + '/reunion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          contacto,
          franja: 'Consulta desde formulario web',
          motivo
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await res.json();
      setNota('¡Mensaje enviado! Un agente de Objetiva Broker te contactará pronto.', 'ok');
      nombreEl.value = '';
      emailEl.value = '';
      telefonoEl.value = '';
      mensajeEl.value = '';
    } catch (err) {
      setNota('No se pudo enviar. Llámanos al 922 04 62 81 o escríbenos a producción@objetivabroker.com.', 'error');
      console.error('Error /reunion (contacto):', err);
    } finally {
      btn.disabled = false;
      btn.textContent = txtOriginal;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    enviar();
  });
})();
