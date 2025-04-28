document.addEventListener('DOMContentLoaded', () => {
  // Quitar clase de carga
  document.body.classList.remove('is-loading');
  // Toggle del burger
  const burger = document.querySelector('.navbar-burger');
  const menu = document.getElementById(burger.dataset.target);
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-active');
    menu.classList.toggle('is-active');
  });
  // Modales
  document.querySelectorAll('.modal-button').forEach(btn => {
    const target = document.getElementById(btn.dataset.target);
    btn.addEventListener('click', () => target.classList.add('is-active'));
  });
  document.querySelectorAll('.modal-close, .modal-background').forEach(close => {
    const modal = close.closest('.modal');
    close.addEventListener('click', () => modal.classList.remove('is-active'));
  });
  // Calendly
  const head = document.querySelector('head');
  const cScript = document.createElement('script');
  cScript.src = 'https://assets.calendly.com/assets/external/widget.js';
  head.appendChild(cScript);
});
// Banner
document.addEventListener('DOMContentLoaded', () => {
  // Desde aquí comienza tu funcionalidad
  document.body.classList.remove('is-loading');

  // Espera 3 segundos antes de cambiar la imagen del fondo
  setTimeout(() => {
    // Cambia el fondo del banner dinámicamente
    document.querySelector('.hero').style.background =
      'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1)), url(../resources/img/bannerBelyni.png) no-repeat center center';
    document.querySelector('.hero').style.backgroundSize = 'cover';
  }, 2500); // Cambiará a los 2.5 segundos
});