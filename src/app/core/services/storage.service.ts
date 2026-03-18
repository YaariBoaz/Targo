import { Injectable, inject } from '@angular/core';
import {
  Storage as FirebaseStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = inject(FirebaseStorage);

  /**
   * Upload a base64 image to Firebase Storage
   * @param path The storage path (e.g., 'profile-photos/user123.jpg')
   * @param dataUrl The base64 data URL from camera
   * @returns The download URL of the uploaded image
   */
  async uploadBase64Image(path: string, dataUrl: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);

      // Upload the base64 string
      const snapshot = await uploadString(storageRef, dataUrl, 'data_url');

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('Image uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param path The storage path of the file to delete
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      console.log('File deleted successfully:', path);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error if file doesn't exist
      if ((error as any).code !== 'storage/object-not-found') {
        throw error;
      }
    }
  }

  /**
   * Generate a unique filename for user profile photo
   * @param userId The user's UID
   * @returns A unique storage path
   */
  generateProfilePhotoPath(userId: string): string {
    const timestamp = Date.now();
    return `profile-photos/${userId}_${timestamp}.jpg`;
  }
}
