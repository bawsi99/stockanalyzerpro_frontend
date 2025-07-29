// Simple authentication service for WebSocket connections
import { API_BASE_URL } from '../config';

export interface AuthResponse {
  token: string;
  user_id: string;
}

export interface VerifyResponse {
  valid: boolean;
  user_id?: string;
}

class AuthService {
  private token: string | null = null;
  private userId: string | null = null;

  constructor() {
    // Try to load existing token from localStorage
    this.loadToken();
  }

  private loadToken(): void {
    try {
      const storedToken = localStorage.getItem('jwt_token');
      const storedUserId = localStorage.getItem('user_id');
      if (storedToken && storedUserId) {
        this.token = storedToken;
        this.userId = storedUserId;
      }
    } catch (error) {
      console.warn('Failed to load token from localStorage:', error);
    }
  }

  private saveToken(token: string, userId: string): void {
    try {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_id', userId);
      this.token = token;
      this.userId = userId;
    } catch (error) {
      console.warn('Failed to save token to localStorage:', error);
    }
  }

  async createToken(userId?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token?user_id=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create token: ${response.statusText}`);
      }

      const data: AuthResponse = await response.json();
      this.saveToken(data.token, data.user_id);
      return data;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  async verifyToken(token?: string): Promise<VerifyResponse> {
    const tokenToVerify = token || this.token;
    if (!tokenToVerify) {
      return { valid: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify?token=${encodeURIComponent(tokenToVerify)}`);
      
      if (!response.ok) {
        return { valid: false };
      }

      const data: VerifyResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying token:', error);
      return { valid: false };
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUserId(): string | null {
    return this.userId;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  clearToken(): void {
    try {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_id');
      this.token = null;
      this.userId = null;
    } catch (error) {
      console.warn('Failed to clear token from localStorage:', error);
    }
  }

  async ensureAuthenticated(): Promise<string> {
    // Check if we have a valid token
    if (this.token) {
      const verification = await this.verifyToken();
      if (verification.valid) {
        return this.token;
      }
    }

    // Get user ID from localStorage or use anonymous
    const userId = localStorage.getItem('user_id') || 'anonymous';
    
    // Create a new token with actual user ID
    const authResponse = await this.createToken(userId);
    return authResponse.token;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 