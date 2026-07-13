/* ============================================
   Asistente virtual Objetiva — logica widget
   Cablea el widget a /chat y /reunion del backend.
   ============================================ */
(function () {
  // ---------------------------------------------------------------
  // CONFIG: destino del backend.
  // Produccion (tras Nginx): '/asistente-api'
  // Pruebas en local sin proxy: 'http://212.227.37.210:8020'
  //   (requiere abrir el puerto y da mixed-content si la web es https)
  // ---------------------------------------------------------------
  const API_BASE = '/asistente-api';

  const widget = document.getElementById('assistantWidget');
  if (!widget) return; // el widget no esta en esta pagina

  const body = document.getElementById('assistantBody');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const statusEl = document.getElementById('assistantStatus');
  const foot = document.getElementById('assistantFoot');

  // Memoria de conversacion: vive solo en el navegador, se pierde al
  // recargar. El backend es stateless; el cliente reenvia el contexto.
  const MAX_HISTORIAL = 12;
  let conversationHistory = [];
  function pushHistorial(role, content) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > MAX_HISTORIAL) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORIAL);
    }
  }

  const reunionView = document.getElementById('reunionView');
  const btnAbrirReunion = document.getElementById('btnAbrirReunion');
  const btnVolverChat = document.getElementById('btnVolverChat');
  const btnEnviarReunion = document.getElementById('btnEnviarReunion');
  const reunionStatus = document.getElementById('reunionStatus');

  function addMessage(text, cls) {
    const div = document.createElement('div');
    div.className = 'assistant-msg' + (cls ? ' ' + cls : '');
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function setSending(isSending) {
    input.disabled = isSending;
    sendBtn.disabled = isSending;
  }

  async function sendMessage(mensaje) {
    addMessage(mensaje, 'user');
    setSending(true);
    const typing = addMessage('Escribiendo…', 'typing');
    const historialParaEnviar = conversationHistory.slice();

    try {
      const res = await fetch(API_BASE + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, historial: historialParaEnviar })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      typing.remove();
      const texto = data.respuesta || data.texto || data.mensaje || 'No he podido generar una respuesta.';
      addMessage(texto);
      statusEl.textContent = 'Disponible ahora';
      statusEl.classList.remove('offline');
      pushHistorial('user', mensaje);
      pushHistorial('assistant', texto);
      if (data.intencion === 'agendar_reunion') {
        setTimeout(showReunion, 700);
      }
    } catch (err) {
      typing.remove();
      addMessage('No he podido conectar con el asistente. Puedes escribirnos al 922 04 62 81 o agendar una reunión.', 'error');
      statusEl.textContent = 'Sin conexión';
      statusEl.classList.add('offline');
      console.error('Error /chat:', err);
    } finally {
      setSending(false);
      input.focus();
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const mensaje = input.value.trim();
    if (!mensaje) return;
    input.value = '';
    sendMessage(mensaje);
  });

  function showReunion() {
    body.classList.add('hidden-view');
    foot.style.display = 'none';
    reunionView.classList.add('active');
    btnVolverChat.style.display = 'inline';
  }
  function showChat() {
    body.classList.remove('hidden-view');
    foot.style.display = 'block';
    reunionView.classList.remove('active');
    btnVolverChat.style.display = 'none';
  }
  btnAbrirReunion.addEventListener('click', showReunion);
  btnVolverChat.addEventListener('click', showChat);

  function validarContacto(v) {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefono = /^[\d\s+()-]{6,}$/;
    return email.test(v) || telefono.test(v);
  }

  async function enviarReunion() {
    const nombre = document.getElementById('rNombre').value.trim();
    const contacto = document.getElementById('rContacto').value.trim();
    const franja = document.getElementById('rFranja').value;
    const motivo = document.getElementById('rMotivo').value.trim();
    reunionStatus.className = 'reunion-status';
    reunionStatus.textContent = '';
    if (nombre.length < 2) {
      reunionStatus.textContent = 'Escribe tu nombre completo.';
      reunionStatus.classList.add('error'); return;
    }
    if (!validarContacto(contacto)) {
      reunionStatus.textContent = 'Indica un email o teléfono válido.';
      reunionStatus.classList.add('error'); return;
    }
    btnEnviarReunion.disabled = true;
    reunionStatus.textContent = 'Enviando…';
    try {
      const res = await fetch(API_BASE + '/reunion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contacto, franja, motivo })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.aviso_enviado === false) {
        reunionStatus.textContent = 'Solicitud registrada. Te contactaremos en breve.';
      } else {
        reunionStatus.textContent = '¡Solicitud enviada! Un agente te contactará pronto.';
      }
      reunionStatus.classList.add('ok');
      document.getElementById('rNombre').value = '';
      document.getElementById('rContacto').value = '';
      document.getElementById('rMotivo').value = '';
    } catch (err) {
      reunionStatus.textContent = 'No se pudo enviar. Llama al 922 04 62 81 o al 680 686 245 (WhatsApp).';
      reunionStatus.classList.add('error');
      console.error('Error /reunion:', err);
    } finally {
      btnEnviarReunion.disabled = false;
    }
  }
  btnEnviarReunion.addEventListener('click', enviarReunion);

  // ---------------- Burbuja de saludo ----------------
  // Aparece una vez por sesion a los pocos segundos para que el
  // visitante sepa que el asistente es interactivo. No insiste.
  const bubble = document.getElementById('assistantBubble');
  const bubbleClose = document.getElementById('bubbleClose');
  const YA_VISTA = 'objetiva_bubble_vista';

  function ocultarBurbuja() {
    if (bubble) bubble.classList.remove('show');
  }

  function mostrarBurbuja() {
    // no mostrar si el widget ya esta abierto o si ya se vio en esta sesion
    if (!bubble) return;
    if (widget.classList.contains('open')) return;
    try { if (sessionStorage.getItem(YA_VISTA)) return; } catch (e) {}
    bubble.classList.add('show');
    try { sessionStorage.setItem(YA_VISTA, '1'); } catch (e) {}
    // se cierra sola a los 8s
    setTimeout(ocultarBurbuja, 8000);
  }

  if (bubble) {
    // al pulsar la burbuja (no la X), abrir el chat
    bubble.addEventListener('click', function (e) {
      if (e.target === bubbleClose) return;
      widget.classList.add('open');
      ocultarBurbuja();
      input.focus();
    });
    if (bubbleClose) {
      bubbleClose.addEventListener('click', function (e) {
        e.stopPropagation();
        ocultarBurbuja();
      });
    }
    // al abrir el widget por el boton, quitar la burbuja
    widget.querySelector('.assistant-toggle').addEventListener('click', ocultarBurbuja);
    // aparece a los 4s
    setTimeout(mostrarBurbuja, 4000);
  }
})();