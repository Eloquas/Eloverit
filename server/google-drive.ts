import { google } from 'googleapis';
import { Readable } from 'stream';

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
      // FIX: use correct scope for upload & file management
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async searchFiles(query: string = ''): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `name contains '${query}' and trashed = false`,
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
      }, { responseType: 'stream' });

      return await this.streamToString(response.data);
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw new Error('Failed to download file from Google Drive.');
    }
  }

  // NEW: Helper to convert stream to string
  private async streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  async uploadFile(name: string, mimeType: string, data: Buffer | Readable, folderId?: string): Promise<DriveFile> {
    try {
      const fileMetadata: any = { name };
      if (folderId) fileMetadata.parents = [folderId];

      const media = {
        mimeType,
        body: data instanceof Readable ? data : Readable.from(data),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id,name,mimeType,size,modifiedTime,webViewLink'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to upload file to Google Drive:', error);
      throw new Error('Failed to upload file to Google Drive.');
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
