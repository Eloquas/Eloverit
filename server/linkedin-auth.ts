import { AuthService } from './auth';
import { storage } from './storage';
import axios from 'axios';

export class LinkedInAuthService {
  private static readonly CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
  private static readonly REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/auth/linkedin/callback';

  static getAuthUrl(): string {
    if (!this.CLIENT_ID) {
      throw new Error('LinkedIn Client ID not configured');
    }

    const scopes = 'r_liteprofile r_emailaddress';
    const state = Math.random().toString(36).substring(2, 15);
    
    return `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${this.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scopes)}`;
  }

  static async exchangeCodeForToken(code: string): Promise<string> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('LinkedIn credentials not configured');
    }

    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.REDIRECT_URI,
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return tokenResponse.data.access_token;
  }

  static async getLinkedInProfile(accessToken: string): Promise<any> {
    const [profileResponse, emailResponse] = await Promise.all([
      axios.get('https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    ]);

    const profile = profileResponse.data;
    const email = emailResponse.data.elements[0]?.['handle~']?.emailAddress;

    return {
      id: profile.id,
      firstName: profile.firstName?.localized?.en_US,
      lastName: profile.lastName?.localized?.en_US,
      emailAddress: email,
      pictureUrl: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
    };
  }

  static async processLinkedInCallback(code: string): Promise<{ user: any; token: string; sessionId: string }> {
    const accessToken = await this.exchangeCodeForToken(code);
    const linkedInProfile = await this.getLinkedInProfile(accessToken);
    
    const result = await AuthService.linkedInLogin(linkedInProfile);
    if (!result) {
      throw new Error('Failed to create or login user');
    }

    return result;
  }
}