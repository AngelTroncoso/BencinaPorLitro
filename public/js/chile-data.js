// Datos oficiales de Regiones y Comunas de Chile con coordenadas de centroide aproximadas
const CHILE_REGIONS = [
  {
    id: "15",
    name: "Región de Arica y Parinacota",
    shortName: "Arica y Parinacota",
    center: [-18.4783, -70.3126],
    zoom: 12,
    comunas: ["Arica", "Camarones", "Putre", "General Lagos"]
  },
  {
    id: "01",
    name: "Región de Tarapacá",
    shortName: "Tarapacá",
    center: [-20.2167, -70.1333],
    zoom: 12,
    comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]
  },
  {
    id: "02",
    name: "Región de Antofagasta",
    shortName: "Antofagasta",
    center: [-23.6500, -70.4000],
    zoom: 12,
    comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]
  },
  {
    id: "03",
    name: "Región de Atacama",
    shortName: "Atacama",
    center: [-27.3667, -70.3333],
    zoom: 12,
    comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
  },
  {
    id: "04",
    name: "Región de Coquimbo",
    shortName: "Coquimbo",
    center: [-29.9027, -71.2520],
    zoom: 12,
    comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
  },
  {
    id: "05",
    name: "Región de Valparaíso",
    shortName: "Valparaíso",
    center: [-33.0472, -71.6127],
    zoom: 12,
    comunas: [
      "Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana", "Limache", "Olmué",
      "Quillota", "La Calera", "Hijuelas", "La Cruz", "Nogales",
      "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo",
      "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María",
      "Los Andes", "Calle Larga", "Rinconada", "San Esteban",
      "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Puchuncaví", "Quintero", "Casablanca", "Isla de Pascua", "Juan Fernández"
    ]
  },
  {
    id: "13",
    name: "Región Metropolitana de Santiago",
    shortName: "Metropolitana",
    center: [-33.4489, -70.6693],
    zoom: 12,
    comunas: [
      "Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central",
      "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana",
      "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul",
      "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel",
      "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel",
      "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina",
      "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla",
      "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo",
      "Padre Hurtado", "Peñaflor"
    ]
  },
  {
    id: "06",
    name: "Región del Libertador Gral. Bernardo O'Higgins",
    shortName: "O'Higgins",
    center: [-34.1708, -70.7444],
    zoom: 12,
    comunas: [
      "Rancagua", "Machalí", "Graneros", "Mostazal", "Codegua", "Coinco", "Coltauco", "Doñihue",
      "Las Cabras", "Malloa", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo",
      "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue",
      "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua",
      "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"
    ]
  },
  {
    id: "07",
    name: "Región del Maule",
    shortName: "Maule",
    center: [-35.4264, -71.6554],
    zoom: 12,
    comunas: [
      "Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro",
      "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé",
      "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén",
      "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"
    ]
  },
  {
    id: "16",
    name: "Región de Ñuble",
    shortName: "Ñuble",
    center: [-36.6063, -72.1034],
    zoom: 12,
    comunas: [
      "Chillán", "Chillán Viejo", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "El Carmen",
      "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil",
      "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"
    ]
  },
  {
    id: "08",
    name: "Región del Biobío",
    shortName: "Biobío",
    center: [-36.8270, -73.0503],
    zoom: 12,
    comunas: [
      "Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco",
      "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu",
      "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles",
      "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco",
      "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"
    ]
  },
  {
    id: "09",
    name: "Región de La Araucanía",
    shortName: "Araucanía",
    center: [-38.7359, -72.5904],
    zoom: 12,
    comunas: [
      "Temuco", "Padre Las Casas", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino",
      "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Perquenco", "Pitrufquén",
      "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol",
      "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco",
      "Purén", "Renaico", "Traiguén", "Victoria"
    ]
  },
  {
    id: "14",
    name: "Región de Los Ríos",
    shortName: "Los Ríos",
    center: [-39.8142, -73.2459],
    zoom: 12,
    comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]
  },
  {
    id: "10",
    name: "Región de Los Lagos",
    shortName: "Los Lagos",
    center: [-41.4693, -72.9424],
    zoom: 12,
    comunas: [
      "Puerto Montt", "Puerto Varas", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos",
      "Llanquihue", "Maullín", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue",
      "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay",
      "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén",
      "Futaleufú", "Hualaihué", "Palena"
    ]
  },
  {
    id: "11",
    name: "Región de Aysén",
    shortName: "Aysén",
    center: [-45.5752, -72.0662],
    zoom: 12,
    comunas: ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"]
  },
  {
    id: "12",
    name: "Región de Magallanes y de la Antártica Chilena",
    shortName: "Magallanes",
    center: [-53.1638, -70.9171],
    zoom: 12,
    comunas: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
  }
];

// Tipos de combustible disponibles en Chile
const FUEL_TYPES = [
  { id: "gasolina93", code: "93", name: "Gasolina 93", shortName: "93 Octanos", icon: "fuel", defaultAvg: 1215 },
  { id: "gasolina95", code: "95", name: "Gasolina 95", shortName: "95 Octanos", icon: "fuel", defaultAvg: 1275 },
  { id: "gasolina97", code: "97", name: "Gasolina 97", shortName: "97 Octanos", icon: "fuel", defaultAvg: 1335 },
  { id: "diesel", code: "diesel", name: "Diésel", shortName: "Petróleo Diésel", icon: "truck", defaultAvg: 985 },
  { id: "kerosene", code: "kerosene", name: "Parafina / Kerosene", shortName: "Parafina", icon: "flame", defaultAvg: 1040 },
  { id: "glp", code: "glp", name: "GLP Vehicular", shortName: "Gas Licuado", icon: "wind", defaultAvg: 680 },
  { id: "gnc", code: "gnc", name: "GNC", shortName: "Gas Natural", icon: "activity", defaultAvg: 720 }
];

// Marcas y distribuidores reconocidos en Chile con estilos y logos
const BRANDS = {
  copec: {
    name: "Copec",
    color: "#0055a5",
    bgColor: "#e6f0fa",
    textColor: "#0055a5",
    badge: "Copec Pronto / Punto"
  },
  shell: {
    name: "Shell",
    color: "#ff0000",
    bgColor: "#fff0f0",
    textColor: "#cc0000",
    badge: "Shell Upa! / Select"
  },
  petrobras: {
    name: "Petrobras",
    color: "#008542",
    bgColor: "#eafaf1",
    textColor: "#008542",
    badge: "Petrobras Spacio 1"
  },
  aramco: {
    name: "Aramco",
    color: "#00a3e0",
    bgColor: "#e6f8ff",
    textColor: "#007a99",
    badge: "Aramco a-Stop"
  },
  jlc: {
    name: "JLC",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    textColor: "#b45309",
    badge: "JLC Combustibles"
  },
  independiente: {
    name: "Independiente",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    textColor: "#374151",
    badge: "Estación Independiente"
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHILE_REGIONS, FUEL_TYPES, BRANDS };
}
