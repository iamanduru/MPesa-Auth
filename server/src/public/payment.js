;(async function(){
  const WP_API_BASE = 'https://missionpossibleproduction.com/wp-json/wp/v2'; 
  const BACKEND    = window.location.origin;
  
  // Get slug from path: e.g. /payment/my-film-slug
  const pathParts = location.pathname.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 1];
  if (!slug) {
    console.error('No film slug in URL');
    return;
  }

  // DOM references
  const titleEl       = document.getElementById('title');
  const priceEl       = document.getElementById('price');
  const phoneInput    = document.getElementById('phone');
  const payBtn        = document.getElementById('payBtn');
  const messageEl     = document.getElementById('message');

  let filmData = null;

  // Fetch film details (via your backend proxying WP)
  async function loadFilm() {
    try {
      const res = await fetch(`${WP_API_BASE}/films/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error('Film fetch failed');
      return await res.json();
    } catch (err) {
      console.error(err);
      showMessage('Could not load film data', 'error');
      throw err;
    }
  }

  // Initialize page with nice animations
  async function initializePage() {
    filmData = await loadFilm();
    setTimeout(() => {
      titleEl.textContent = filmData.title;
      titleEl.classList.remove('loading-dots');
      priceEl.textContent = `KES ${filmData.price.toFixed(2)}`;
      titleEl.style.animation = 'fadeInUp 0.8s ease-out forwards';
      priceEl.style.animation = 'bounce 1s ease-out 0.3s both';
    }, 500);
  }

  // Helper to show messages
  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type} show`;
    if (type === 'info') {
      setTimeout(() => messageEl.classList.remove('show'), 5000);
    }
  }

  // Toggle button loading state
  function setLoading(isLoading) {
    payBtn.disabled = isLoading;
    payBtn.classList.toggle('loading', isLoading);
    payBtn.textContent = isLoading ? 'Processing…' : 'Pay with M‑Pesa';
  }

  // Start payment + polling
  async function startPayment(phoneNumber) {
    setLoading(true);
    showMessage('Initiating payment…', 'info');
    try {
      // kick off STK push
      const initRes = await fetch(
        `${BACKEND}/payment/initiate/${encodeURIComponent(slug)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber })
        }
      );
      const initJson = await initRes.json();
      if (!initRes.ok) throw new Error(initJson.error || 'Init failed');
      const { checkoutRequestID } = initJson;

      showMessage('Check your phone for M‑Pesa prompt…', 'info');

      // poll status every 3s
      let statusJson;
      do {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(
          `${BACKEND}/payment/status/${encodeURIComponent(checkoutRequestID)}`
        );
        statusJson = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusJson.error || 'Status fetch failed');
      } while (statusJson.status === 'PENDING');

      if (statusJson.status === 'SUCCESS') {
        showMessage('Payment successful! Redirecting…', 'success');
        createParticles();
        setTimeout(() => {
          // redirect to stream with token
          window.location.href = `stream.html?token=${encodeURIComponent(statusJson.accessLink)}`;
        }, 1500);
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      console.error(err);
      showMessage(err.message || 'Payment error', 'error');
      setLoading(false);
    }
  }

  // phone input formatter/validator
  phoneInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (!v.startsWith('254') && (v.startsWith('7')||v.startsWith('1'))) {
      v = '254' + v;
    }
    if (v.length > 12) v = v.slice(0,12);
    e.target.value = v;
    const valid = /^2547\d{8}$/.test(v);
    e.target.style.borderColor = valid ? 'var(--success-color)' : 'var(--border-color)';
  });

  payBtn.addEventListener('click', () => {
    const phone = phoneInput.value.trim();
    if (!/^2547\d{8}$/.test(phone)) {
      showMessage('Enter a valid phone (2547XXXXXXXX)', 'error');
      phoneInput.focus();
      return;
    }
    startPayment(phone);
  });

  phoneInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') payBtn.click();
  });

  // Idle bounce animation
  setInterval(() => {
    if (!payBtn.disabled && !payBtn.classList.contains('loading')) {
      payBtn.style.animation = 'bounce 0.6s ease-in-out';
      setTimeout(() => payBtn.style.animation = '', 600);
    }
  }, 5000);

  // Particle explosion on success
  function createParticles() {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position: fixed; width:6px; height:6px;
        background: var(--success-color);
        border-radius:50%; pointer-events:none;
        left:50%; top:50%;
        animation: particle-explosion 2s ease-out forwards;
        animation-delay: ${Math.random()*0.5}s;
      `;
      const angle = (Math.PI*2*i)/20;
      const dist  = 80 + Math.random()*80;
      p.style.setProperty('--end-x', Math.cos(angle)*dist + 'px');
      p.style.setProperty('--end-y', Math.sin(angle)*dist + 'px');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 2000);
    }
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particle-explosion {
      to {
        transform: translate(var(--end-x), var(--end-y));
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // kick everything off
  initializePage();
})();

