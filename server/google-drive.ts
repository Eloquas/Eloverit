import { google } from 'googleapis';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  webViewLink: string;
}

export class GoogleDriveService {
  private drive: any;
  
  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_DRIVE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async searchFiles(query: string = ''): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `name contains '${query}' and (mimeType='text/plain' or mimeType='application/rtf' or mimeType='text/markdown' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')`,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        pageSize: 20,
        orderBy: 'modifiedTime desc'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Failed to search Google Drive files:', error);
      throw new Error('Failed to access Google Drive. Please check your credentials.');
    }
  }

  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw new Error('Failed to download file from Google Drive.');
    }
  }

  async listRecentTranscripts(): Promise<DriveFile[]> {
    try {
      return await this.searchFiles('transcript call meeting');
    } catch (error) {
      console.error('Failed to list recent transcripts:', error);
      return [];
    }
  }
}

export const googleDriveService = new GoogleDriveService();