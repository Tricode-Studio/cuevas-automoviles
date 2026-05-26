/* ============================================================
   CUEVAS AUTOMÓVILES — HOME INVENTORY RENDER
   ============================================================ */

(function homeCatalogInit() {
  const featuredGrid = document.getElementById('featuredGrid');
  const brandsGrid = document.getElementById('homeBrandsGrid');
  if (!featuredGrid && !brandsGrid) return;

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format';

  function renderFeaturedVehicles(vehicles) {
    if (!featuredGrid) return;
    if (!vehicles.length) {
      featuredGrid.innerHTML = `
        <div class="no-results" style="grid-column:1/-1">
          <div class="icon">🚗</div>
          <h3>Sin vehículos para mostrar</h3>
          <p>Pronto publicaremos nuevas unidades destacadas.</p>
        </div>
      `;
      return;
    }

    featuredGrid.innerHTML = vehicles.map((car, index) => `
      <div class="vehicle-card" style="opacity:1;transform:none;animation:fadeInUp .5s ease ${index * 0.12}s both">
        <div class="vehicle-card-img">
          <img src="${car.img || FALLBACK_IMAGE}" alt="${car.brand} ${car.model}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
          ${car.badge ? `<span class="vehicle-card-badge">${car.badge}</span>` : ''}
          <button class="vehicle-card-favorite" onclick="this.classList.toggle('active');this.textContent=this.classList.contains('active')?'❤️':'🤍'">🤍</button>
        </div>
        <div class="vehicle-card-body">
          <div class="vehicle-card-brand">${car.brand}</div>
          <div class="vehicle-card-name">${car.model} ${car.year || ''}</div>
          <div class="vehicle-card-specs">
            <div class="spec-item"><i class="ph ph-calendar"></i> ${car.year || '-'}</div>
            <div class="spec-item"><i class="ph ph-gas-pump"></i> ${car.fuel || '-'}</div>
            <div class="spec-item"><i class="ph ph-gear"></i> ${car.trans || '-'}</div>
            <div class="spec-item"><i class="ph ph-road"></i> ${Number(car.km || 0).toLocaleString('es-UY')} km</div>
          </div>
          <div class="vehicle-card-footer">
            <a href="https://wa.me/59899364330?text=Hola!%20Me%20interesa%20el%20${encodeURIComponent(car.brand + ' ' + car.model + ' ' + car.year)}" target="_blank" class="btn btn-primary btn-sm" style="width:100%;justify-content:center">Consultar precio</a>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderBrands(brands) {
    if (!brandsGrid) return;
    if (!brands.length) {
      brandsGrid.innerHTML = '<div style="grid-column:1/-1;color:rgba(255,255,255,.7);text-align:center;padding:20px 0">Sin marcas disponibles</div>';
      return;
    }

    const brandCards = brands.slice(0, 8).map((brand, index) => `
      <a href="/catalogo?marca=${encodeURIComponent(brand)}" class="brand-card animate-on-scroll delay-${index % 4}">
        <span style="font-size:2.5rem"><i class="ph ph-car"></i></span>
        <span>${brand}</span>
      </a>
    `).join('');

    brandsGrid.innerHTML = `${brandCards}
      <a href="/catalogo" class="brand-card animate-on-scroll" style="background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.3)">
        <span style="font-size:2.5rem"><i class="ph ph-plus"></i></span>
        <span>Ver todo</span>
      </a>
    `;
  }

  function pickFeatured(vehicles) {
    const featured = vehicles.filter((vehicle) => vehicle.featured);
    if (featured.length >= 4) {
      return featured.slice(0, 4);
    }
    const sorted = [...vehicles].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.price - a.price;
    });
    return sorted.slice(0, 4);
  }

  function updateBrandCounter(brandsCount) {
    const labels = document.querySelectorAll('.hero-stats .stat-label');
    labels.forEach((label) => {
      if (label.textContent.trim().toLowerCase() === 'marcas oficiales') {
        const counter = label.parentElement?.querySelector('[data-target]');
        if (counter) {
          counter.dataset.target = String(brandsCount);
          counter.textContent = String(brandsCount);
        }
      }
    });
  }

  async function init() {
    if (!window.CuevasInventoryApi || typeof window.CuevasInventoryApi.fetchInventory !== 'function') {
      renderFeaturedVehicles([]);
      renderBrands([]);
      return;
    }

    try {
      const { vehicles, brands } = await window.CuevasInventoryApi.fetchInventory();
      renderFeaturedVehicles(pickFeatured(vehicles));
      renderBrands(brands);
      updateBrandCounter(brands.length);
    } catch (error) {
      renderFeaturedVehicles([]);
      renderBrands([]);
      console.error('[Home] Error cargando inventario:', error);
    }
  }

  init();
})();
