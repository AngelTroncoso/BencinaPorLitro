// Lógica principal de la aplicación Bencinas Chile + Waze

// Estado de la aplicación
const state = {
  regionId: "13", // Región Metropolitana por defecto
  comuna: "Todas",
  fuelType: "gasolina93",
  brand: "all",
  sortBy: "price-asc",
  searchQuery: "",
  tankLitres: 50,
  userLocation: null,
  stations: [],
  filteredStations: [],
  map: null,
  markersLayer: null,
  activePopupId: null,
  mobileView: "list" // 'list' o 'map'
};

// Icono Waze SVG en formato base64 / inline
const WAZE_ICON_SVG = `<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
  <path d="M19.467 10.033c-.2-3.8-3.333-6.8-7.2-6.8-4 0-7.267 3.2-7.267 7.2 0 1.533.467 2.933 1.267 4.133l-1.067 3.2 3.4-.933c1.067.6 2.333.933 3.667.933 4 0 7.267-3.2 7.267-7.2 0-.2-.067-.333-.067-.533zm-9.8 1.467c-.667 0-1.2-.533-1.2-1.2s.533-1.2 1.2-1.2 1.2.533 1.2 1.2-.533 1.2-1.2 1.2zm5.066 0c-.667 0-1.2-.533-1.2-1.2s.533-1.2 1.2-1.2 1.2.533 1.2 1.2-.533 1.2-1.2 1.2zm-5.066 3.6c-1.067 0-2-.533-2.467-1.333l1.2-.667c.267.467.733.8 1.267.8.533 0 1-.333 1.267-.8l1.2.667c-.467.8-1.4 1.333-2.467 1.333z"/>
</svg>`;

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
  initRegionSelector();
  initFuelSelector();
  initBrandFilter();
  initMap();
  setupEventListeners();
  loadStations();
  checkGeolocationPermission();
});

// 1. Inicializar Selectores de Regiones y Comunas
function initRegionSelector() {
  const regionSelect = document.getElementById("region-select");
  regionSelect.innerHTML = CHILE_REGIONS.map(reg => 
    `<option value="${reg.id}" ${reg.id === state.regionId ? "selected" : ""}>
      ${reg.name}
    </option>`
  ).join("");

  regionSelect.addEventListener("change", (e) => {
    state.regionId = e.target.value;
    state.comuna = "Todas";
    updateComunaSelector();
    centerMapOnRegion();
    loadStations();
  });

  updateComunaSelector();
}

function updateComunaSelector() {
  const comunaSelect = document.getElementById("comuna-select");
  const region = CHILE_REGIONS.find(r => r.id === state.regionId);
  
  if (!region) return;

  const options = ['<option value="Todas">Todas las comunas</option>']
    .concat(region.comunas.map(c => 
      `<option value="${c}" ${c === state.comuna ? "selected" : ""}>${c}</option>`
    ));

  comunaSelect.innerHTML = options.join("");
  comunaSelect.onchange = (e) => {
    state.comuna = e.target.value;
    loadStations();
  };
}

// 2. Inicializar Selector de Combustibles
function initFuelSelector() {
  const container = document.getElementById("fuel-type-chips");
  container.innerHTML = FUEL_TYPES.map(fuel => `
    <button 
      type="button" 
      data-fuel="${fuel.id}"
      class="fuel-chip px-3 py-2 text-xs md:text-sm font-semibold rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap ${
        fuel.id === state.fuelType 
          ? "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200" 
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
      }">
      <span>${fuel.name}</span>
    </button>
  `).join("");

  container.querySelectorAll(".fuel-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".fuel-chip").forEach(b => {
        b.className = "fuel-chip px-3 py-2 text-xs md:text-sm font-semibold rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300";
      });
      btn.className = "fuel-chip px-3 py-2 text-xs md:text-sm font-semibold rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200";
      
      state.fuelType = btn.dataset.fuel;
      renderStationListAndMap();
    });
  });
}

// 3. Inicializar Filtro de Marcas
function initBrandFilter() {
  const brandSelect = document.getElementById("brand-filter");
  if (brandSelect) {
    brandSelect.addEventListener("change", (e) => {
      state.brand = e.target.value;
      renderStationListAndMap();
    });
  }

  const sortSelect = document.getElementById("sort-filter");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      renderStationListAndMap();
    });
  }
}

