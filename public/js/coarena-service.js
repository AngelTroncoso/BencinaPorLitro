// Servicio de integración con la API de Coarena (coarena.ai) para búsquedas inteligentes
class CoarenaService {
  constructor() {
    this.storageKey = 'bencinas_coarena_api_key';
    this.modelStorageKey = 'bencinas_coarena_model';
    this.defaultModel = 'ministral-3-3b';
  }

  getApiKey() {
    return localStorage.getItem(this.storageKey) || '';
  }

  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(this.storageKey, key.trim());
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  hasApiKey() {
    const key = this.getApiKey();
    return !!key && key.length > 5;
  }

  getModel() {
    return localStorage.getItem(this.modelStorageKey) || this.defaultModel;
  }

  setModel(model) {
    if (model) {
      localStorage.setItem(this.modelStorageKey, model);
    }
  }

  // Realizar consulta de búsqueda o recomendación inteligente
  async ask(query, context = {}) {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    try {
      const response = await fetch('/api/coarena/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          apiKey: apiKey,
          model: model,
          context: context
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: No se pudo completar la consulta.`);
      }

      return {
        success: true,
        answer: data.answer
      };
    } catch (err) {
      console.error('Error en CoarenaService:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

const coarenaService = new CoarenaService();
