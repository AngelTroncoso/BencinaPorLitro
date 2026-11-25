const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function responseRecorder() {
  const result = {};
  const response = {
    status(code) {
      result.status = code;
      return response;
    },
    json(body) {
      result.body = body;
      return response;
    }
  };
  return { response, result };
}

test('CNE mapper respeta apertura, descarta estaciones sin precio y no inventa tarifas', () => {
  const context = {
    localStorage: { removeItem() {}, getItem() { return null; }, setItem() {} },
    fetch: async () => ({ ok: false }),
    INITIAL_GAS_STATIONS: [],
    generateDynamicStationsForComuna() { return []; },
    BRANDS: {}
  };
  vm.createContext(context);
  const source = fs.readFileSync(require.resolve('../public/js/cne-service.js'), 'utf8');
  vm.runInContext(`${source}\nthis.testCneService = cneService;`, context);

  const stations = context.testCneService.mapCneData([
    { id: 'closed', lat: '-33.4', lng: '-70.6', precios: { '93': '1.190' }, apertura_24_horas: 0 },
    { id: 'open', lat: '-33.5', lng: '-70.7', precios: { '95': 1240 }, apertura_24_horas: '1' },
    { id: 'no-price', lat: '-33.6', lng: '-70.8', precios: {}, apertura_24_horas: 1 },
    { id: 'bad-coordinates', lat: 'invalid', lng: '-70.9', precios: { '93': 1190 }, apertura_24_horas: 0 }
  ]);

  assert.equal(stations.length, 2);
  assert.equal(stations[0].prices.gasolina93, 1190);
  assert.equal(stations[0].open24h, false);
  assert.equal(stations[1].open24h, true);
  assert.deepEqual(Object.keys(stations[0].prices), ['gasolina93']);
});

test('CNE proxy falla de forma segura si falta el token del servidor', () => {
  const savedToken = process.env.CNE_TOKEN;
  delete process.env.CNE_TOKEN;
  try {
    const handler = require('../api/cne/estaciones');
    const { response, result } = responseRecorder();
    handler({ method: 'GET' }, response);
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { error: 'La integración CNE no está configurada en el servidor.' });
  } finally {
    if (savedToken === undefined) delete process.env.CNE_TOKEN;
    else process.env.CNE_TOKEN = savedToken;
  }
});

test('Coarena rechaza solicitudes de otro origen', () => {
  const handler = require('../api/coarena/search');
  const { response, result } = responseRecorder();
  handler({
    method: 'POST',
    headers: { origin: 'https://other.example', host: 'app.example' },
    socket: { remoteAddress: '203.0.113.90' },
    body: { query: 'hola' }
  }, response);
  assert.equal(result.status, 403);
  assert.deepEqual(result.body, { error: 'Origen no permitido.' });
});
