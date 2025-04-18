document.addEventListener("DOMContentLoaded", function() {
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav');
  // Toggle nav on mobile
  menuToggle.addEventListener('click', function() {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', (!expanded).toString());
    nav.classList.toggle('open');
    menuToggle.classList.toggle('open');
  });
  // Close nav after clicking a link (mobile)
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if(window.innerWidth < 768) {
        nav.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
  // Close nav on ESC for accessibility
  document.addEventListener('keydown', function(e) {
    if(e.key === 'Escape') {
      nav.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
});