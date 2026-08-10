/**
 * MediaRepository Interface / Base Class
 * Defines the contract for storing and serving media files (Images & Documents).
 * Abstracted so that local storage can be swapped for S3 / Cloudinary / Azure Blob later.
 */
export class MediaRepository {
  async saveFile(fileData) {
    throw new Error('Method saveFile() must be implemented');
  }

  async getFileById(id) {
    throw new Error('Method getFileById() must be implemented');
  }
}
