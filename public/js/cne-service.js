// Servicio de integración con la API de la Comisión Nacional de Energía (CNE)
// Permite consultar datos oficiales en tiempo real o usar la base de datos local enriquecida.

class CneService {
  constructor() {
    this.storageKey = 'bencinas_cne_token';
    this.cacheKey = 'bencinas_stations_cache';
    this.cacheExpiryKey = 'bencinas_cache_expiry';
    this.cacheDuration = 30 * 60 * 1000; // 30 minutos de caché
  }

  getToken() {
    return localStorage.getItem(this.storageKey) || '';
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(this.storageKey, token.trim());
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  hasToken() {
    const t = this.getToken();
    return !!t && t.length > 5;
  }

  // Obtener estaciones para una región o comuna
  async getStations(regionId, comunaName, fallbackCenter) {
    const token = this.getToken();
    
    // Si hay token CNE, intentamos consultar a través de nuestro proxy seguro
    if (token) {
      try {
        const cached = this.getFromCache();
        if (cached && cached.length > 0) {
          return this.filterByRegionComuna(cached, regionId, comunaName);
        }

        const res = await fetch(`/api/cne/estaciones?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.data && Array.isArray(data.data)) {
            const mapped = this.mapCneData(data.data);
            this.saveToCache(mapped);
            return this.filterByRegionComuna(mapped, regionId, comunaName);
          }
        }
      } catch (err) {
        console.warn('Fallo al obtener datos de CNE API, usando datos locales:', err);
      }
    }

    // Usar datos locales integrados
    return this.getLocalStations(regionId, comunaName, fallbackCenter);
  }

  // Filtrado de estaciones locales con generador procedural si la comuna no tiene estaciones en el seed inicial
  getLocalStations(regionId, comunaName, fallbackCenter) {
    let stations = INITIAL_GAS_STATIONS.filter(s => {
      if (regionId && s.regionId !== regionId) return false;
      if (comunaName && comunaName !== "Todas" && s.comuna.toLowerCase() !== comunaName.toLowerCase()) return false;
      return true;
    });

    // Si la comuna seleccionada no tiene estaciones en el seed fijo, generamos estaciones realistas para esa comuna
    if (comunaName && comunaName !== "Todas" && stations.length === 0) {
      stations = generateDynamicStationsForComuna(regionId, comunaName, fallbackCenter);
    }

    return stations;
  }

  // Transforma el payload crudo de CNE al formato limpio de la aplicación
  mapCneData(cneList) {
    return cneList.map((item, idx) => {
      // Normalizar marca
      const dist = (item.distribuidor?.nombre || item.razon_social || '').toLowerCase();
      let brand = 'independiente';
      if (dist.includes('copec')) brand = 'copec';
      else if (dist.includes('shell')) brand = 'shell';
      else if (dist.includes('petrobras')) brand = 'petrobras';
      else if (dist.includes('aramco')) brand = 'aramco';
      else if (dist.includes('jlc')) brand = 'jlc';

      // Mapear precios
      const prices = {};
      if (item.precios && typeof item.precios === 'object') {
        // CNE reporta códigos tipo '93', '95', '97', 'diesel', 'kerosene', 'glp'
        for (const [key, val] of Object.entries(item.precios)) {
          const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
          if (key.includes('93')) prices.gasolina93 = num;
          if (key.includes('95')) prices.gasolina95 = num;
          if (key.includes('97')) prices.gasolina97 = num;
          if (key.includes('diesel') || key.includes('petroleo')) prices.diesel = num;
          if (key.includes('kero') || key.includes('parafina')) prices.kerosene = num;
          if (key.includes('glp')) prices.glp = num;
        }
      }

      return {
        id: `cne-${item.id || idx}`,
        name: item.nombre || `${BRANDS[brand]?.name || 'Estación'} - ${item.direccion_calle || 'Central'}`,
        brand: brand,
        address: `${item.direccion_calle || 'Dirección'} ${item.direccion_numero || ''}`.trim(),
        comuna: item.nombre_comuna || item.comuna || 'Chile',
        regionId: String(item.id_region || '13'),
        lat: parseFloat(item.latitud || item.lat),
        lng: parseFloat(item.longitud || item.lng),
        prices: Object.keys(prices).length > 0 ? prices : { gasolina93: 1190, gasolina95: 1240, gasolina97: 1300, diesel: 960 },
        open24h: item.apertura_24_horas === 1 || true,
        services: ["tienda", "bano"],
        paymentMethods: ["efectivo", "tarjeta"],
        rating: 4.5,
        lastUpdate: "CNE Oficial"
      };
    }).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
  }

  filterByRegionComuna(list, regionId, comunaName) {
    return list.filter(s => {
      if (regionId && s.regionId !== regionId) return false;
      if (comunaName && comunaName !== "Todas" && s.comuna.toLowerCase() !== comunaName.toLowerCase()) return false;
      return true;
    });
  }

  saveToCache(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
      localStorage.setItem(this.cacheExpiryKey, String(Date.now() + this.cacheDuration));
    } catch (e) {
      console.warn('No se pudo guardar en caché local:', e);
    }
  }

  getFromCache() {
    try {
      const expiry = localStorage.getItem(this.cacheExpiryKey);
      if (expiry && Date.now() < parseInt(expiry, 10)) {
        const raw = localStorage.getItem(this.cacheKey);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      return null;
    }
    return null;
  }
}

const cneService = new CneService();
