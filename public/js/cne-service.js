// Integración con la API de la Comisión Nacional de Energía (CNE).
// El token vive exclusivamente en el servidor; el navegador nunca lo almacena ni lo envía.
class CneService {
  constructor() {
    this.cacheKey = 'bencinas_stations_cache';
    this.cacheExpiryKey = 'bencinas_cache_expiry';
    this.cacheDuration = 30 * 60 * 1000; // 30 minutos

    // Elimina el token de versiones anteriores, que se guardaba en localStorage.
    try {
      localStorage.removeItem('bencinas_cne_token');
    } catch (error) {
      // La aplicación debe seguir funcionando aunque el navegador bloquee storage.
    }
  }

  async getStatus() {
    try {
      const response = await fetch('/api/cne/status');
      if (!response.ok) return { configured: false, available: false };
      const status = await response.json();
      return { configured: status.configured === true, available: true };
    } catch (error) {
      return { configured: false, available: false };
    }
  }

  async getStations(regionId, comunaName, fallbackCenter) {
    const status = await this.getStatus();
    if (!status.configured) {
      return this.getLocalStations(regionId, comunaName, fallbackCenter);
    }

    const cached = this.getFromCache();
    if (cached && cached.length > 0) {
      return this.filterByRegionComuna(cached, regionId, comunaName);
    }

    try {
      const response = await fetch('/api/cne/estaciones');
      if (!response.ok) throw new Error(`CNE respondió con estado ${response.status}`);

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const mapped = this.mapCneData(data.data);
        if (mapped.length > 0) {
          this.saveToCache(mapped);
          return this.filterByRegionComuna(mapped, regionId, comunaName);
        }
      }
    } catch (error) {
      console.warn('No fue posible consultar CNE; se usarán los datos locales.', error);
    }

    return this.getLocalStations(regionId, comunaName, fallbackCenter);
  }

  getLocalStations(regionId, comunaName, fallbackCenter) {
    let stations = INITIAL_GAS_STATIONS.filter(station => {
      if (regionId && station.regionId !== regionId) return false;
      if (comunaName && comunaName !== 'Todas' && station.comuna.toLowerCase() !== comunaName.toLowerCase()) return false;
      return true;
    });

    if (comunaName && comunaName !== 'Todas' && stations.length === 0) {
      stations = generateDynamicStationsForComuna(regionId, comunaName, fallbackCenter);
    }

    return stations;
  }

  mapCneData(cneList) {
    return cneList.map((item, index) => {
      const distributor = (item.distribuidor?.nombre || item.razon_social || '').toLowerCase();
      let brand = 'independiente';
      if (distributor.includes('copec')) brand = 'copec';
      else if (distributor.includes('shell')) brand = 'shell';
      else if (distributor.includes('petrobras')) brand = 'petrobras';
      else if (distributor.includes('aramco')) brand = 'aramco';
      else if (distributor.includes('jlc')) brand = 'jlc';

      const prices = {};
      if (item.precios && typeof item.precios === 'object') {
        for (const [key, value] of Object.entries(item.precios)) {
          const price = Number(String(value).replace(/[^0-9-]/g, ''));
          if (!Number.isFinite(price) || price <= 0) continue;
          if (key.includes('93')) prices.gasolina93 = price;
          if (key.includes('95')) prices.gasolina95 = price;
          if (key.includes('97')) prices.gasolina97 = price;
          if (key.includes('diesel') || key.includes('petroleo')) prices.diesel = price;
          if (key.includes('kero') || key.includes('parafina')) prices.kerosene = price;
          if (key.includes('glp')) prices.glp = price;
        }
      }

      const opening = item.apertura_24_horas;
      const isOpen24Hours = opening === 1 || opening === '1' || opening === true ||
        ['si', 'sí', 'true'].includes(String(opening).toLowerCase());

      return {
        id: `cne-${item.id || index}`,
        name: item.nombre || `${BRANDS[brand]?.name || 'Estación'} - ${item.direccion_calle || 'Central'}`,
        brand,
        address: `${item.direccion_calle || 'Dirección'} ${item.direccion_numero || ''}`.trim(),
        comuna: item.nombre_comuna || item.comuna || 'Chile',
        regionId: String(item.id_region || '13'),
        lat: Number.parseFloat(item.latitud || item.lat),
        lng: Number.parseFloat(item.longitud || item.lng),
        prices,
        open24h: isOpen24Hours,
        services: [],
        paymentMethods: [],
        rating: null,
        lastUpdate: 'CNE Oficial'
      };
    }).filter(station =>
      Number.isFinite(station.lat) && Number.isFinite(station.lng) && Object.keys(station.prices).length > 0
    );
  }

  filterByRegionComuna(list, regionId, comunaName) {
    return list.filter(station => {
      if (regionId && station.regionId !== regionId) return false;
      if (comunaName && comunaName !== 'Todas' && station.comuna.toLowerCase() !== comunaName.toLowerCase()) return false;
      return true;
    });
  }

  saveToCache(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
      localStorage.setItem(this.cacheExpiryKey, String(Date.now() + this.cacheDuration));
    } catch (error) {
      console.warn('No se pudo guardar en caché local:', error);
    }
  }

  getFromCache() {
    try {
      const expiry = Number.parseInt(localStorage.getItem(this.cacheExpiryKey), 10);
      if (!Number.isFinite(expiry) || Date.now() >= expiry) return null;
      const raw = localStorage.getItem(this.cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }
}

const cneService = new CneService();
