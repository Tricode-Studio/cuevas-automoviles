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

    featuredGrid.innerHTML = vehicles.map((car, index) => {
      const imgs = Array.isArray(car.imgs) && car.imgs.length ? car.imgs : [car.img || FALLBACK_IMAGE];
      const slides = imgs.map((src, i) => `
        <img src="${src}" class="gallery-slide${i === 0 ? ' active' : ''}" alt="${car.brand} ${car.model} - foto ${i + 1}" loading="lazy"
             onerror="this.src='${FALLBACK_IMAGE}'" onclick="openLightboxFromGallery('${car.id}',${i},event)">`).join('');
      const arrows = imgs.length > 1 ? `
        <button class="gallery-arrow prev" onclick="galleryNav('${car.id}',-1,event)" aria-label="Foto anterior">&#8249;</button>
        <button class="gallery-arrow next" onclick="galleryNav('${car.id}',1,event)" aria-label="Foto siguiente">&#8250;</button>
        <div class="gallery-dots">${imgs.map((_, i) => `<span class="gallery-dot${i === 0 ? ' active' : ''}" onclick="galleryGo('${car.id}',${i},event)"></span>`).join('')}</div>` : '';
      return `
      <div class="vehicle-card" style="opacity:1;transform:none;animation:fadeInUp .5s ease ${index * 0.12}s both">
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
            <a href="https://wa.me/59899364330?text=Hola!%20Me%20interesa%20el%20${encodeURIComponent(car.brand + ' ' + car.model + ' ' + car.year)}" target="_blank" class="btn btn-primary btn-sm" style="width:100%;justify-content:center">Consultar precio</a>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function renderBrands(brandCards) {
    if (!brandsGrid) return;
    if (!brandCards.length) {
      brandsGrid.innerHTML = '<div style="grid-column:1/-1;color:rgba(255,255,255,.7);text-align:center;padding:20px 0">Sin marcas disponibles</div>';
      return;
    }

    const cards = brandCards.slice(0, 8).map((brand, index) => {
      const logoContent = brand.image
        ? `<img src="${brand.image}" alt="${brand.name} logo" loading="lazy"
               style="max-width:110px;max-height:60px;width:auto;height:auto;object-fit:contain;filter:brightness(0) invert(1);opacity:.85;transition:opacity .2s"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
           <span style="display:none;font-size:1rem;font-weight:800;letter-spacing:-.02em;color:rgba(255,255,255,.85)">${brand.name}</span>`
        : `<span style="font-size:1rem;font-weight:800;letter-spacing:-.02em;color:rgba(255,255,255,.85)">${brand.name}</span>`;
      return `
        <a href="/catalogo?marca=${encodeURIComponent(brand.name)}" class="brand-card animate-on-scroll delay-${index % 4}">
          ${logoContent}
        </a>`;
    }).join('');

    brandsGrid.innerHTML = `${cards}
      <a href="/catalogo" class="brand-card animate-on-scroll" style="background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.3)">
        <span style="font-size:2rem"><i class="ph ph-arrow-right"></i></span>
        <span style="font-size:.82rem;font-weight:600;color:rgba(255,255,255,.7)">Ver todo</span>
      </a>`;
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

    const canFetchBrands = typeof window.CuevasInventoryApi.fetchBrands === 'function';

    try {
      const brandsPromise = canFetchBrands
        ? window.CuevasInventoryApi.fetchBrands()
        : window.CuevasInventoryApi.fetchInventory();
      const inventoryPromise = window.CuevasInventoryApi.fetchInventory();

      let resolvedBrandCards = [];
      try {
        const brandsPayload = await brandsPromise;
        resolvedBrandCards = Array.isArray(brandsPayload?.brandCards) ? brandsPayload.brandCards : [];
        if (!resolvedBrandCards.length && Array.isArray(brandsPayload?.brands)) {
          resolvedBrandCards = brandsPayload.brands.map((name) => ({ name, image: '' }));
        }
        renderBrands(resolvedBrandCards);
        updateBrandCounter(resolvedBrandCards.length);
      } catch (brandsError) {
        renderBrands([]);
      }

      const { vehicles, brandCards: inventoryBrandCards, brands: inventoryBrands } = await inventoryPromise;
      renderFeaturedVehicles(pickFeatured(vehicles));
      if (!resolvedBrandCards.length) {
        const fallback = Array.isArray(inventoryBrandCards) && inventoryBrandCards.length
          ? inventoryBrandCards
          : (Array.isArray(inventoryBrands) ? inventoryBrands.map((name) => ({ name, image: '' })) : []);
        renderBrands(fallback);
        updateBrandCounter(fallback.length);
      }
    } catch (error) {
      renderFeaturedVehicles([]);
      renderBrands([]);
      console.error('[Home] Error cargando inventario:', error);
    }
  }

  init();
})();
