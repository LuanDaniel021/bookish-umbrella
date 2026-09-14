const API_URL = (window.API_URL || '/api').replace(/\/$/, '');

async function request(endpoint, options = {}) {

  console.log(`Requesting ${options.method || 'GET'} ${API_URL}${endpoint} with options:`, options);
  const { body, headers = {}, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...requestOptions,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const responseData = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = responseData?.message || response.statusText || 'Erro na requisicao';
    throw new Error(message);
  }

  return responseData;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export { request };

export function bindForms() {
  document.querySelectorAll('form[data-api-endpoint]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const originalLabel = submitButton?.textContent;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
      }

      try {
        const formData = new FormData(form);
        const body = form.dataset.apiFormat === 'json'
          ? Object.fromEntries(formData.entries())
          : formData;

        if (form.dataset.apiFormat === 'json') {
          delete body.confirma_senha;
          delete body.perfil;
          delete body.remember;
        }

        const responseData = await api.post(form.dataset.apiEndpoint, body);
        const token = responseData?.token || responseData?.access_token || responseData?.jwt;
        const resultElement = form.querySelector('.api-result');

        if (token && form.dataset.apiEndpoint === '/users/login') {
          localStorage.setItem('access_token', token);
        }

        if (resultElement) {
          resultElement.hidden = false;
          resultElement.textContent = token
            ? `Login realizado.\n\nToken:\n${token}`
            : JSON.stringify(responseData, null, 2);
        } else {
          alert(form.dataset.apiSuccess || 'Operacao realizada com sucesso.');
        }

        form.reset();
      } catch (error) {
        alert(error.message || 'Nao foi possivel concluir a operacao.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  });
}

bindForms();