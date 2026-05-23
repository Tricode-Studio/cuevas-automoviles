/* ============================================================
   CUEVAS AUTOMÓVILES — CATALOG JAVASCRIPT
   ============================================================ */

// ── CAR DATA ─────────────────────────────────────────────────
const cars = [
  { id:1,  brand:'Toyota',    model:'Corolla',      year:2023, price:28500, km:8500,    fuel:'Nafta',    trans:'Automático', color:'Blanco',  img:'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600', badge:'Nuevo',      featured:true  },
  { id:2,  brand:'Toyota',    model:'Hilux',        year:2022, price:42000, km:22000,   fuel:'Diesel',   trans:'Manual',     color:'Gris',    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', badge:'Destacado',  featured:true  },
  { id:3,  brand:'Chevrolet', model:'Onix',         year:2023, price:18900, km:5000,    fuel:'Nafta',    trans:'Automático', color:'Negro',   img:'https://images.unsplash.com/photo-1541443131876-3c51e0b8ace7?w=600', badge:'Nuevo',      featured:true  },
  { id:4,  brand:'Ford',      model:'Ranger',       year:2022, price:39500, km:31000,   fuel:'Diesel',   trans:'Automático', color:'Azul',    img:'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600', badge:'',           featured:true  },
  { id:5,  brand:'Volkswagen',model:'Golf',         year:2021, price:22000, km:45000,   fuel:'Nafta',    trans:'Automático', color:'Blanco',  img:'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600', badge:'',           featured:false },
  { id:6,  brand:'Renault',   model:'Duster',       year:2023, price:24500, km:12000,   fuel:'Nafta',    trans:'Manual',     color:'Rojo',    img:'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600', badge:'Nuevo',      featured:false },
  { id:7,  brand:'Honda',     model:'Civic',        year:2022, price:26000, km:18000,   fuel:'Nafta',    trans:'Automático', color:'Plateado',img:'https://images.unsplash.com/photo-1490902931801-d6f80ca94fe4?w=600', badge:'',           featured:false },
  { id:8,  brand:'Nissan',    model:'Frontier',     year:2023, price:38000, km:9000,    fuel:'Diesel',   trans:'Manual',     color:'Gris',    img:'https://images.unsplash.com/photo-1561136862-7f3e4f75e490?w=600', badge:'Nuevo',      featured:false },
  { id:9,  brand:'Peugeot',   model:'208',          year:2022, price:16500, km:28000,   fuel:'Nafta',    trans:'Manual',     color:'Rojo',    img:'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=600', badge:'',           featured:false },
  { id:10, brand:'Fiat',      model:'Pulse',        year:2023, price:21000, km:6500,    fuel:'Nafta',    trans:'Automático', color:'Blanco',  img:'https://images.unsplash.com/photo-1588258147419-34fe60bfc7d7?w=600', badge:'Nuevo',      featured:false },
  { id:11, brand:'Hyundai',   model:'Tucson',       year:2022, price:33000, km:20000,   fuel:'Nafta',    trans:'Automático', color:'Negro',   img:'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600', badge:'',           featured:false },
  { id:12, brand:'Kia',       model:'Sportage',     year:2023, price:36000, km:7800,    fuel:'Nafta',    trans:'Automático', color:'Gris',    img:'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600', badge:'Nuevo',      featured:false },
  { id:13, brand:'Mercedes',  model:'Clase A',      year:2021, price:48000, km:35000,   fuel:'Nafta',    trans:'Automático', color:'Negro',   img:'https://images.unsplash.com/photo-1617531653332-bd46c16f4d68?w=600', badge:'Premium',    featured:false },
  { id:14, brand:'BMW',       model:'Serie 3',      year:2022, price:62000, km:22000,   fuel:'Nafta',    trans:'Automático', color:'Azul',    img:'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600', badge:'Premium',    featured:false },
  { id:15, brand:'Chevrolet', model:'Tracker',      year:2023, price:27000, km:4000,    fuel:'Nafta',    trans:'Automático', color:'Blanco',  img:'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600', badge:'Nuevo',      featured:false },
  { id:16, brand:'Toyota',    model:'SW4',          year:2022, price:55000, km:28000,   fuel:'Diesel',   trans:'Automático', color:'Blanco',  img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600', badge:'',           featured:false },
  { id:17, brand:'Volvo',     model:'XC60',         year:2022, price:58000, km:19000,   fuel:'Nafta',    trans:'Automático', color:'Gris',    img:'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600', badge:'Premium',    featured:false },
];

// ── STATE ─────────────────────────────────────────────────────
let filtered = [...cars];
let currentPage = 1;
const PER_PAGE = 9;

const filterBrand  = document.getElementById('filterBrand');
const filterFuel   = document.getElementById('filterFuel');
const filterTrans  = document.getElementById('filterTrans');
const filterYearMin= document.getElementById('filterYearMin');
const filterYearMax= document.getElementById('filterYearMax');
const filterPriceMin=document.getElementById('filterPriceMin');
const filterPriceMax=document.getElementById('filterPriceMax');
const filterSort   = document.getElementById('filterSort');
const catalogGrid  = document.getElementById('catalogGrid');
const catalogCount = document.getElementById('catalogCount');
const paginationEl = document.getElementById('pagination');
const resetFilters = document.getElementById('resetFilters');
const searchInput  = document.getElementById('searchInput');

// Populate brand options
if (filterBrand) {
  const brands = [...new Set(cars.map(c => c.brand))].sort();
  brands.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b; opt.textContent = b;
    filterBrand.appendChild(opt);
  });
}

