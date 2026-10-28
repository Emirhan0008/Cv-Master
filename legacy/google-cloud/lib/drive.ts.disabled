/**
 * Simple, lightweight and robust Google Drive REST API wrapper.
 * Communicates directly with Google Drive API v3 using the user's OAuth Access Token.
 */

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export class GoogleDriveClient {
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("Google Drive entegrasyonu için yetkilendirme anahtarı bulunamadı.");
    }
    this.accessToken = accessToken;
  }

  private getHeaders(contentType: string = "application/json") {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "Content-Type": contentType,
    };
  }

  /**
   * Finds or creates a designated folder in Google Drive.
   */
  async getOrCreateFolder(folderName: string = "CV Master Backups"): Promise<string> {
    try {
      // 1. Search for existing folder
      const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
      
      const searchRes = await fetch(searchUrl, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!searchRes.ok) {
        const errText = await searchRes.text();
        throw new Error(`Folder search failed: ${searchRes.statusText}. Details: ${errText}`);
      }

      const searchData = await searchRes.json() as { files?: GoogleDriveFile[] };
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // 2. Folder not found, create it
      const createUrl = "https://www.googleapis.com/drive/v3/files";
      const createRes = await fetch(createUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Folder creation failed: ${createRes.statusText}. Details: ${errText}`);
      }

      const folder = await createRes.json() as GoogleDriveFile;
      return folder.id;
    } catch (err: any) {
      console.error("Google Drive getOrCreateFolder error:", err);
      throw new Error(`Google Drive klasörü hazırlanamadı: ${err.message}`);
    }
  }

  /**
   * Uploads or updates a JSON CV file in the specified folder.
   */
  async uploadCvJson(filename: string, cvDataJson: string, folderId: string, existingFileId?: string): Promise<string> {
    try {
      const boundary = "-------314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;
      const contentType = "application/json";

      const metadata = {
        name: filename.endsWith(".json") ? filename : `${filename}.json`,
        mimeType: contentType,
        parents: existingFileId ? undefined : [folderId],
      };

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${contentType}\r\n\r\n` +
        cvDataJson +
        closeDelim;

      let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name";
      let method = "POST";

      if (existingFileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name`;
        method = "PATCH";
      }

      const response = await fetch(url, {
        method,
        headers: this.getHeaders(`multipart/related; boundary=${boundary}`),
        body: multipartRequestBody,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`File upload failed: ${response.statusText}. Details: ${errText}`);
      }

      const fileResult = await response.json() as GoogleDriveFile;
      return fileResult.id;
    } catch (err: any) {
      console.error("Google Drive uploadCvJson error:", err);
      throw new Error(`Google Drive dosyası yüklenemedi: ${err.message}`);
    }
  }

  /**
   * Lists all CV JSON backup files inside the designated folder.
   */
  async listBackupFiles(folderId: string): Promise<GoogleDriveFile[]> {
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and mimeType = 'application/json' and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime)`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`File listing failed: ${response.statusText}. Details: ${errText}`);
      }

      const data = await response.json() as { files?: GoogleDriveFile[] };
      return data.files || [];
    } catch (err: any) {
      console.error("Google Drive listBackupFiles error:", err);
      throw new Error(`Google Drive yedekleri listelenemedi: ${err.message}`);
    }
  }

  /**
   * Downloads a specific JSON file's content from Google Drive.
   */
  async downloadFileContent(fileId: string): Promise<string> {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`File download failed: ${response.statusText}. Details: ${errText}`);
      }

      return await response.text();
    } catch (err: any) {
      console.error("Google Drive downloadFileContent error:", err);
      throw new Error(`Google Drive dosyası indirilemedi: ${err.message}`);
    }
  }

  /**
   * Deletes a specific file from Google Drive.
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`File deletion failed: ${response.statusText}. Details: ${errText}`);
      }
    } catch (err: any) {
      console.error("Google Drive deleteFile error:", err);
      throw new Error(`Google Drive dosyası silinemedi: ${err.message}`);
    }
  }
}
