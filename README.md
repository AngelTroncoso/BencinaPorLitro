# 🇨🇱 Bencinas Más Baratas de Chile + Conexión Waze 🚗💨

Aplicación web moderna y responsiva desarrollada para encontrar en tiempo real las estaciones de servicio (bencineras) con los precios más económicos en Chile, filtrando por **todas las regiones y comunas del país**, y con **navegación directa en 1 clic hacia Waze**.

---

## 🚀 Características Principales

1. **Filtros Geográficos de Chile:**
   - Selector dinámico de las **16 Regiones de Chile** (desde Arica y Parinacota hasta Magallanes).
   - Selector reactivo de **Comunas** según la región seleccionada.
   - Búsqueda por texto (nombre de calle, bencinera, etc.).

2. **Navegación Directa con Waze:**
   - Botón destacado **"Ir con Waze"** en cada bencinera y en los marcadores del mapa.
   - Utiliza el protocolo oficial de deep-linking de Waze:
     ```
     https://waze.com/ul?ll={lat},{lng}&navigate=yes
     ```
     *(Abre la app de Waze en dispositivos móviles o el Waze Live Map en navegador de escritorio)*.
   - Acceso alternativo a **Google Maps** y opción de **compartir el dato por WhatsApp**.

3. **Selector de Combustibles:**
   - Gasolina 93 Octanos
   - Gasolina 95 Octanos
   - Gasolina 97 Octanos
   - Petróleo Diésel
   - Kerosene / Parafina
   - GLP Vehicular

4. **Mapa Interactivo con Precios Directos (Leaflet):**
   - Pines con chips de precios integrados para identificar visualmente en el mapa cuál es la más barata (verde con pulso), promedio o cara (rojo).
   - Logos e insignias de marcas: **Copec**, **Shell**, **Petrobras**, **Aramco**, **JLC** e **Independientes**.

5. **Calculadora de Ahorro por Estanque:**
   - Selección de capacidad de estanque (40L, 50L, 60L, 70L).
   - Muestra cuánto dinero en pesos chilenos ($CLP) te ahorras cargando en la más barata frente al precio más alto o promedio de la zona.

6. **Geolocalización "Cerca de mí":**
   - Detección GPS del dispositivo con cálculo de distancia real en kilómetros (Haversine formula).

7. **Integración con API CNE (Comisión Nacional de Energía):**
   - Modal de configuración para conectar un token oficial de `api.cne.cl`.
   - Incluye fallback automático a base de datos realista y generador procedural para todas las 346 comunas de Chile.

---

## 🛠️ Instalación y Ejecución

### Opción 1: Ejecutar con Node.js (Servidor Express con Proxy CNE)

1. Abre tu terminal en la carpeta del proyecto:
   ```bash
   cd c:\Users\angel\OneDrive\Escritorio\litro
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor:
   ```bash
   npm start
   ```

4. Abre tu navegador en:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

### Opción 2: Abrir directamente sin servidor

Simplemente haz doble clic en el archivo `public/index.html` para abrirlo en cualquier navegador (Google Chrome, Edge, Safari, Firefox, etc.).

---

## 📂 Estructura del Proyecto

```
litro/
├── package.json               # Configuración del proyecto y dependencias
├── server.js                  # Servidor Express y proxy para evitar CORS con API CNE
├── README.md                  # Documentación
└── public/
    ├── index.html             # Interfaz web principal responsiva
    ├── css/
    │   └── style.css          # Estilos personalizados, temas, Waze y pins de mapa
    └── js/
        ├── chile-data.js      # Datos de las 16 regiones, comunas y coordenadas
        ├── gas-stations.js    # Base de datos de estaciones, precios y generador
        ├── cne-service.js     # Cliente API CNE con caché local en localStorage
        └── app.js             # Lógica reactiva, Leaflet, Waze, GPS y calculadora
```

---

## 📱 Vista Móvil y Escritorio
- **Escritorio:** Pantalla dividida con lista interactiva a la izquierda y mapa interactivo a la derecha.
- **Móvil:** Barra inferior flotante para alternar fluidamente entre **[Lista]** y **[Ver Mapa]**.