// 4. Inicializar Mapa Leaflet
function initMap() {
  const region = CHILE_REGIONS.find(r => r.id === state.regionId) || CHILE_REGIONS[6];
  
  state.map = L.map("map", {
    zoomControl: false,
    attributionControl: false
  }).setView(region.center, region.zoom);

  // Zoom control en la esquina superior derecha
  L.control.zoom({ position: "topright" }).addTo(state.map);

  // Capa moderna y ligera de OpenStreetMap / CartoDB Voyager
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    subdomains: "abcd"
  }).addTo(state.map);

  state.markersLayer = L.layerGroup().addTo(state.map);
}

function centerMapOnRegion() {
  const region = CHILE_REGIONS.find(r => r.id === state.regionId);
  if (region && state.map) {
    state.map.flyTo(region.center, region.zoom, { duration: 1.2 });
  }
}

// 5. Cargar Estaciones de Servicio
async function loadStations() {
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) loadingIndicator.classList.remove("hidden");

  const region = CHILE_REGIONS.find(r => r.id === state.regionId);
  const stations = await cneService.getStations(state.regionId, state.comuna, region ? region.center : [-33.45, -70.66]);

  state.stations = stations;
  if (loadingIndicator) loadingIndicator.classList.add("hidden");

  renderStationListAndMap();
}

// 6. Filtrar y Ordenar
function getProcessedStations() {
  let list = [...state.stations];

  // Filtro por marca
  if (state.brand !== "all") {
    list = list.filter(s => s.brand === state.brand);
  }

  // Filtro por combustible disponible
  list = list.filter(s => s.prices && s.prices[state.fuelType] !== undefined && s.prices[state.fuelType] > 0);

  // Filtro por búsqueda de texto
  if (state.searchQuery.trim().length > 0) {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.address.toLowerCase().includes(q) || 
      s.comuna.toLowerCase().includes(q)
    );
  }

  // Calcular distancias si tenemos ubicación de usuario
  if (state.userLocation) {
    list.forEach(s => {
      s.distance = calculateDistance(state.userLocation.lat, state.userLocation.lng, s.lat, s.lng);
    });
  }

  // Ordenar
  if (state.sortBy === "price-asc") {
    list.sort((a, b) => (a.prices[state.fuelType] || 9999) - (b.prices[state.fuelType] || 9999));
  } else if (state.sortBy === "price-desc") {
    list.sort((a, b) => (b.prices[state.fuelType] || 0) - (a.prices[state.fuelType] || 0));
  } else if (state.sortBy === "distance" && state.userLocation) {
    list.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
  } else if (state.sortBy === "rating") {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return list;
}

// 7. Renderizar Lista y Marcadores en el Mapa
function renderStationListAndMap() {
  const stations = getProcessedStations();
  state.filteredStations = stations;

  renderStatsBar(stations);
  renderList(stations);
  renderMapMarkers(stations);
}

// 8. Barra de Estadísticas y Ahorro
function renderStatsBar(stations) {
  const statsContainer = document.getElementById("stats-summary-bar");
  if (!statsContainer) return;

  const prices = stations.map(s => s.prices[state.fuelType]).filter(p => p !== undefined && p > 0);
  if (prices.length === 0) {
    statsContainer.classList.add("hidden");
    return;
  }
  statsContainer.classList.remove("hidden");

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const potentialSavingsPerTank = (maxPrice - minPrice) * state.tankLitres;

  document.getElementById("stat-min-price").textContent = `$${minPrice.toLocaleString('es-CL')}`;
  document.getElementById("stat-avg-price").textContent = `$${avgPrice.toLocaleString('es-CL')}`;
  document.getElementById("stat-savings-amount").textContent = `$${potentialSavingsPerTank.toLocaleString('es-CL')}`;
  document.getElementById("stat-fuel-label").textContent = FUEL_TYPES.find(f => f.id === state.fuelType)?.name || "";
}

