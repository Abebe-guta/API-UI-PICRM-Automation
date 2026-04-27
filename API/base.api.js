import { request } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

export class BaseAPI {
  constructor() {
    this.baseURL = process.env.BASE_URL;
    this.token=null;
    this.requestContext=null;
    this.defaultTimeout = 30000; // Default timeout for API requests in milliseconds
    this.retryCount = 2; // retry failed calls twice before giving up
  }
    // -----------------------------
  // INIT API CLIENT
  // -----------------------------
  async init() {
    this.requestContext = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ignoreHTTPSErrors: true, // similar to --insecure in curl
      timeout: this.defaultTimeout,
    });
  }
    // -----------------------------
  // SAFETY CHECKS
  // -----------------------------
  ensureInit(){
    if (!this.requestContext) {
      throw new Error("BaseAPI context is not initialized. Please call init() before making API requests.");
    }
  }
    // -----------------------------
  // AUTH TOKEN HANDLING
  // -----------------------------
  setToken(token) {
    this.token = token;
  }
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };
    if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
}
 // ---------------------------
 // RETRY LOGIC
 // ---------------------------
  async withRetry(fn) {
    let lastError;

    for (let i = 0; i <= this.retryCount; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        console.warn(`Retry ${i + 1}/${this.retryCount} failed...`);
      }
    }

    throw lastError;
  }
// -----------------------------
  // GET REQUEST
  // -----------------------------
 async get(url, options = {}) {
    this.ensureInit();

    return this.withRetry(async () => {
      const res = await this.requestContext.get(url, {
        headers: this.getHeaders(options.headers),
        params: options.params,
        timeout: options.timeout || this.defaultTimeout
      });

      return this.handleResponse(res, 'GET', url);
    });
  }
    // -----------------------------
  // POST REQUEST
  // -----------------------------
  async post(url, body = {}, options = {}) {
    this.ensureInit();

    return this.withRetry(async () => {
      const res = await this.requestContext.post(url, {
        headers: this.getHeaders(options.headers),
        data: body,
        params: options.params,
        timeout: options.timeout || this.defaultTimeout
      });

      return this.handleResponse(res, 'POST', url, body);
    });
  }
    //  
    //------------------------------ 
  // PUT REQUEST
  // -----------------------------
  async put(url, body = {}, options = {}) {
    this.ensureInit();

    return this.withRetry(async () => {
      const res = await this.requestContext.put(url, {
        headers: this.getHeaders(options.headers),
        data: body,
        timeout: options.timeout || this.defaultTimeout
      });

      return this.handleResponse(res, 'PUT', url, body);
    });
  }

  //------------------------------ 
  // DELETE REQUEST
  // -----------------------------
  async delete(url, options = {}) {
    this.ensureInit();

    return this.withRetry(async () => {
      const res = await this.requestContext.delete(url, {
        headers: this.getHeaders(options.headers),
        timeout: options.timeout || this.defaultTimeout
      });

      return this.handleResponse(res, 'DELETE', url);
    });
  }
  // -----------------------------
  // RESPONSE HANDLER
  // -----------------------------
  async handleResponse(res, method, url, body = null) {
    let responseBody;
    try {
      responseBody = await res.json();
    } catch (e) {
      responseBody = await res.text();
    }
    // Logging
    console.log(`\n[API ${method}] ${url}`);
    console.log(`Status: ${res.status()}`);

    if (body) {
      console.log('Request Body:', JSON.stringify(body, null, 2));
    }

    console.log('Response:', JSON.stringify(responseBody, null, 2));

    if (!res.ok()) {
        console.error('API ERROR:', body);
      throw new Error(`API ${method} ${url} failed with status ${res.status()}`);
    }
    return responseBody;
}
  }
