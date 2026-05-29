import { request } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

export class BaseAPI {
  constructor({ logger = console } = {}) {
    this.baseURL = process.env.BASE_URL;

    this.token = null;
    this.requestContext = null;

    this.defaultTimeout = 30000;
    this.retryCount = 2;

    this.enableLogging = true;
    this.logger = logger;

    // global correlation id (optional)
    this.globalRequestId = null;
  }

  // -----------------------------
  // INIT – accepts an initial token
  // -----------------------------
  async init(initialToken = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (initialToken) {
      headers['Authorization'] = `Bearer ${initialToken}`;
      this.token = initialToken;
    }
    this.requestContext = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: headers,
      ignoreHTTPSErrors: true,
      timeout: this.defaultTimeout,
    });
  }

  ensureInit() {
    if (!this.requestContext) {
      throw new Error("❌ BaseAPI not initialized. Call init() first.");
    }
  }

  // -----------------------------
  // AUTH
  // -----------------------------
  setToken(token) {
    this.token = token;
  }

  // allow per-request token override
  getHeaders(customHeaders = {}, overrideToken = null, requestId = null) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',

      ...(overrideToken || this.token
        ? { Authorization: `Bearer ${overrideToken || this.token}` }
        : {}),

      // traceability header
      ...(requestId ? { 'X-Request-ID': requestId } : {}),
      ...(this.globalRequestId ? { 'X-Correlation-ID': this.globalRequestId } : {}),

      ...customHeaders
    };
  }

  // -----------------------------
  // RETRY WITH BACKOFF
  // -----------------------------
  async withRetry(fn, context = '', meta = {}) {
    let lastError;

    for (let i = 0; i <= this.retryCount; i++) {
      try {
        return await fn(i);
      } catch (err) {
        lastError = err;

        // ❗ DO NOT retry client errors (4xx)
        if (err?.status >= 400 && err?.status < 500) {
          throw err;
        }

        const delay = Math.min(2000, Math.pow(2, i) * 200);

        if (this.enableLogging) {
          this.logger.warn({
            type: 'API_RETRY',
            attempt: i + 1,
            context,
            delay,
            error: err.message,
            ...meta
          });
        }

        await new Promise(res => setTimeout(res, delay));
      }
    }

    throw lastError;
  }

  // -----------------------------
  // RESPONSE PARSER
  // -----------------------------
  async parseResponse(res) {
    try {
      const text = await res.text();

      if (!text) return null;

      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return null;
    }
  }

  // -----------------------------
  // CORE REQUEST HANDLER
  // -----------------------------
  async request(method, url, options = {}) {
    this.ensureInit();

    //request-level correlation id
    const requestId =
      options.requestId ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`);

    const startTime = Date.now();

    return this.withRetry(async (attempt) => {

      const res = await this.requestContext[method](url, {
        headers: this.getHeaders(
          options.headers,
          options.token,      // per-request token
          requestId           // request tracing
        ),
        data: options.body,
        params: options.params,
        timeout: options.timeout || this.defaultTimeout
      });

      const duration = Date.now() - startTime;

      const responseBody = await this.parseResponse(res);

      // -----------------------------
      // STRUCTURED LOGGING
      // -----------------------------
      if (this.enableLogging) {
        this.logger.info({
          type: 'API_CALL',
          method: method.toUpperCase(),
          url,
          status: res.status(),
          duration,
          requestId,
          attempt
        });
      }

      // -----------------------------
      // ERROR HANDLING
      // -----------------------------
      if (!res.ok()) {
        const error = new Error(
          `API ${method.toUpperCase()} ${url} failed with status ${res.status()}`
        );

        error.status = res.status();
        error.url = url;
        error.method = method;
        error.payload = options.body;
        error.response = responseBody;
        error.requestId = requestId;
        error.duration = duration;
        console.error('❌ API ERROR BODY:', JSON.stringify(responseBody, null, 2));
        throw error;
      }

      return responseBody;

    }, `${method.toUpperCase()} ${url}`, {
      requestId
    });
  }

  // -----------------------------
  // METHODS
  // -----------------------------
  async get(url, options = {}) {
    return this.request('get', url, options);
  }

  async post(url, body = {}, options = {}) {
    return this.request('post', url, { ...options, body });
  }

  async put(url, body = {}, options = {}) {
    return this.request('put', url, { ...options, body });
  }

  async delete(url, options = {}) {
    return this.request('delete', url, options);
  }

  // -----------------------------
  // TEST SUPPORT
  // -----------------------------
  setGlobalRequestId(id) {
    this.globalRequestId = id;
  }
}