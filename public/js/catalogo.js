/* ============================================================
   CUEVAS AUTOMÓVILES — CATALOG JAVASCRIPT
   ============================================================ */

let cars = [];
let filtered = [];
let catalogBrands = [];
let currentPage = 1;
const PER_PAGE = 9;

const filterBrand = document.getElementById('filterBrand');
const filterFuel = document.getElementById('filterFuel');
const filterTrans = document.getElementById('filterTrans');
const filterYearMin = document.getElementById('filterYearMin');
const filterYearMax = document.getElementById('filterYearMax');
const filterPriceMin = document.getElementById('filterPriceMin');
const filterPriceMax = document.getElementById('filterPriceMax');
const filterSort = document.getElementById('filterSort');
const catalogGrid = document.getElementById('catalogGrid');
const catalogCount = document.getElementById('catalogCount');
const paginationEl = document.getElementById('pagination');
const resetFilters = document.getElementById('resetFilters');
const searchInput = document.getElementById('searchInput');

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format';

function syncBrandToURL(brand) {
  const url = new URL(window.location.href);
  if (brand) {
    url.searchParams.set('marca', brand);
  } else {
    url.searchParams.delete('marca');
  }
  history.replaceState({ marca: brand }, '', url);
}

function renderBrandBadge(brand) {
  const badge = document.getElementById('brandFilterBadge');
  if (!badge) return;
  if (!brand) {
    badge.classList.remove('active');
    badge.innerHTML = '';
    return;
  }
  badge.classList.add('active');
  badge.innerHTML = `
    <span class="bf-label">Mostrando resultados para:</span>
    <span class="bf-name">${brand}</span>
    <button class="bf-clear" onclick="clearBrandFilter()" aria-label="Quitar filtro de marca">Quitar filtro</button>
  `;
}

function populateSelectFromData(selectEl, values, emptyLabel) {
  if (!selectEl) return;
  const previous = selectEl.value;
  selectEl.innerHTML = '';

  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = emptyLabel;
  selectEl.appendChild(emptyOption);

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  });

  if (previous && values.includes(previous)) {
    selectEl.value = previous;
  }
}

function populateFilterOptions() {
  const brandsFromCars = Array.from(new Set(cars.map((car) => car.brand))).sort((a, b) =>
    a.localeCompare(b, 'es')
  );
  const brands = catalogBrands.length ? catalogBrands : brandsFromCars;
  const fuels = Array.from(new Set(cars.map((car) => car.fuel).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
  const trans = Array.from(new Set(cars.map((car) => car.trans).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));

  populateSelectFromData(filterBrand, brands, 'Todas las marcas');
  populateSelectFromData(filterFuel, fuels, 'Todos');
  populateSelectFromData(filterTrans, trans, 'Todas');
}

function applyFilters() {
  const brand = filterBrand?.value || '';
  const fuel = filterFuel?.value || '';
  const trans = filterTrans?.value || '';
  const yearMin = parseInt(filterYearMin?.value, 10) || 0;
  const yearMax = parseInt(filterYearMax?.value, 10) || 9999;
  const priceMin = parseInt(filterPriceMin?.value, 10) || 0;
  const priceMax = parseInt(filterPriceMax?.value, 10) || 999999999;
  const search = searchInput?.value.toLowerCase().trim() || '';
  const sort = filterSort?.value || 'featured';

  filtered = cars.filter((car) => {
    if (brand && car.brand.toLowerCase() !== brand.toLowerCase()) return false;
    if (fuel && car.fuel.toLowerCase() !== fuel.toLowerCase()) return false;
    if (trans && car.trans.toLowerCase() !== trans.toLowerCase()) return false;
    if (car.year < yearMin || car.year > yearMax) return false;
    if (car.price < priceMin || car.price > priceMax) return false;
    if (search && !`${car.brand} ${car.model} ${car.year}`.toLowerCase().includes(search)) return false;
    return true;
  });

  switch (sort) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'year-desc':
      filtered.sort((a, b) => b.year - a.year);
      break;
    case 'year-asc':
      filtered.sort((a, b) => a.year - b.year);
      break;
    case 'km-asc':
      filtered.sort((a, b) => a.km - b.km);
      break;
    default:
      filtered.sort((a, b) => {
        const featuredDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (featuredDiff !== 0) return featuredDiff;
        return b.year - a.year;
      });
      break;
  }

  currentPage = 1;
  syncBrandToURL(brand);
  renderBrandBadge(brand);
  renderGrid();
  renderPagination();
}

function renderGrid() {
  if (!catalogGrid) return;

  const start = (currentPage - 1) * PER_PAGE;
  const pageData = filtered.slice(start, start + PER_PAGE);

  if (catalogCount) {
    catalogCount.innerHTML = `Mostrando <strong>${filtered.length}</strong> vehículo${filtered.length !== 1 ? 's' : ''}`;
  }

  if (pageData.length === 0) {
    catalogGrid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <div class="icon">🔍</div>
        <h3>No se encontraron vehículos</h3>
        <p>Intenta ajustar los filtros de búsqueda</p>
      </div>
    `;
    return;
  }

  catalogGrid.innerHTML = pageData.map((car) => {
    const imgs = Array.isArray(car.imgs) && car.imgs.length ? car.imgs : [car.img || FALLBACK_IMAGE];
    const slides = imgs.map((src, index) => `
      <img src="${src}" class="gallery-slide${index === 0 ? ' active' : ''}" alt="${car.brand} ${car.model} - foto ${index + 1}" loading="lazy"
           onerror="this.src='${FALLBACK_IMAGE}'">
    `).join('');

    const arrows = imgs.length > 1 ? `
      <button class="gallery-arrow prev" onclick="galleryNav('${car.id}',-1,event)" aria-label="Foto anterior">&#8249;</button>
      <button class="gallery-arrow next" onclick="galleryNav('${car.id}',1,event)" aria-label="Foto siguiente">&#8250;</button>
      <div class="gallery-dots">${imgs.map((_, index) => `<span class="gallery-dot${index === 0 ? ' active' : ''}" onclick="galleryGo('${car.id}',${index},event)"></span>`).join('')}</div>
    ` : '';

    return `
      <div class="vehicle-card animate-on-scroll">
        <div class="vehicle-card-img">
          <div class="vehicle-card-gallery" data-id="${car.id}">${slides}${arrows}</div>
          ${car.badge ? `<span class="vehicle-card-badge">${car.badge}</span>` : ''}
        </div>
        <div class="vehicle-card-body">
          <div class="vehicle-card-brand">${car.brand}</div>
          <div class="vehicle-card-name">${car.model} ${car.year || ''}</div>
          <div class="vehicle-card-specs">
            <div class="spec-item"><span class="ic"><i class="ph ph-calendar"></i></span>${car.year || '-'}</div>
            <div class="spec-item"><span class="ic"><i class="ph ph-gas-pump"></i></span>${car.fuel || '-'}</div>
            <div class="spec-item"><span class="ic"><i class="ph ph-gear"></i></span>${car.trans || '-'}</div>
            <div class="spec-item"><span class="ic"><i class="ph ph-road"></i></span>${Number(car.km || 0).toLocaleString('es-UY')} km</div>
          </div>
          <div class="vehicle-card-footer">
            <a href="https://wa.me/59899364330?text=Hola!%20Consulto%20por%20el%20${encodeURIComponent(car.brand + ' ' + car.model + ' ' + car.year)}"
               target="_blank" class="btn btn-primary btn-sm" style="width:100%;justify-content:center" onclick="event.stopPropagation()">
              Consultar precio
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  catalogGrid.querySelectorAll('.animate-on-scroll').forEach((el, index) => {
    el.style.transitionDelay = `${index * 0.06}s`;
    setTimeout(() => el.classList.add('visible'), 50);
  });
}

function renderPagination() {
  if (!paginationEl) return;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let html = `<button class="page-btn prev" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Anterior</button>`;
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="goPage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span style="padding:0 4px;color:var(--grey)">…</span>';
    }
  }
  html += `<button class="page-btn next" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente →</button>`;

  paginationEl.innerHTML = html;
}

