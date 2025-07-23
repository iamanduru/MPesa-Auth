(function(){
    // ← dynamically pick up whatever host/port is serving this page
    const BACKEND = window.location.origin;

    const params = new URLSearchParams(location.search);
    const slug  = params.get('slug');
    const token = params.get('token');
    const video = document.getElementById('videoPlayer');
    const errEl = document.getElementById('error');

    function showError(msg) {
      errEl.textContent = msg;
      errEl.classList.add('show');
      video.style.display = 'none';
    }

    if (!slug || !token) {
      showError('Missing film identifier or access token.');
      return;
    }

    // build your stream URL relative to the same origin
    const src = `${BACKEND}/stream?filmId=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`;
    video.src = src;

    video.addEventListener('error', async () => {
      try {
        const resp = await fetch(src);
        const data = await resp.json();
        showError(data.error || 'Unable to load video.');
      } catch {
        showError('Streaming error. Please try again later.');
      }
    });
  })();