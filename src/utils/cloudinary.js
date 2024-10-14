import cloudinary from 'cloudinary';
import ApiError from './apiError.js'; // Adjust the path if necessary

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  // Upload single image to Cloudinary
  static async uploadImage(filePath) {
    try {
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: 'products',
        transformation: [{ width: 500, height: 500, crop: 'fill' }],
      });
      return result.secure_url;
    } catch (error) {
      throw new Error('Image upload failed: ' + error.message);
    }
  }

  // Upload multiple images to Cloudinary
  static async uploadMultipleImages(filePaths) {
    try {
      const uploadPromises = filePaths.map((filePath) =>
        cloudinary.v2.uploader.upload(filePath, {
          folder: 'products',
          transformation: [{ width: 500, height: 500, crop: 'fill' }],
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      return uploadResults.map((result) => result.secure_url);
    } catch (error) {
      throw new Error('Multiple image upload failed: ' + error.message);
    }
  }

  // Extract public ID from Cloudinary URL
  static getPublicIdFromUrl(url) {
    const urlParts = url.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    return `products/${publicId}`;
  }

  // Delete image from Cloudinary
  static async deleteImage(imageUrl) {
    try {
      const publicId = CloudinaryService.getPublicIdFromUrl(imageUrl);
      await cloudinary.v2.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new ApiError(500, 'Error deleting image');
    }
  }
}

export default CloudinaryService;
