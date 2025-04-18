// script.js - Toggle simple del menú
const btn = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');

btn.addEventListener('click', () => {
  const shown = nav.style.display === 'flex';
  nav.style.display = shown ? 'none' : 'flex';
});
