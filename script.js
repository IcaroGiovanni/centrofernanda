/* =========================================================
   Fernanda Amorim — Centro Especializado — script.js
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Integração com o sistema de agenda ----------
     Preencha `endpoint` com a URL da API do seu agendador (ex.: Calendly,
     Dr. Consulta ou backend próprio). Enquanto estiver vazio, o pedido é
     confirmado pelo WhatsApp com todos os dados preenchidos. */
  const BOOKING = {
    endpoint: '',
    whatsapp: '5531986576020'
  };

  function sendBooking(payload) {
    if (!BOOKING.endpoint) return Promise.resolve({ demo: true });
    return fetch(BOOKING.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res;
    });
  }

  /* ---------- Ano no rodapé ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: estado no scroll ---------- */
  const header = $('.site-header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Menu mobile ---------- */
  const navToggle = $('#navToggle');
  const nav = $('#nav');

  function closeNav() {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  }

  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(e.target) || navToggle.contains(e.target)) return;
    closeNav();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) closeNav();
  });

  /* ---------- Rolagem suave + link ativo ---------- */
  const navLinks = $$('.nav-list a');
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  navLinks.forEach((link) => {
    link.addEventListener('click', () => closeNav());
  });

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((l) => l.classList.remove('is-active'));
          const active = navLinks.find((l) => l.getAttribute('href') === '#' + entry.target.id);
          if (active) active.classList.add('is-active');
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Animações de entrada ---------- */
  const reveals = $$('.reveal');
  reveals.forEach((el) => {
    const d = el.dataset.delay;
    if (d) el.style.setProperty('--d', d);
  });

  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Contadores ---------- */
  const counters = $$('[data-count]');
  const formatNum = (n) => n.toLocaleString('pt-BR');

  function runCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (prefersReduced) {
      el.textContent = formatNum(target) + suffix;
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Perfil dos profissionais ---------- */
  $$('[data-bio]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.dataset.bio);
      if (!panel) return;
      const open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Ocultar perfil' : 'Ver perfil completo';
    });
  });

  /* ---------- Máscara de telefone ---------- */
  function maskTel(v) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  $$('[data-mask="tel"]').forEach((input) => {
    input.addEventListener('input', () => {
      const pos = input.value.length;
      input.value = maskTel(input.value);
      if (pos < input.value.length) input.setSelectionRange(input.value.length, input.value.length);
    });
    input.addEventListener('blur', () => {
      const digits = input.value.replace(/\D/g, '');
      if (input.value && digits.length < 10) setError(input, 'Informe um telefone válido com DDD.');
      else clearError(input);
    });
  });

  /* ---------- Validação de formulários ---------- */
  function setError(field, msg) {
    const wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.add('has-error');
    const err = wrap.querySelector('.field-error');
    if (err) err.textContent = msg;
    field.setAttribute('aria-invalid', 'true');
  }

  function clearError(field) {
    const wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.remove('has-error');
    const err = wrap.querySelector('.field-error');
    if (err) err.textContent = '';
    field.removeAttribute('aria-invalid');
  }

  function validateField(field) {
    clearError(field);
    const value = (field.value || '').trim();

    if (field.hasAttribute('required') && !value && field.type !== 'checkbox') {
      setError(field, 'Este campo é obrigatório.');
      return false;
    }
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(field, 'Informe um e-mail válido.');
      return false;
    }
    if (field.type === 'tel' && value && field.value.replace(/\D/g, '').length < 10) {
      setError(field, 'Informe um telefone válido com DDD.');
      return false;
    }
    if (field.type === 'date' && value) {
      const chosen = new Date(value + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        setError(field, 'Escolha uma data a partir de hoje.');
        return false;
      }
      if (chosen.getDay() === 0) {
        setError(field, 'Não atendemos aos domingos. Escolha outro dia.');
        return false;
      }
    }
    return true;
  }

  function bindValidation(form) {
    $$('input, select, textarea', form).forEach((field) => {
      if (field.type === 'radio' || field.type === 'checkbox') return;
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.field')?.classList.contains('has-error')) validateField(field);
      });
      field.addEventListener('change', () => validateField(field));
    });
  }

  function validateForm(form) {
    let ok = true;
    let firstInvalid = null;

    $$('input, select, textarea', form).forEach((field) => {
      if (field.type === 'radio') return;
      if (field.type === 'checkbox') {
        const errEl = field.id === 'c-lgpd' ? $('#lgpdError') : null;
        if (field.hasAttribute('required') && !field.checked) {
          ok = false;
          if (errEl) errEl.textContent = 'É necessário aceitar para continuar.';
          if (!firstInvalid) firstInvalid = field;
        } else if (errEl) {
          errEl.textContent = '';
        }
        return;
      }
      if (!validateField(field)) {
        ok = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return ok;
  }

  /* ---------- Formulário de contato ---------- */
  const contactForm = $('#contactForm');
  if (contactForm) {
    bindValidation(contactForm);
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(contactForm)) return;

      const submitBtn = contactForm.querySelector('button[type=submit]');
      const originalHTML = submitBtn.innerHTML;
      const success = $('#contactSuccess');

      success.hidden = false;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviado';
      success.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
      contactForm.reset();

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        success.hidden = true;
      }, 6000);
    });
  }

  /* ---------- Modal de agendamento ---------- */
  const modal = $('#bookingModal');
  const bookingForm = $('#bookingForm');
  const bookingSuccess = $('#bookingSuccess');
  const dialog = $('.modal-dialog', modal);
  let lastFocused = null;

  function getFocusable() {
    return $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      dialog
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  function openModal(professional) {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    closeNav();

    bookingForm.hidden = false;
    bookingSuccess.hidden = true;
    const submitBtn = bookingForm.querySelector('button[type=submit]');
    submitBtn.disabled = false;
    submitBtn.innerHTML =
      'Confirmar agendamento <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

    if (professional) {
      const sel = $('#b-prof');
      const opt = $$('option', sel).find((o) => o.value === professional || o.text === professional);
      if (opt) sel.value = opt.value || opt.text;
    } else {
      $('#b-prof').value = '';
    }

    setTimeout(() => $('#b-nome').focus(), 60);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocused) lastFocused.focus();
  }

  $$('[data-open-booking]').forEach((btn) =>
    btn.addEventListener('click', () => openModal())
  );

  $$('[data-book]').forEach((btn) =>
    btn.addEventListener('click', () => openModal(btn.dataset.book))
  );

  $$('[data-close-modal]').forEach((el) => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === 'Tab') {
      const f = getFocusable();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* Data mínima: hoje (e evita domingo) */
  const dateInput = $('#b-data');
  if (dateInput) {
    const today = new Date();
    const iso = (d) => d.toISOString().split('T')[0];
    dateInput.min = iso(today);
    dateInput.addEventListener('change', () => validateField(dateInput));
  }

  if (bookingForm) {
    bindValidation(bookingForm);

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(bookingForm)) return;

      const data = new FormData(bookingForm);
      const nome = (data.get('nome') || '').toString().trim().split(' ')[0];
      const prof = (data.get('profissional') || '').toString() || 'nossa equipe';
      const modal_ = (data.get('modalidade') || '').toString();
      const dataRaw = (data.get('data') || '').toString();
      const hora = (data.get('horario') || '').toString();

      let dataFmt = dataRaw;
      if (dataRaw) {
        const [y, m, d] = dataRaw.split('-');
        dataFmt = `${d}/${m}/${y}`;
      }

      $('#bookingSummary').textContent =
        `${nome}, sua solicitação para ${prof} foi registrada: ${modal_}, ${dataFmt} às ${hora}. ` +
        `Confirmamos pelo WhatsApp em até 1 dia útil.`;

      const waText = [
        'Olá! Gostaria de confirmar um agendamento no Centro Especializado.',
        `Nome: ${(data.get('nome') || '').toString().trim()}`,
        `Telefone: ${(data.get('telefone') || '').toString()}`,
        `Profissional: ${prof}`,
        `Modalidade: ${modal_}`,
        `Data: ${dataFmt}`,
        `Horário: ${hora}`
      ];
      const obs = (data.get('obs') || '').toString().trim();
      if (obs) waText.push(`Observação: ${obs}`);

      const waLink = $('#bookingWa');
      if (waLink) {
        waLink.href =
          'https://wa.me/' + BOOKING.whatsapp + '?text=' + encodeURIComponent(waText.join('\n'));
      }

      bookingForm.hidden = true;
      bookingSuccess.hidden = false;
      bookingSuccess.focus?.();
      dialog.scrollTop = 0;

      sendBooking(Object.fromEntries(data.entries())).catch((err) =>
        console.warn('[agenda] não foi possível enviar a solicitação:', err)
      );

      bookingForm.reset();
    });
  }

  /* ---------- FAQ: apenas um aberto por vez ---------- */
  const faqItems = $$('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- Botão voltar ao topo via logo ---------- */
  $$('a[href="#topo"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      closeNav();
    });
  });
  /* ---------- Vídeo "Conheça a clínica" ---------- */
  const videoFrame = $('.video-frame');
  if (videoFrame) {
    const videoEl = $('video', videoFrame);
    const playBtn = $('.video-play', videoFrame);
    if (videoEl && playBtn) {
      playBtn.addEventListener('click', () => {
        if (videoEl.paused) videoEl.play(); else videoEl.pause();
      });
      videoEl.addEventListener('click', () => {
        if (!videoEl.paused) videoEl.pause();
      });
      videoEl.addEventListener('play', () => videoFrame.classList.add('is-playing'));
      videoEl.addEventListener('pause', () => videoFrame.classList.remove('is-playing'));
      videoEl.addEventListener('ended', () => videoFrame.classList.remove('is-playing'));
    }
  }

})();
