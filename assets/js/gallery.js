(function () {
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-caption');
  const close = document.querySelector('.lightbox-close');

  document.querySelectorAll('.gallery-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      image.src = link.href;
      image.alt = link.dataset.caption || 'Gallery image';
      caption.textContent = link.dataset.caption || '';
      lightbox.hidden = false;
    });
  });

  function closeLightbox() {
    lightbox.hidden = true;
    image.removeAttribute('src');
  }

  close?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });
})();
