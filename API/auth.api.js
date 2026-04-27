export class AuthAPI{
    constructor(baseAPI) {
        this.baseAPI = baseAPI;
    }
    async login(username, password) {
    const response = await this.baseAPI.requestContext.post('/auth/login', {
      username:process.env.LOGIN_USERNAME || username,
      password:process.env.LOGIN_PASSWORD || password
    });
    const token= response?.data?.access_token || response?.access_token;
    if (!token) {
        throw new Error('Login failed: No access token received');
    }
    this.baseAPI.setToken(token);
    console.log('Login successful, token set.');
    return token;
  }
}