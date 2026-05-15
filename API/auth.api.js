export class AuthAPI {
  constructor(baseAPI) {
    this.baseAPI = baseAPI;
  }

  async login(username, password) {
    const response = await this.baseAPI.requestContext.post(
      '/api/v1/auth/login',  
      {
        data: {
          username: process.env.LOGIN_USERNAME || username,
          password: process.env.LOGIN_PASSWORD || password
        }
      }
    );

    // safely parse JSON (avoid HTML crash)
    const contentType = response.headers()['content-type'];

    let body;
    if (contentType?.includes('application/json')) {
      body = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Login did not return JSON: ${text.slice(0, 200)}`);
    }

    const token =
      body?.access_token ||
      body?.token ||
      body?.data?.access_token;

    if (!token) {
      throw new Error('Login failed: No access token received');
    }

    this.baseAPI.setToken(token);

    console.log('Login successful, token set.');

    return token;
  }
}