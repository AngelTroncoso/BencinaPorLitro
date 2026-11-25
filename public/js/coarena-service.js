// Cliente del asistente Coarena. Las credenciales se mantienen sólo en el servidor.
class CoarenaService {
  constructor() {
    try {
      localStorage.removeItem('bencinas_coarena_api_key');
      localStorage.removeItem('bencinas_coarena_model');
    } catch (error) {
      // El asistente sigue funcionando si el navegador bloquea localStorage.
    }
  }

  async getStatus() {
    try {
      const response = await fetch('/api/coarena/status');
      if (!response.ok) return { configured: false, available: false };
      const status = await response.json();
      return { configured: status.configured === true, available: true };
    } catch (error) {
      return { configured: false, available: false };
    }
  }

  async ask(query, context = {}) {
    try {
      const response = await fetch('/api/coarena/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: No se pudo completar la consulta.`);
      }

      return { success: true, answer: data.answer };
    } catch (error) {
      console.error('Error en CoarenaService:', error);
      return { success: false, error: error.message };
    }
  }
}

const coarenaService = new CoarenaService();
