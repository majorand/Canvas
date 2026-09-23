// Keep the exit independent of proxy initialization and backend connectivity.
document.querySelectorAll('[data-exit-canvas]').forEach(link => {
  link.addEventListener('click', event => {
    try {
      // Also replaces the outer about:blank wrapper when embedded there.
      window.top.location.replace('https://hpisd.instructure.com/');
      event.preventDefault();
    } catch {
      // The native target="_top" link remains a fallback for restricted frames.
    }
  });
});