// 9. Renderizar Cards en la Lista
function renderList(stations) {
  const listContainer = document.getElementById("stations-list");
  const countBadge = document.getElementById("stations-count-badge");
  
  if (countBadge) {
    countBadge.textContent = `${stations.length} encontradas`;
  }

  if (stations.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
        <div class="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h4 class="text-base font-bold text-slate-800 mb-1">No se encontraron bencineras</h4>
        <p class="text-sm text-slate-500 max-w-sm mx-auto">
          Prueba cambiando el tipo de combustible o seleccionando "Todas las comunas".
        </p>
      </div>
    `;
    return;
  }

  const prices = stations.map(s => s.prices[state.fuelType]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  listContainer.innerHTML = stations.map((st, index) => {
    const price = st.prices[state.fuelType];
    const isCheapest = price === minPrice;
    const isExpensive = price === maxPrice && maxPrice > minPrice;
    const brandInfo = BRANDS[st.brand] || BRANDS.independiente;
    
    // Links de navegación
    const wazeUrl = `https://waze.com/ul?ll=${st.lat},${st.lng}&navigate=yes`;
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}`;

    // Ahorro respecto a la más cara de la lista
    const savingPerLitre = maxPrice - price;
    const totalSaving = savingPerLitre * state.tankLitres;

    return `
      <div 
        id="card-${st.id}"
        class="station-card bg-white rounded-2xl p-4 md:p-5 relative cursor-pointer ${isCheapest ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20' : ''}"
        onclick="highlightStation('${st.id}')">
        
        <!-- Header de la Card -->
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="flex items-center gap-2.5">
            <span class="brand-avatar" style="background-color: ${brandInfo.bgColor}; color: ${brandInfo.textColor};">
              ${brandInfo.name.substring(0, 2).toUpperCase()}
            </span>
            <div>
              <h3 class="font-bold text-slate-900 text-sm md:text-base leading-tight">
                ${st.name}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                ${st.address}, ${st.comuna}
              </p>
            </div>
          </div>

          <!-- Precio destacado -->
          <div class="text-right flex-shrink-0">
            <div class="text-xl md:text-2xl font-black ${isCheapest ? 'text-emerald-600' : 'text-slate-900'}">
              $${price?.toLocaleString('es-CL')}
            </div>
            <span class="text-[10px] text-slate-400 font-medium block">por litro</span>
          </div>
        </div>

        <!-- Badges y Distancia -->
        <div class="flex flex-wrap items-center gap-2 mb-3.5 mt-2">
          ${isCheapest ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse">
              ⭐ ¡LA MÁS BARATA!
            </span>
          ` : ''}

          ${isExpensive && !isCheapest ? `
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700">
              Más costosa de la zona
            </span>
          ` : ''}

          ${st.distance !== undefined ? `
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              📍 a ${st.distance.toFixed(1)} km
            </span>
          ` : ''}

          ${isCheapest && totalSaving > 0 ? `
            <span class="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Ahorras $${totalSaving.toLocaleString('es-CL')} en ${state.tankLitres}L
            </span>
          ` : ''}
          
          <span class="text-[11px] text-slate-400 ml-auto">
            Act. ${st.lastUpdate}
          </span>
        </div>

        <!-- Resumen de otros precios disponibles -->
        <div class="grid grid-cols-4 gap-1.5 py-2 px-2.5 bg-slate-50 rounded-xl mb-3 text-center text-xs">
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">93</span>
            <span class="font-bold text-slate-700">$${st.prices.gasolina93 || '-'}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">95</span>
            <span class="font-bold text-slate-700">$${st.prices.gasolina95 || '-'}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">97</span>
            <span class="font-bold text-slate-700">$${st.prices.gasolina97 || '-'}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">Diésel</span>
            <span class="font-bold text-slate-700">$${st.prices.diesel || '-'}</span>
          </div>
        </div>

        <!-- Botones de Acción (Waze en primer plano) -->
        <div class="flex items-center gap-2 pt-1 border-t border-slate-100">
          <!-- Botón WAZE -->
          <a 
            href="${wazeUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn-waze flex-1 text-xs md:text-sm py-2.5"
            title="Abrir ruta en Waze">
            ${WAZE_ICON_SVG}
            <span>Ir con Waze</span>
          </a>

          <!-- Botón Google Maps -->
          <a 
            href="${gmapsUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors"
            title="Abrir en Google Maps">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </a>

          <!-- Botón Compartir por WhatsApp -->
          <button 
            type="button" 
            onclick="shareStation('${st.name}', '${st.address}', ${price}, '${wazeUrl}')"
            class="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors"
            title="Compartir por WhatsApp">
            <svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
          </button>
        </div>

      </div>
    `;
  }).join("");
}

