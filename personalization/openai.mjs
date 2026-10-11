import { FlowError, requireRule } from './contracts.mjs';

/** Server-only single-call transport. It never reads keys from files, logs prompts, or retries. */
export function createOpenAIClient({ apiKey, fetchImpl = globalThis.fetch, timeoutMs = 45000 }) {
  requireRule(typeof apiKey === 'string' && apiKey.trim().length > 0, 'api_key_required');
  requireRule(Number.isInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60000, 'invalid_timeout');
  return {
    async generate(body) {
      let response;
      let data;
      try {
        response = await fetchImpl('https://api.openai.com/v1/responses', {
          method: 'POST', redirect: 'error',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs)
        });
        if (!response.ok) throw new FlowError(response.status === 429 ? 'rate_limited' : 'upstream_error');
        data = await response.json();
      } catch (error) {
        if (error instanceof FlowError) throw error;
        throw new FlowError(error.name === 'TimeoutError' || error.name === 'AbortError' ? 'request_timeout' : 'network_or_response_error');
      }
      requireRule(data && Array.isArray(data.output), 'invalid_api_response');
      const parts = data.output.filter(item => item.type === 'message' && item.role === 'assistant').flatMap(item => item.content || []);
      requireRule(!parts.some(part => part.type === 'refusal'), 'model_refusal');
      requireRule(data.status === 'completed', data.status === 'incomplete' ? 'incomplete_output' : 'upstream_error');
      const texts = parts.filter(part => part.type === 'output_text');
      requireRule(texts.length === 1 && typeof texts[0].text === 'string' && texts[0].text.length <= 30000, 'invalid_api_response');
      let batch;
      try { batch = JSON.parse(texts[0].text); } catch { throw new FlowError('invalid_output_json'); }
      // Operational metadata only. Never include raw response, key, input or personal notes.
      const integer = value => Number.isInteger(value) && value >= 0 ? value : null;
      return { batch, metadata: {
        responseId: typeof data.id === 'string' ? data.id : null,
        model: typeof data.model === 'string' ? data.model : body.model,
        inputTokens: integer(data.usage?.input_tokens), outputTokens: integer(data.usage?.output_tokens)
      } };
    }
  };
}
