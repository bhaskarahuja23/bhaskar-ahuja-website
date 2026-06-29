document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll('[data-reveal]').forEach((element) => {
    element.classList.add('is-visible');
  });

  document.querySelectorAll('.toggle-bib').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.getAttribute('aria-controls'));
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      if (target) target.hidden = expanded;
    });
  });

  const search = document.getElementById('publication-search');
  const yearFilter = document.getElementById('year-filter');
  const typeFilter = document.getElementById('type-filter');
  const cards = Array.from(document.querySelectorAll('.publication-card'));
  const count = document.getElementById('publication-count');

  function applyPublicationFilters() {
    const query = (search?.value || '').toLowerCase();
    const selectedYear = yearFilter?.value || 'all';
    const selectedType = typeFilter?.value || 'all';
    let visible = 0;

    cards.forEach((card) => {
      const haystack = card.textContent.toLowerCase();
      const matchesQuery = haystack.includes(query);
      const matchesYear = selectedYear === 'all' || card.dataset.year === selectedYear;
      const matchesType = selectedType === 'all' || card.dataset.type === selectedType;
      const show = matchesQuery && matchesYear && matchesType;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (count) count.textContent = `${visible} publication${visible === 1 ? '' : 's'}`;
  }

  [search, yearFilter, typeFilter].forEach((control) => {
    if (control) {
      control.addEventListener('input', applyPublicationFilters);
      control.addEventListener('change', applyPublicationFilters);
    }
  });
  applyPublicationFilters();
});