// 10. Renderizar Marcadores de Precio en Leaflet
function renderMapMarkers(stations) {
  if (!state.map || !state.markersLayer) return;

  state.markersLayer.clearLayers();

  if (stations.length === 0) return;

  const prices = stations.map(s => s.prices[state.fuelType]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const bounds = [];

  stations.forEach(st => {
    const price = st.prices[state.fuelType];
    const isCheapest = price === minPrice;
    const isExpensive = price === maxPrice && maxPrice > minPrice;
    const brandInfo = BRANDS[st.brand] || BRANDS.independiente;

    const wazeUrl = `https://waze.com/ul?ll=${st.lat},${st.lng}&navigate=yes`;
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}`;

    // Custom HTML Pin con precio directo en el mapa
    const customPinHtml = `
      <div class="price-marker-pin ${isCheapest ? 'is-cheapest' : ''} ${isExpensive ? 'is-expensive' : ''}">
        <span class="price-marker-brand-dot" style="background-color: ${brandInfo.color};"></span>
        <span>$${price?.toLocaleString('es-CL')}</span>
      </div>
    `;

    const icon = L.divIcon({
      html: customPinHtml,
      className: 'custom-leaflet-marker',
      iconSize: [85, 30],
      iconAnchor: [42, 15],
      popupAnchor: [0, -18]
    });

    const marker = L.marker([st.lat, st.lng], { icon: icon });

    // Popup detallado
    const popupContent = `
      <div class="p-3.5 min-w-[240px]">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold" style="background-color: ${brandInfo.bgColor}; color: ${brandInfo.textColor};">
            ${brandInfo.name}
          </span>
          ${isCheapest ? '<span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">¡Más barata!</span>' : ''}
        </div>
        <h4 class="font-bold text-slate-900 text-sm leading-snug mb-1">${st.name}</h4>
        <p class="text-xs text-slate-500 mb-2">${st.address}, ${st.comuna}</p>
        
        <div class="bg-slate-50 p-2.5 rounded-xl mb-3 flex items-center justify-between">
          <span class="text-xs text-slate-500">${FUEL_TYPES.find(f => f.id === state.fuelType)?.name}:</span>
          <span class="text-lg font-black ${isCheapest ? 'text-emerald-600' : 'text-slate-900'}">
            $${price?.toLocaleString('es-CL')}/L
          </span>
        </div>

        <a 
          href="${wazeUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="btn-waze w-full text-xs py-2 mb-1.5">
          ${WAZE_ICON_SVG}
          <span>Abrir en Waze</span>
        </a>

        <a 
          href="${gmapsUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="w-full text-center block text-xs font-semibold text-slate-600 hover:text-slate-900 py-1">
          Ver en Google Maps
        </a>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on('click', () => {
      highlightCard(st.id);
    });

    state.markersLayer.addLayer(marker);
    bounds.push([st.lat, st.lng]);
  });

  // Ajustar vista del mapa si hay estaciones
  if (bounds.length > 0 && !state.activePopupId) {
    state.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }
}

// 11. Resaltar estación al hacer click
function highlightStation(stationId) {
  const st = state.stations.find(s => s.id === stationId);
  if (!st || !state.map) return;

  state.activePopupId = stationId;
  state.map.flyTo([st.lat, st.lng], 15, { duration: 0.8 });

  // Abrir popup en el mapa
  state.markersLayer.eachLayer(layer => {
    const latlng = layer.getLatLng();
    if (Math.abs(latlng.lat - st.lat) < 0.0001 && Math.abs(latlng.lng - st.lng) < 0.0001) {
      layer.openPopup();
    }
  });

  highlightCard(stationId);

  // Si estamos en móvil y hace clic, cambiamos a ver el mapa si lo desea
  if (window.innerWidth < 1024 && state.mobileView === "list") {
    // Mantener la card visible
  }
}