function renderConnectionError(message) {
  if (catalogCount) {
    catalogCount.innerHTML = 'No se pudo cargar el catálogo';
  }
  if (catalogGrid) {
    catalogGrid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <div class="icon">⚠️</div>
        <h3>Error de conexión con inventario</h3>
        <p>${message}</p>
      </div>
    `;
  }
  if (paginationEl) paginationEl.innerHTML = '';
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

window.clearBrandFilter = function clearBrandFilter() {
  if (filterBrand) filterBrand.value = '';
  applyFilters();
};

window.goPage = function goPage(page) {
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderGrid();
  renderPagination();
  document.getElementById('catalogMain')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};


[filterBrand, filterFuel, filterTrans, filterYearMin, filterYearMax, filterPriceMin, filterPriceMax, filterSort].forEach((el) => {
  el?.addEventListener('change', applyFilters);
});

searchInput?.addEventListener('input', debounce(applyFilters, 300));

if (resetFilters) {
  resetFilters.addEventListener('click', () => {
    [filterBrand, filterFuel, filterTrans, filterSort].forEach((el) => {
      if (el) el.value = '';
    });
    [filterYearMin, filterYearMax, filterPriceMin, filterPriceMax].forEach((el) => {
      if (el) el.value = '';
    });
    if (searchInput) searchInput.value = '';
    applyFilters();
  });
}

async function initCatalog() {
  if (!catalogGrid) return;
  const initialBrandFromUrl = new URLSearchParams(window.location.search).get('marca');

  if (!window.CuevasInventoryApi || typeof window.CuevasInventoryApi.fetchInventory !== 'function') {
    renderConnectionError('No se encontró el cliente de API en la aplicación.');
    return;
  }

  try {
    if (catalogCount) catalogCount.textContent = 'Cargando vehículos...';
    const { vehicles, brands } = await window.CuevasInventoryApi.fetchInventory();
    cars = vehicles;
    catalogBrands = Array.isArray(brands) ? brands : [];
    filtered = [...cars];
    populateFilterOptions();

    if (initialBrandFromUrl && filterBrand) {
      let option = Array.from(filterBrand.options).find(
        (opt) => opt.value.toLowerCase() === initialBrandFromUrl.toLowerCase()
      );
      if (!option) {
        option = document.createElement('option');
        option.value = initialBrandFromUrl;
        option.textContent = initialBrandFromUrl;
        filterBrand.appendChild(option);
      }
      filterBrand.value = option.value;
    }

    applyFilters();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible obtener los autos desde el VPS.';
    renderConnectionError(message);
  }
}

initCatalog();