// ── URL SYNC ──────────────────────────────────────────────────
// Equivalente vanilla a setSearchParams() de React Router.
// Mantiene ?marca= sincronizado con el filtro activo sin recargar la página.
function syncBrandToURL(brand) {
  const url = new URL(window.location.href);
  if (brand) {
    url.searchParams.set('marca', brand);
  } else {
    url.searchParams.delete('marca');
  }
  history.replaceState({ marca: brand }, '', url);
}

// ── BRAND BADGE ───────────────────────────────────────────────
// Muestra/oculta el indicador visual de filtro activo.
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
    <button class="bf-clear" onclick="clearBrandFilter()" aria-label="Quitar filtro de marca">✕ Quitar filtro</button>
  `;
}

// Función pública para quitar el filtro de marca desde el badge.
window.clearBrandFilter = function () {
  if (filterBrand) filterBrand.value = '';
  applyFilters();
};

// ── FILTER LOGIC ──────────────────────────────────────────────
function applyFilters() {
  const brand    = filterBrand?.value || '';
  const fuel     = filterFuel?.value  || '';
  const trans    = filterTrans?.value || '';
  const yearMin  = parseInt(filterYearMin?.value)  || 0;
  const yearMax  = parseInt(filterYearMax?.value)  || 9999;
  const priceMin = parseInt(filterPriceMin?.value) || 0;
  const priceMax = parseInt(filterPriceMax?.value) || 9999999;
  const search   = searchInput?.value.toLowerCase().trim() || '';
  const sort     = filterSort?.value || 'featured';

  // DEBUG: equivalente a console.log("Marca desde URL:", marca) de React
  console.log('[Catálogo] Marca activa:', brand || '(todas)');
  console.log('[Catálogo] Total autos en base:', cars.length);

  filtered = cars.filter(c => {
    // Bug fix: comparación case-insensitive → "fiat" == "Fiat"
    if (brand && c.brand.toLowerCase() !== brand.toLowerCase()) return false;
    if (fuel  && c.fuel  !== fuel)       return false;
    if (trans && c.trans !== trans)      return false;
    if (c.year < yearMin || c.year > yearMax)    return false;
    if (c.price < priceMin || c.price > priceMax)return false;
    if (search && !`${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(search)) return false;
    return true;
  });

  console.log('[Catálogo] Resultados filtrados:', filtered.length);

  switch (sort) {
    case 'price-asc':  filtered.sort((a,b) => a.price - b.price); break;
    case 'price-desc': filtered.sort((a,b) => b.price - a.price); break;
    case 'year-desc':  filtered.sort((a,b) => b.year  - a.year);  break;
    case 'year-asc':   filtered.sort((a,b) => a.year  - b.year);  break;
    case 'km-asc':     filtered.sort((a,b) => a.km    - b.km);    break;
    default: filtered.sort((a,b) => (b.featured?1:0) - (a.featured?1:0)); break;
  }

  currentPage = 1;
  syncBrandToURL(brand);
  renderBrandBadge(brand);
  renderGrid();
  renderPagination();
}