function highlightCard(stationId) {
  document.querySelectorAll(".station-card").forEach(c => {
    c.classList.remove("selected", "border-sky-500", "shadow-lg");
  });

  const card = document.getElementById(`card-${stationId}`);
  if (card) {
    card.classList.add("selected", "border-sky-500", "shadow-lg");
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// 12. Compartir por WhatsApp
function shareStation(name, address, price, wazeUrl) {
  const fuelName = FUEL_TYPES.find(f => f.id === state.fuelType)?.name || "Combustible";
  const text = `🚗⛽ ¡Dato de bencina barata en Chile!\n\n📍 ${name}\nDirección: ${address}\n💰 ${fuelName}: $${price.toLocaleString('es-CL')} / Litro\n\n🗺️ Cómo llegar con Waze:\n${wazeUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, '_blank');
}

// 13. Cálculo de Distancia (Fórmula de Haversine en km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 14. Geolocalización del Usuario
function checkGeolocationPermission() {
  const geoBtn = document.getElementById("btn-near-me");
  if (geoBtn) {
    geoBtn.addEventListener("click", requestUserLocation);
  }
}

function requestUserLocation() {
  const geoBtn = document.getElementById("btn-near-me");
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  if (geoBtn) {
    geoBtn.disabled = true;
    geoBtn.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Localizando...</span>
    `;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Agregar marcador de usuario en el mapa
      if (state.map) {
        const userIcon = L.divIcon({
          html: `<div class="w-4 h-4 bg-sky-500 rounded-full border-2 border-white shadow-lg ring-4 ring-sky-300 animate-pulse"></div>`,
          className: 'user-location-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker([state.userLocation.lat, state.userLocation.lng], { icon: userIcon })
          .addTo(state.map)
          .bindPopup("<b>Tu ubicación actual</b>");

        state.map.flyTo([state.userLocation.lat, state.userLocation.lng], 14);
      }

      // Cambiar ordenamiento automático a menor distancia
      state.sortBy = "distance";
      const sortSelect = document.getElementById("sort-filter");
      if (sortSelect) sortSelect.value = "distance";

      if (geoBtn) {
        geoBtn.disabled = false;
        geoBtn.innerHTML = `
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span>Ubicación detectada</span>
        `;
      }

      renderStationListAndMap();
    },
    (err) => {
      console.warn("Error de geolocalización:", err);
      alert("No se pudo acceder a tu ubicación. Por favor selecciona tu región y comuna manualmente.");
      if (geoBtn) {
        geoBtn.disabled = false;
        geoBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8 8 0 0016 0z"/>
          </svg>
          <span>Cerca de mí</span>
        `;
      }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// 15. Listeners de eventos generales y modales
function setupEventListeners() {
  // Buscador de texto
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderStationListAndMap();
    });
  }

  // Selector de capacidad de estanque (para la calculadora de ahorro)
  const tankSelect = document.getElementById("tank-capacity-select");
  if (tankSelect) {
    tankSelect.addEventListener("change", (e) => {
      state.tankLitres = parseInt(e.target.value, 10);
      renderStatsBar(state.filteredStations);
      renderList(state.filteredStations);
    });
  }

  // Mobile View Toggles (Mapa vs Lista)
  const toggleMapBtn = document.getElementById("mobile-toggle-map");
  const toggleListBtn = document.getElementById("mobile-toggle-list");
  const mainAppContainer = document.getElementById("app-main-layout");

  if (toggleMapBtn && toggleListBtn && mainAppContainer) {
    toggleMapBtn.addEventListener("click", () => {
      state.mobileView = "map";
      mainAppContainer.classList.remove("mobile-view-list");
      mainAppContainer.classList.add("mobile-view-map");
      toggleMapBtn.classList.add("bg-sky-600", "text-white");
      toggleMapBtn.classList.remove("bg-white", "text-slate-700");
      toggleListBtn.classList.remove("bg-sky-600", "text-white");
      toggleListBtn.classList.add("bg-white", "text-slate-700");
      setTimeout(() => state.map && state.map.invalidateSize(), 200);
    });

    toggleListBtn.addEventListener("click", () => {
      state.mobileView = "list";
      mainAppContainer.classList.remove("mobile-view-map");
      mainAppContainer.classList.add("mobile-view-list");
      toggleListBtn.classList.add("bg-sky-600", "text-white");
      toggleListBtn.classList.remove("bg-white", "text-slate-700");
      toggleMapBtn.classList.remove("bg-sky-600", "text-white");
      toggleMapBtn.classList.add("bg-white", "text-slate-700");
    });
  }

  // Modal de Configuración General (Coarena & CNE)
  const openSettingsBtn = document.getElementById("btn-open-settings");
  const closeSettingsBtn = document.getElementById("btn-close-settings");
  const settingsModal = document.getElementById("settings-modal");
  const coarenaBadge = document.getElementById("coarena-status-badge");
  const cneBadge = document.getElementById("cne-status-badge");
  const refreshStatusBtn = document.getElementById("btn-refresh-api-status");

  async function updateConnectionBadges() {
    const [coarenaStatus, cneStatus] = await Promise.all([
      coarenaService.getStatus(),
      cneService.getStatus()
    ]);

    if (coarenaBadge) {
      coarenaBadge.textContent = !coarenaStatus.available ? "No disponible" : coarenaStatus.configured ? "Configurada ✓" : "Requiere servidor";
      coarenaBadge.className = coarenaStatus.configured
        ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
        : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600";
    }

    if (cneBadge) {
      cneBadge.textContent = !cneStatus.available ? "No disponible" : cneStatus.configured ? "Configurada ✓" : "Datos locales";
      cneBadge.className = cneStatus.configured
        ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
        : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600";
    }
  }

  if (openSettingsBtn && settingsModal) {
    openSettingsBtn.addEventListener("click", () => {
      settingsModal.classList.remove("hidden");
      updateConnectionBadges();
    });
  }

  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsModal.classList.add("hidden");
    });
  }

  if (refreshStatusBtn) {
    refreshStatusBtn.addEventListener("click", updateConnectionBadges);
  }

  // Asistente Coarena AI
  const openCoarenaBtn = document.getElementById("btn-open-coarena");
  const closeCoarenaBtn = document.getElementById("btn-close-coarena");
  const coarenaModal = document.getElementById("coarena-modal");
  const coarenaForm = document.getElementById("coarena-form");
  const coarenaQueryInput = document.getElementById("coarena-query-input");
  const coarenaHistory = document.getElementById("coarena-chat-history");
  const coarenaSubmitBtn = document.getElementById("coarena-submit-btn");

  if (openCoarenaBtn && coarenaModal) {
    openCoarenaBtn.addEventListener("click", () => {
      coarenaModal.classList.remove("hidden");
      if (coarenaQueryInput) coarenaQueryInput.focus();
    });
  }

  if (closeCoarenaBtn && coarenaModal) {
    closeCoarenaBtn.addEventListener("click", () => {
      coarenaModal.classList.add("hidden");
    });
  }

  // Quick chips de consulta
  document.querySelectorAll(".coarena-prompt-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const promptText = chip.textContent.trim().replace(/^[⛽💰🏪📈🧭]\s*/, '').trim();
      if (coarenaQueryInput) {
        coarenaQueryInput.value = promptText;
        handleCoarenaSubmit(promptText);
      }
    });
  });

  if (coarenaForm) {
    coarenaForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = coarenaQueryInput?.value?.trim();
      if (!query) return;
      handleCoarenaSubmit(query);
    });
  }

  async function handleCoarenaSubmit(query) {
    if (!coarenaHistory) return;

    // Verificar la configuración del servidor; las claves nunca se guardan en el navegador.
    const apiStatus = await coarenaService.getStatus();
    if (!apiStatus.configured) {
      renderUserMessage(query);
      const message = apiStatus.available
        ? `⚠️ <strong>Asistente no configurado</strong><br><br>Define <code>APIKEY_COARENA</code> en las variables de entorno del servidor y vuelve a intentarlo. Por seguridad, la clave no se introduce ni se guarda en el navegador. Puedes obtenerla en <a href="https://coarena.ai/account/api" target="_blank" rel="noopener noreferrer" class="text-violet-700 underline font-semibold">coarena.ai/account/api ↗</a>.`
        : `⚠️ <strong>API no disponible</strong><br><br>El asistente necesita que la aplicación se ejecute en el servidor Node o en Vercel. La vista abierta como archivo local no puede acceder a esta función.`;
      renderBotMessage(message);
      if (coarenaQueryInput) coarenaQueryInput.value = '';
      return;
    }

    renderUserMessage(query);
    if (coarenaQueryInput) coarenaQueryInput.value = '';

    const loadingId = 'loading-' + Date.now();
    renderLoadingIndicator(loadingId);

    // Preparar contexto de la selección actual
    const currentRegion = CHILE_REGIONS.find(r => r.id === state.regionId)?.name || 'Chile';
    const currentFuel = FUEL_TYPES.find(f => f.id === state.fuelType)?.name || 'Gasolina';
    const context = {
      region: currentRegion,
      comuna: state.comuna,
      fuelName: currentFuel,
      stations: state.filteredStations
    };

    if (coarenaSubmitBtn) coarenaSubmitBtn.disabled = true;

    const result = await coarenaService.ask(query, context);

    removeElement(loadingId);
    if (coarenaSubmitBtn) coarenaSubmitBtn.disabled = false;

    if (result.success) {
      renderBotMessage(formatCoarenaResponse(result.answer));
    } else {
      renderBotMessage(`❌ <strong>Error al consultar Coarena:</strong> ${result.error || 'No se pudo obtener respuesta'}. Revisa que tu clave API sea válida.`);
    }
  }

  function renderUserMessage(text) {
    const div = document.createElement("div");
    div.className = "flex justify-end";
    div.innerHTML = `
      <div class="bg-violet-600 text-white text-xs font-medium rounded-2xl rounded-tr-sm py-2.5 px-4 max-w-[85%] shadow-sm">
        ${escapeHtml(text)}
      </div>
    `;
    coarenaHistory.appendChild(div);
    coarenaHistory.scrollTop = coarenaHistory.scrollHeight;
  }

  function renderBotMessage(htmlContent) {
    const div = document.createElement("div");
    div.className = "flex justify-start";
    div.innerHTML = `
      <div class="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-2xl rounded-tl-sm p-4 max-w-[90%] shadow-sm space-y-2 leading-relaxed">
        ${htmlContent}
      </div>
    `;
    coarenaHistory.appendChild(div);
    coarenaHistory.scrollTop = coarenaHistory.scrollHeight;
  }

  function renderLoadingIndicator(id) {
    const div = document.createElement("div");
    div.id = id;
    div.className = "flex justify-start";
    div.innerHTML = `
      <div class="bg-slate-50 border border-slate-200 text-slate-500 text-xs rounded-2xl py-2.5 px-4 flex items-center gap-2">
        <svg class="animate-spin h-3.5 w-3.5 text-violet-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Consultando modelo en Coarena AI...</span>
      </div>
    `;
    coarenaHistory.appendChild(div);
    coarenaHistory.scrollTop = coarenaHistory.scrollHeight;
  }

  function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Formateador de texto y enlaces Waze
  function formatCoarenaResponse(rawText) {
    if (!rawText) return '';
    
    let formatted = rawText
      // Convertir negrita **texto** a <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
      // Convertir listas con asterisco o guión
      .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // Convertir saltos de línea
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    // Convertir enlaces de Waze en botones interactivos con el icono oficial
    formatted = formatted.replace(
      /https:\/\/waze\.com\/ul\?ll=([-\d.]+),([-\d.]+)&navigate=yes/g,
      `<a href="https://waze.com/ul?ll=$1,$2&navigate=yes" target="_blank" rel="noopener noreferrer" class="btn-waze inline-flex text-xs py-1.5 px-3 my-1">
        ${WAZE_ICON_SVG}
        <span>Ir con Waze</span>
       </a>`
    );

    return formatted;
  }
}
