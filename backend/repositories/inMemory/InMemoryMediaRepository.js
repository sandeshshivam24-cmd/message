import { MediaRepository } from '../MediaRepository.js';

export class InMemoryMediaRepository extends MediaRepository {
  constructor() {
    super();
    // Key: fileId, Value: file metadata object
    this.mediaFiles = new Map();
  }

  async saveFile(fileData) {
    const id = fileData.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mediaRecord = {
      id,
      filename: fileData.filename,
      originalName: fileData.originalname || fileData.filename,
      mimeType: fileData.mimetype,
      size: fileData.size,
      url: fileData.url,
      type: fileData.type || (fileData.mimetype.startsWith('image/') ? 'image' : 'file'),
      uploadedAt: new Date().toISOString()
    };
    this.mediaFiles.set(id, mediaRecord);
    return { ...mediaRecord };
  }

  async getFileById(id) {
    const file = this.mediaFiles.get(id);
    if (!file) return null;
    return { ...file };
  }
}
