# BencinaChile — compara precios y encuentra tu ruta

Aplicación web responsive para explorar estaciones de servicio por región y comuna en Chile, comparar precios referenciales y abrir una ruta en Waze o Google Maps. Incluye filtros por combustible y marca, mapa, geolocalización y estimación de ahorro por estanque.

> **Importante sobre los datos:** si la API CNE no está configurada o no responde, la aplicación utiliza un conjunto local y genera estaciones de ejemplo para algunas comunas. Esos datos son referenciales y no deben interpretarse como precios actuales confirmados. La conexión CNE se indica en el panel de configuración.

## Funciones

- Filtros por región, comuna, combustible, marca y texto.
- Lista de estaciones con precios y accesos a Waze, Google Maps y WhatsApp.
- Mapa Leaflet, localización cercana y estimación de ahorro según el tamaño del estanque.
- Integración opcional con la API CNE. Los horarios se muestran como abiertos 24 horas sólo cuando la respuesta de CNE lo indica.
- Asistente Coarena opcional que recibe la consulta y un resumen de las estaciones visibles. **No realiza búsquedas web ni ofrece proyecciones verificadas**; puede equivocarse y no reemplaza la fuente oficial.
- Interfaz responsive con un logotipo vectorial propio y una ilustración original de cabecera.

## Requisitos y ejecución local

Se requiere Node.js. El servidor usa módulos nativos de Node, por lo que no hace falta instalar dependencias de servidor.

```bash
npm start
```

Abre `http://localhost:3000`. Para activar APIs opcionales, configura las claves en el entorno del proceso antes de iniciar el servidor:

```bash
CNE_TOKEN="tu-token-cne" APIKEY_COARENA="tu-clave-coarena" npm start
```

En PowerShell:

```powershell
$env:CNE_TOKEN = "tu-token-cne"
$env:APIKEY_COARENA = "tu-clave-coarena"
npm start
```

No incluyas claves en el repositorio, en el frontend ni en capturas. En Vercel, crea las variables `CNE_TOKEN` y/o `APIKEY_COARENA` en **Settings → Environment Variables** y vuelve a desplegar. El panel de configuración de la aplicación sólo muestra si las integraciones están configuradas; no pide ni guarda secretos en el navegador.

Si se abre `public/index.html` directamente como archivo, la interfaz puede mostrar datos locales, pero las rutas de API requieren ejecutar el servidor o desplegar en Vercel.

## Estructura

```text
api/
├── cne/
│   ├── estaciones.js       # Proxy serverless a CNE; lee CNE_TOKEN del entorno
│   └── status.js           # Indica si CNE está configurada, sin revelar el token
├── coarena/
│   ├── search.js           # Asistente IA con límites básicos por instancia
│   └── status.js           # Indica si Coarena está configurado
└── status.js
public/
├── css/style.css
├── img/
│   ├── bencina-logo.svg
│   └── hero-fuel-chile.webp
├── js/
│   ├── app.js
│   ├── chile-data.js
│   ├── cne-service.js
│   ├── coarena-service.js
│   └── gas-stations.js
└── index.html
server.js                  # Servidor HTTP nativo para ejecución local
vercel.json                # Rewrites de funciones serverless
```

## Notas de seguridad y operación

Los tokens de CNE y Coarena se leen únicamente desde variables de entorno del servidor. El navegador no los guarda ni los envía. El endpoint Coarena sólo acepta solicitudes de origen coincidente cuando el navegador envía la cabecera `Origin`, limita la longitud de consulta y aplica un máximo básico de 20 solicitudes por minuto y dirección IP **por instancia activa**. En despliegues serverless, ese límite no es global ni sustituye un WAF o un servicio de rate limiting externo.