// ── RENDER CARDS ──────────────────────────────────────────────
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
      </div>`;
    return;
  }

  catalogGrid.innerHTML = pageData.map(c => `
    <div class="vehicle-card animate-on-scroll">
      <div class="vehicle-card-img">
        <img src="${c.img}&auto=format&fit=crop" alt="${c.brand} ${c.model}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format'">
        ${c.badge ? `<span class="vehicle-card-badge">${c.badge}</span>` : ''}
        <button class="vehicle-card-favorite" title="Guardar" onclick="this.classList.toggle('active');this.textContent=this.classList.contains('active')?'❤️':'🤍'">🤍</button>
      </div>
      <div class="vehicle-card-body">
        <div class="vehicle-card-brand">${c.brand}</div>
        <div class="vehicle-card-name">${c.model} ${c.year}</div>
        <div class="vehicle-card-specs">
          <div class="spec-item"><span class="ic"><i class="ph ph-calendar"></i></span>${c.year}</div>
          <div class="spec-item"><span class="ic"><i class="ph ph-gas-pump"></i></span>${c.fuel}</div>
          <div class="spec-item"><span class="ic"><i class="ph ph-gear"></i></span>${c.trans}</div>
          <div class="spec-item"><span class="ic"><i class="ph ph-road"></i></span>${c.km.toLocaleString('es-UY')} km</div>
        </div>
        <div class="vehicle-card-footer">
          <a href="https://wa.me/59899364330?text=Hola!%20Consulto%20por%20el%20${encodeURIComponent(c.brand+' '+c.model+' '+c.year)}"
             target="_blank" class="btn btn-primary btn-sm" style="width:100%;justify-content:center" onclick="event.stopPropagation()">
            Consultar precio
          </a>
        </div>
      </div>
    </div>
  `).join('');

  // Re-observe new cards
  catalogGrid.querySelectorAll('.animate-on-scroll').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.06}s`;
    setTimeout(() => el.classList.add('visible'), 50);
  });
}

// ── PAGINATION ────────────────────────────────────────────────
function renderPagination() {
  if (!paginationEl) return;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = `<button class="page-btn prev" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>← Anterior</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn${i===currentPage?' active':''}" onclick="goPage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span style="padding:0 4px;color:var(--grey)">…</span>`;
    }
  }
  html += `<button class="page-btn next" onclick="goPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>Siguiente →</button>`;
  paginationEl.innerHTML = html;
}

window.goPage = function(p) {
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderGrid();
  renderPagination();
  document.getElementById('catalogMain')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── EVENT LISTENERS ───────────────────────────────────────────
[filterBrand, filterFuel, filterTrans, filterYearMin, filterYearMax, filterPriceMin, filterPriceMax, filterSort].forEach(el => {
  el?.addEventListener('change', applyFilters);
});
searchInput?.addEventListener('input', debounce(applyFilters, 300));

if (resetFilters) {
  resetFilters.addEventListener('click', () => {
    [filterBrand, filterFuel, filterTrans, filterSort].forEach(el => { if (el) el.value = ''; });
    [filterYearMin, filterYearMax, filterPriceMin, filterPriceMax].forEach(el => { if (el) el.value = ''; });
    if (searchInput) searchInput.value = '';
    applyFilters();
  });
}

function debounce(fn, wait) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// ── INIT ──────────────────────────────────────────────────────
// Lee ?marca= ANTES del primer applyFilters(), si no, syncBrandToURL('')
// borra el param de la URL antes de que pueda ser leído.
if (catalogGrid) {
  const marcaURL = new URLSearchParams(window.location.search).get('marca');
  console.log('[Catálogo] Marca desde URL:', marcaURL || '(ninguna)');

  if (marcaURL && filterBrand) {
    // Buscar option case-insensitive
    let opt = Array.from(filterBrand.options).find(
      o => o.value.toLowerCase() === marcaURL.toLowerCase()
    );
    // Si la marca no tiene autos (JAC, Mitsubishi…) no existe en el select → agregarla
    if (!opt) {
      opt = document.createElement('option');
      opt.value = marcaURL;
      opt.textContent = marcaURL;
      filterBrand.appendChild(opt);
    }
    filterBrand.value = opt.value;
  }

  applyFilters(); // Ahora filterBrand.value ya está seteado correctamente
}
