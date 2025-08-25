// Nav active link
const Nav = {
  setActive() {
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('[data-nav] a').forEach(a => {
      if (a.getAttribute('href') === current) a.classList.add('active');
    });
  }
};
document.addEventListener('DOMContentLoaded', () => Nav.setActive());

