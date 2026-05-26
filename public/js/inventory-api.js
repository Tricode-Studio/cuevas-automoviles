/* ============================================================
   CUEVAS AUTOMÓVILES — INVENTORY API CLIENT (TRICODE CMS)
   ============================================================ */

(function inventoryApiBootstrap(global) {
  const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format';
  const BRAND_LOGO_FALLBACKS = {
    byd: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BYD_Auto_2022_logo.svg/320px-BYD_Auto_2022_logo.svg.png',
    chevrolet: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Chevrolet-logo.png/320px-Chevrolet-logo.png',
    ford: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/320px-Ford_logo_flat.svg.png',
    honda: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Honda_Logo.svg/320px-Honda_Logo.svg.png',
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

    const brand = cleanText(pick(data, ['brand', 'marca', 'make']));
    const model = cleanText(pick(data, ['model', 'modelo', 'name', 'nombre']));
    const year = toNumber(pick(data, ['year', 'anio', 'año']));
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

    if (!brand && !model) return null;

    return {
      id,
      brand: brand || 'Sin marca',
      model: model || 'Sin modelo',
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

    if (cleanText(preferredSlug)) {
      candidates.push(cleanText(preferredSlug));
    }

    const orderedKnown = DEFAULT_VEHICLES_SLUG_CANDIDATES
      .map((slug) => bySlug.get(normalizeToken(slug)))
      .filter(Boolean);
    candidates.push(...orderedKnown);

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

    // Fallback para entries no publicados (p. ej. DRAFT) visibles en el panel del CMS.
    if (vehicles.length === 0 && apiV1Base) {
      for (const slug of vehicleSlugCandidates) {
        const tenantUrl = `${apiV1Base}/tenants/${encodeURIComponent(
          config.tenantSlug
        )}/content-types/${encodeURIComponent(slug)}/entries?page=1&pageSize=48`;
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
      const byBrand = new Map();
      for (const vehicle of vehicles) {
        const name = cleanText(vehicle.brand);
        if (!name) continue;
        const key = normalizeToken(name);
        if (!byBrand.has(key)) {
          byBrand.set(key, { name, image: resolveBrandImage(name, cleanText(vehicle.img || '')) });
        }
      }
      brandCards = Array.from(byBrand.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
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

  async function fetchInventory(options) {
    const config = resolveConfig(options);
    const isCmsMode =
      /\/api\/v1(\/|$)/i.test(config.apiBaseUrl) ||
      /\/public\/[^/]+/i.test(config.apiBaseUrl);

    if (isCmsMode) {
      return fetchInventoryFromCms(config);
    }
    return fetchInventoryFromLegacy(config.apiBaseUrl);
  }

  global.CuevasInventoryApi = {
    fetchInventory,
    resolveConfig,
    buildCmsPublicBase,
  };
})(window);
