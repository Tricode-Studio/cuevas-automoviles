/* ============================================================
   CUEVAS AUTOMÓVILES — INVENTORY API CLIENT (TRICODE CMS)
   ============================================================ */

(function inventoryApiBootstrap(global) {
  const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format';
  const BRAND_LOGO_FALLBACKS = {
    byd: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BYD_Auto_2022_logo.svg/320px-BYD_Auto_2022_logo.svg.png',
    chery: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Chery_logo.svg/320px-Chery_logo.svg.png',
    chevrolet: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Chevrolet-logo.png/320px-Chevrolet-logo.png',
    fiat: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Fiat_Automobiles_logo.svg/320px-Fiat_Automobiles_logo.svg.png',
    ford: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/320px-Ford_logo_flat.svg.png',
    honda: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Honda_Logo.svg/320px-Honda_Logo.svg.png',
    jac: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/JAC_Motors_logo.svg/320px-JAC_Motors_logo.svg.png',
    kia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Kia-logo.svg/320px-Kia-logo.svg.png',
    mitsubishi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mitsubishi_logo.svg/320px-Mitsubishi_logo.svg.png',
    nissan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Nissan-logo.svg/320px-Nissan-logo.svg.png',
    peugeot: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Peugeot_new_logo.svg/320px-Peugeot_new_logo.svg.png',
    renault: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Renault_2021_Text.svg/320px-Renault_2021_Text.svg.png',
    suzuki: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Suzuki_logo_2.svg/320px-Suzuki_logo_2.svg.png',
    toyota: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/320px-Toyota_carlogo.svg.png',
  };
  const DEFAULT_CMS_API_BASE = 'https://cms.tricode.studio/api/v1';
  const DEFAULT_TENANT_SLUG = 'cuevas-automoviles';
  const DEFAULT_VEHICLES_SLUG_CANDIDATES = [
    'products',
    'vehicles',
    'vehiculos',
    'autos',
    'cars',
  ];
  const KNOWN_BRANDS = [
    'toyota',
    'volkswagen',
    'chevrolet',
    'ford',
    'fiat',
    'nissan',
    'peugeot',
    'honda',
    'hyundai',
    'kia',
    'suzuki',
    'renault',
    'byd',
    'mitsubishi',
    'mercedes',
    'bmw',
    'audi',
  ];
  const CACHE_PREFIX = 'cuevas:inventory-cache:v1';
  const CACHE_TTL_MS = {
    inventory: 60 * 1000,
    brands: 5 * 60 * 1000,
  };
  const cacheMemory = new Map();
  const inflightRequests = new Map();

  function cleanText(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function normalizeToken(value) {
    return cleanText(value).toLowerCase();
  }

  function pick(source, keys) {
    if (!source || typeof source !== 'object') return undefined;
    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(source, key) &&
        source[key] !== undefined &&
        source[key] !== null &&
        source[key] !== ''
      ) {
        return source[key];
      }
    }
    return undefined;
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const cleaned = String(value)
      .replace(/\s+/g, '')
      .replace(/[^0-9,.-]/g, '')
      .replace(/\.(?=.*\.)/g, '')
      .replace(/,(?=\d{3}\b)/g, '')
      .replace(',', '.');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    const token = normalizeToken(value);
    return (
      token === 'true' ||
      token === '1' ||
      token === 'si' ||
      token === 'sí' ||
      token === 'yes' ||
      token === 'destacado' ||
      token === 'featured'
    );
  }

  function inferBrandModelFromTitle(title) {
    const text = cleanText(title);
    if (!text) return { brand: '', model: '', year: null };

    const tokens = text.split(/\s+/).filter(Boolean);
    if (!tokens.length) return { brand: '', model: text, year: null };

    const first = normalizeToken(tokens[0]);
    const brand = KNOWN_BRANDS.includes(first) ? tokens[0] : '';
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? Number(yearMatch[0]) : null;
    const model = brand ? tokens.slice(1).join(' ') : text;

    return {
      brand,
      model: cleanText(model),
      year: Number.isFinite(year) ? year : null,
    };
  }

  function toImageList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object')
            return pick(item, ['url', 'src', 'image', 'imagen', 'img']);
          return '';
        })
        .map(cleanText)
        .filter(Boolean);
    }
    if (typeof raw === 'string') {
      const value = raw.trim();
      if (!value) return [];
      if (value.includes(',')) {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [value];
    }
    if (typeof raw === 'object') {
      const direct = cleanText(
        pick(raw, ['publicUrl', 'accessUrl', 'url', 'src', 'image', 'imagen', 'img'])
      );
      if (direct) return [direct];
      const fileNode = raw.file && typeof raw.file === 'object' ? raw.file : null;
      const nestedFile = cleanText(
        pick(fileNode || {}, ['publicUrl', 'accessUrl', 'url', 'src', 'image', 'imagen', 'img'])
      );
      if (nestedFile) return [nestedFile];
      const nested = pick(raw, [
        'images',
        'imagenes',
        'photos',
        'fotos',
        'gallery',
        'galeria',
      ]);
      return toImageList(nested);
    }
    return [];
  }

  function resolveBrandImage(name, candidateImage) {
    const image = cleanText(candidateImage);
    if (image) return image;
    const token = normalizeToken(name);
    return BRAND_LOGO_FALLBACKS[token] || '';
  }

  function resolveConfig(options) {
    const opts = options || {};
    const queryTenantSlug =
      global.location && global.location.search
        ? cleanText(new URLSearchParams(global.location.search).get('tenant'))
        : '';
    const apiBaseUrl = cleanText(
      opts.cmsApiBaseUrl ||
        global.__CUEVAS_CMS_API_BASE__ ||
        global.CUEVAS_CMS_API_BASE_URL ||
        global.__CUEVAS_CATALOG_API_URL__ ||
        DEFAULT_CMS_API_BASE
    );
    const tenantSlug = cleanText(
      opts.tenantSlug ||
        queryTenantSlug ||
        global.__CUEVAS_TENANT_SLUG__ ||
        global.CUEVAS_TENANT_SLUG ||
        DEFAULT_TENANT_SLUG
    );
    const preferredVehiclesSlug = cleanText(
      opts.preferredVehiclesSlug ||
        global.__CUEVAS_CMS_VEHICLES_SLUG__ ||
        global.CUEVAS_CMS_VEHICLES_SLUG
    );
    return { apiBaseUrl, tenantSlug, preferredVehiclesSlug };
  }

  function getCacheStorage() {
    try {
      return global.sessionStorage || null;
    } catch (error) {
      return null;
    }
  }

  function buildCacheKey(scope, config) {
    const baseToken = normalizeToken(cleanText(config.apiBaseUrl));
    const tenantToken = normalizeToken(cleanText(config.tenantSlug));
    const vehicleToken = normalizeToken(cleanText(config.preferredVehiclesSlug || ''));
    return `${CACHE_PREFIX}:${scope}:${baseToken}:${tenantToken}:${vehicleToken}`;
  }

  function getCachedPayload(cacheKey, maxAgeMs) {
    const now = Date.now();
    const inMemory = cacheMemory.get(cacheKey);
    if (inMemory && now - inMemory.ts <= maxAgeMs) {
      return inMemory.data;
    }

    const storage = getCacheStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (typeof parsed.ts !== 'number' || !('data' in parsed)) return null;
      if (now - parsed.ts > maxAgeMs) return null;
      cacheMemory.set(cacheKey, { ts: parsed.ts, data: parsed.data });
      return parsed.data;
    } catch (error) {
      return null;
    }
  }

  function getStaleCachedPayload(cacheKey) {
    const inMemory = cacheMemory.get(cacheKey);
    if (inMemory) return inMemory.data;
    const storage = getCacheStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : null;
    } catch (error) {
      return null;
    }
  }

  function setCachedPayload(cacheKey, data) {
    const payload = { ts: Date.now(), data };
    cacheMemory.set(cacheKey, payload);
    const storage = getCacheStorage();
    if (!storage) return;
    try {
      storage.setItem(cacheKey, JSON.stringify(payload));
    } catch (error) {
      // Ignore quota and serialization errors.
    }
  }

  function runWithInflight(cacheKey, producer) {
    if (inflightRequests.has(cacheKey)) {
      return inflightRequests.get(cacheKey);
    }
    const promise = Promise.resolve()
      .then(producer)
      .finally(() => inflightRequests.delete(cacheKey));
    inflightRequests.set(cacheKey, promise);
    return promise;
  }

  function buildCmsPublicBase(apiBaseUrl, tenantSlug) {
    const base = cleanText(apiBaseUrl).replace(/\/+$/, '');
    if (!base) return '';
    if (/\/public\/[^/]+$/i.test(base)) return base;
    if (/\/api\/v1$/i.test(base)) {
      return `${base}/public/${tenantSlug}`;
    }
    if (/\/api\/v1\/public$/i.test(base)) {
      return `${base}/${tenantSlug}`;
    }
    return `${base}/public/${tenantSlug}`;
  }

  function buildCmsApiV1Base(apiBaseUrl) {
    const base = cleanText(apiBaseUrl).replace(/\/+$/, '');
    if (!base) return '';
    if (/\/api\/v1$/i.test(base)) return base;
    if (/\/api\/v1\/public$/i.test(base)) return base.replace(/\/public$/i, '');
    if (/\/public\/[^/]+$/i.test(base)) return base.replace(/\/public\/[^/]+$/i, '');
    return `${base}/api/v1`;
  }

  function buildLegacyInventoryUrl(baseUrl) {
    const raw = cleanText(baseUrl);
    if (!raw) return '';
    if (/\/(vehicles|vehiculos|autos|cars)(\/?(\?|$))/i.test(raw)) return raw;
    return `${raw.replace(/\/+$/, '')}/vehicles`;
  }

  function extractInventoryArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    const directKeys = [
      'vehicles',
      'vehiculos',
      'autos',
      'cars',
      'items',
      'results',
      'inventario',
      'inventory',
      'data',
    ];
    for (const key of directKeys) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    const dataNode = payload.data;
    if (dataNode && typeof dataNode === 'object') {
      for (const key of directKeys) {
        if (Array.isArray(dataNode[key])) return dataNode[key];
      }
    }
    return [];
  }

  function normalizeVehicle(rawVehicle, index) {
    if (!rawVehicle || typeof rawVehicle !== 'object') return null;

    const data = rawVehicle.data && typeof rawVehicle.data === 'object' ? rawVehicle.data : rawVehicle;
    const media = Array.isArray(rawVehicle.media) ? rawVehicle.media : [];

    const rawTitle = cleanText(
      pick(rawVehicle, ['title', 'name']) || pick(data, ['title', 'name', 'nombre'])
    );
    const inferredFromTitle = inferBrandModelFromTitle(rawTitle);

    const brand =
      cleanText(pick(data, ['brand', 'marca', 'make'])) || inferredFromTitle.brand;
    const model =
      cleanText(pick(data, ['model', 'modelo', 'name', 'nombre'])) ||
      inferredFromTitle.model;
    const year =
      toNumber(pick(data, ['year', 'anio', 'año'])) ??
      inferredFromTitle.year;
    const price = toNumber(pick(data, ['price', 'precio', 'usd', 'valor']));
    const km = toNumber(
      pick(data, ['km', 'kms', 'kilometros', 'kilometraje', 'mileageKm', 'mileage'])
    );
    const fuel = cleanText(pick(data, ['fuel', 'combustible', 'fuelType']));
    const trans = cleanText(pick(data, ['trans', 'transmission', 'transmision']));
    const color = cleanText(pick(data, ['color', 'colour']));
    const badge = cleanText(pick(data, ['badge', 'etiqueta', 'tag', 'condition']));
    const status = cleanText(pick(data, ['status', 'estado', 'stockStatus']));
    const featured = toBoolean(pick(data, ['featured', 'destacado', 'is_featured', 'isFeatured', 'priority', 'financeAvailable']));

    const dataImages = toImageList(
      pick(data, [
        'imgs',
        'images',
        'imagenes',
        'photos',
        'fotos',
        'gallery',
        'galeria',
        'media',
        'coverImage',
      ])
    );
    const mediaImages = media
      .map((m) => cleanText(pick(m.file || m, ['publicUrl', 'url', 'src'])))
      .filter(Boolean);
    const imgs = Array.from(new Set([...dataImages, ...mediaImages])).filter(Boolean);
    const finalImages = imgs.length ? imgs : [FALLBACK_IMAGE];
    const id =
      pick(rawVehicle, ['id', '_id', 'uuid', 'slug']) ||
      `${normalizeToken(brand)}-${normalizeToken(model)}-${year || index + 1}`;

    if (!brand && !model && !rawTitle) return null;

    return {
      id,
      brand: brand || 'Sin marca',
      model: model || rawTitle || 'Sin modelo',
      year: year || 0,
      price: price || 0,
      km: km || 0,
      fuel: fuel || 'No especificado',
      trans: trans || 'No especificado',
      color: color || '',
      badge: badge || '',
      status: status || '',
      featured,
      img: finalImages[0],
      imgs: finalImages,
    };
  }

  function pickVehiclesContentTypeSlugs(manifest, preferredSlug) {
    const types = Array.isArray(manifest?.contentTypes) ? manifest.contentTypes : [];
    const bySlug = new Map(
      types.map((type) => [normalizeToken(type.slug), cleanText(type.slug)])
    );
    const candidates = [];
    const isBrandLike = (value) =>
      /\b(brand|brands|marca|marcas)\b/i.test(cleanText(value));

    if (cleanText(preferredSlug)) {
      candidates.push(cleanText(preferredSlug));
    }

    const recommendedCatalogSlug = cleanText(
      manifest?.recommendations?.catalogContentTypeSlug
    );
    if (recommendedCatalogSlug && !isBrandLike(recommendedCatalogSlug)) {
      candidates.push(recommendedCatalogSlug);
    }

    const orderedKnown = DEFAULT_VEHICLES_SLUG_CANDIDATES
      .map((slug) => bySlug.get(normalizeToken(slug)))
      .filter(Boolean);
    candidates.push(...orderedKnown);

    const byModule = types
      .filter((type) => {
        const module = normalizeToken(type.module);
        const slug = cleanText(type.slug);
        const name = cleanText(type.name);
        return module === 'catalog' && !isBrandLike(slug) && !isBrandLike(name);
      })
      .sort((a, b) => Number(b.publishedCount || 0) - Number(a.publishedCount || 0))
      .map((type) => cleanText(type.slug));
    candidates.push(...byModule);

    const byNameHints = types
      .filter((type) => {
        const slug = cleanText(type.slug);
        const name = cleanText(type.name);
        return /vehicle|vehicul|auto|car|product|producto/i.test(`${slug} ${name}`);
      })
      .map((type) => cleanText(type.slug));
    candidates.push(...byNameHints);

    const byFields = types
      .filter((type) => {
      const fields = Array.isArray(type.publicFields) ? type.publicFields.map((f) => normalizeToken(f)) : [];
      const hasBrand = fields.includes('brand') || fields.includes('marca');
      const hasModel = fields.includes('model') || fields.includes('modelo');
      const hasYear = fields.includes('year') || fields.includes('anio');
      return hasBrand && (hasModel || hasYear);
      })
      .sort((a, b) => Number(b.publishedCount || 0) - Number(a.publishedCount || 0))
      .map((type) => cleanText(type.slug));
    candidates.push(...byFields);

    const unique = Array.from(new Set(candidates.filter(Boolean)));
    return unique;
  }

  function buildVehicleSlugCandidates(preferredSlug, manifest) {
    const candidates = [];
    if (cleanText(preferredSlug)) {
      candidates.push(cleanText(preferredSlug));
    }
    if (manifest) {
      const manifestCandidates = pickVehiclesContentTypeSlugs(manifest, preferredSlug);
      if (manifestCandidates.length > 0) {
        candidates.push(...manifestCandidates);
        return Array.from(new Set(candidates.filter(Boolean)));
      }
    }
    candidates.push(...DEFAULT_VEHICLES_SLUG_CANDIDATES);
    return Array.from(new Set(candidates.filter(Boolean)));
  }

  function pickBrandsContentTypeSlug(manifest) {
    const types = Array.isArray(manifest?.contentTypes) ? manifest.contentTypes : [];
    const brands = types.find((type) => normalizeToken(type.slug) === 'brands');
    if (brands) return brands.slug;
    const heuristic = types.find((type) =>
      /\b(brand|brands|marca|marcas)\b/i.test(`${cleanText(type.slug)} ${cleanText(type.name)}`)
    );
    if (heuristic) return heuristic.slug;
    const moduleCandidate = types.find((type) => normalizeToken(type.module) === 'catalog');
    if (moduleCandidate) return moduleCandidate.slug;
    return brands ? brands.slug : '';
  }

  function normalizeBrandsFromPayload(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : extractInventoryArray(payload);
    return Array.from(
      new Set(
        items
          .map((item) => {
            if (!item || typeof item !== 'object') return '';
            const data = item.data && typeof item.data === 'object' ? item.data : item;
            return cleanText(pick(data, ['brand', 'marca', 'name', 'nombre'])) || cleanText(item.title);
          })
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'es'));
  }

  function normalizeBrandCardsFromVehicleInventory(vehicles) {
    const byBrand = new Map();
    for (const vehicle of vehicles || []) {
      const name = cleanText(vehicle?.brand);
      if (!name) continue;
      const key = normalizeToken(name);
      if (!byBrand.has(key)) {
        byBrand.set(key, {
          name,
          image: resolveBrandImage(name, ''),
        });
      }
    }
    return Array.from(byBrand.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  function normalizeBrandCardsFromPayload(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : extractInventoryArray(payload);
    const cards = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const data = item.data && typeof item.data === 'object' ? item.data : item;
      const media = Array.isArray(item.media) ? item.media : [];

      const name =
        cleanText(pick(data, ['name', 'nombre', 'brand', 'marca'])) ||
        cleanText(pick(item, ['name', 'nombre', 'brand', 'marca'])) ||
        cleanText(item.title);
      if (!name) continue;

      const dataImage = toImageList(
        pick(data, ['image', 'imagen', 'logo', 'brandImage', 'coverImage', 'featuredImage']) ||
          pick(item, ['image', 'imagen', 'logo', 'brandImage', 'coverImage', 'featuredImage'])
      );
      const mediaImage = media
        .map((m) => cleanText(pick(m.file || m, ['publicUrl', 'url', 'src', 'image'])))
        .filter(Boolean);
      const images = Array.from(new Set([...dataImage, ...mediaImage])).filter(Boolean);

      cards.push({
        name,
        image: resolveBrandImage(name, images[0] || ''),
      });
    }

    const byName = new Map();
    for (const card of cards) {
      const key = normalizeToken(card.name);
      if (!byName.has(key)) {
        byName.set(key, card);
      } else if (!byName.get(key).image && card.image) {
        byName.set(key, card);
      }
    }

    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`API ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async function fetchInventoryFromCms(config) {
    const publicBase = buildCmsPublicBase(config.apiBaseUrl, config.tenantSlug);
    const apiV1Base = buildCmsApiV1Base(config.apiBaseUrl);
    const manifestUrl = `${publicBase}/integration-manifest`;
    let manifest = null;
    try {
      manifest = await fetchJson(manifestUrl);
    } catch (error) {
      manifest = null;
    }

    const vehicleSlugCandidates = buildVehicleSlugCandidates(
      config.preferredVehiclesSlug,
      manifest
    );
    const brandsSlug = manifest ? pickBrandsContentTypeSlug(manifest) : '';
    const brandsPublicUrl = `${publicBase}/brands?limit=48`;
    const brandsEntriesUrl = brandsSlug
      ? `${publicBase}/content-types/${encodeURIComponent(brandsSlug)}/entries?limit=48`
      : '';

    let vehiclesUrl = manifestUrl;
    let vehiclesPayload = { items: [] };
    let vehicles = [];

    for (const slug of vehicleSlugCandidates) {
      const publicUrl = `${publicBase}/content-types/${encodeURIComponent(slug)}/entries?limit=48`;
      try {
        const payload = await fetchJson(publicUrl);
        const rawPublicVehicles = Array.isArray(payload?.items)
          ? payload.items
          : extractInventoryArray(payload);
        const normalizedPublicVehicles = rawPublicVehicles
          .map((vehicle, index) => normalizeVehicle(vehicle, index))
          .filter(Boolean);

        vehiclesUrl = publicUrl;
        vehiclesPayload = payload;
        vehicles = normalizedPublicVehicles;
        if (vehicles.length > 0) {
          break;
        }
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('404')) {
          throw error;
        }
      }
    }

    // Fallback controlado: si la API pública no devuelve unidades, intentamos
    // el endpoint tenant forzando status=PUBLISHED para no exponer borradores.
    if (vehicles.length === 0 && apiV1Base) {
      for (const slug of vehicleSlugCandidates) {
        const tenantUrl = `${apiV1Base}/tenants/${encodeURIComponent(
          config.tenantSlug
        )}/content-types/${encodeURIComponent(slug)}/entries?page=1&pageSize=48&status=PUBLISHED`;
        try {
          const payload = await fetchJson(tenantUrl);
          const rawTenantVehicles = Array.isArray(payload?.items)
            ? payload.items
            : extractInventoryArray(payload);
          const normalizedTenantVehicles = rawTenantVehicles
            .map((vehicle, index) => normalizeVehicle(vehicle, index))
            .filter(Boolean);

          vehiclesUrl = tenantUrl;
          vehiclesPayload = payload;
          vehicles = normalizedTenantVehicles;
          if (vehicles.length > 0) {
            break;
          }
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes('404')) {
            throw error;
          }
        }
      }
    }

    let brands = [];
    let brandCards = [];
    if (brandsPublicUrl) {
      try {
        const brandsPayload = await fetchJson(brandsPublicUrl);
        brandCards = normalizeBrandCardsFromPayload(brandsPayload);
        brands = brandCards.map((card) => card.name);
      } catch (error) {
        brandCards = [];
        brands = [];
      }
    }

    if (!brands.length && brandsEntriesUrl) {
      try {
        const brandsPayload = await fetchJson(brandsEntriesUrl);
        brandCards = normalizeBrandCardsFromPayload(brandsPayload);
        brands = brandCards.map((card) => card.name);
      } catch (error) {
        brandCards = [];
        brands = [];
      }
    }

    if (!brands.length) {
      brandCards = normalizeBrandCardsFromVehicleInventory(vehicles);
      brands = brandCards.map((card) => card.name);
    }

    return {
      vehicles,
      brands,
      brandCards,
      inventoryUrl: vehiclesUrl,
      manifest,
    };
  }

  async function fetchInventoryFromLegacy(baseUrl) {
    const inventoryUrl = buildLegacyInventoryUrl(baseUrl);
    if (!inventoryUrl) {
      throw new Error('Falta configurar PUBLIC_CMS_API_BASE_URL');
    }
    const payload = await fetchJson(inventoryUrl);
    const rawVehicles = extractInventoryArray(payload);
    const vehicles = rawVehicles
      .map((vehicle, index) => normalizeVehicle(vehicle, index))
      .filter(Boolean);
    const brands = Array.from(new Set(vehicles.map((vehicle) => vehicle.brand))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );
    const brandCards = brands.map((name) => {
      const firstVehicle = vehicles.find((vehicle) => normalizeToken(vehicle.brand) === normalizeToken(name));
      return {
        name,
        image: cleanText(firstVehicle?.img || ''),
      };
    });
    return { vehicles, brands, brandCards, inventoryUrl, manifest: null };
  }

  async function fetchBrandsFromCms(config) {
    const publicBase = buildCmsPublicBase(config.apiBaseUrl, config.tenantSlug);
    const apiV1Base = buildCmsApiV1Base(config.apiBaseUrl);
    const brandsPublicUrl = `${publicBase}/brands?limit=48`;

    const tryBuild = async (url) => {
      const payload = await fetchJson(url);
      const brandCards = normalizeBrandCardsFromPayload(payload);
      const brands = brandCards.map((card) => card.name);
      return { brands, brandCards };
    };

    try {
      const publicResult = await tryBuild(brandsPublicUrl);
      if (publicResult.brands.length > 0) {
        return { ...publicResult, manifest: null };
      }
    } catch (error) {
      // Intentamos fallback.
    }

    if (apiV1Base) {
      const tenantBrandsUrl = `${apiV1Base}/tenants/${encodeURIComponent(
        config.tenantSlug
      )}/content-types/brands/entries?page=1&pageSize=48&status=PUBLISHED`;
      try {
        const tenantResult = await tryBuild(tenantBrandsUrl);
        if (tenantResult.brands.length > 0) {
          return { ...tenantResult, manifest: null };
        }
      } catch (tenantBrandsError) {
        // Si falla este fallback, continuamos con fallback general.
      }
    }

    const fallbackInventory = await fetchInventoryFromCms(config);
    return {
      brands: fallbackInventory.brands,
      brandCards: fallbackInventory.brandCards,
      manifest: fallbackInventory.manifest,
    }
  }

  async function fetchBrands(options) {
    const config = resolveConfig(options);
    const cacheKey = buildCacheKey('brands', config);
    const cached = getCachedPayload(cacheKey, CACHE_TTL_MS.brands);
    if (cached) return cached;

    return runWithInflight(cacheKey, async () => {
      try {
        const isCmsMode =
          /\/api\/v1(\/|$)/i.test(config.apiBaseUrl) ||
          /\/public\/[^/]+/i.test(config.apiBaseUrl);
        const payload = isCmsMode
          ? await fetchBrandsFromCms(config)
          : await fetchInventoryFromLegacy(config.apiBaseUrl);
        const normalized = {
          brands: Array.isArray(payload.brands) ? payload.brands : [],
          brandCards: Array.isArray(payload.brandCards) ? payload.brandCards : [],
          manifest: payload.manifest || null,
        };
        setCachedPayload(cacheKey, normalized);
        return normalized;
      } catch (error) {
        const stale = getStaleCachedPayload(cacheKey);
        if (stale) return stale;
        throw error;
      }
    });
  }

  async function fetchInventory(options) {
    const config = resolveConfig(options);
    const cacheKey = buildCacheKey('inventory', config);
    const cached = getCachedPayload(cacheKey, CACHE_TTL_MS.inventory);
    if (cached) return cached;

    return runWithInflight(cacheKey, async () => {
      try {
        const isCmsMode =
          /\/api\/v1(\/|$)/i.test(config.apiBaseUrl) ||
          /\/public\/[^/]+/i.test(config.apiBaseUrl);

        const payload = isCmsMode
          ? await fetchInventoryFromCms(config)
          : await fetchInventoryFromLegacy(config.apiBaseUrl);
        setCachedPayload(cacheKey, payload);
        return payload;
      } catch (error) {
        const stale = getStaleCachedPayload(cacheKey);
        if (stale) return stale;
        throw error;
      }
    });
  }

  global.CuevasInventoryApi = {
    fetchInventory,
    fetchBrands,
    resolveConfig,
    buildCmsPublicBase,
  };
})(window);
