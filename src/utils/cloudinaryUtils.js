import { Cloudinary } from 'cloudinary-core';

// Cloudinary configuration
const cloudinaryConfig = {
  cloud_name: 'ducxbdmzv', // Your Cloudinary cloud name
  upload_preset: 'sarmad' // Your unsigned upload preset
};

// Create a Cloudinary instance for frontend use
export const cloudinary = new Cloudinary({
  cloud_name: cloudinaryConfig.cloud_name,
  secure: true
});

/**
 * Upload an image to Cloudinary using the unsigned upload method
 * This approach doesn't require Node.js modules and works directly in the browser
 * 
 * @param {File} file - The image file to upload
 * @param {String} folder - Optional folder name in Cloudinary
 * @returns {Promise<Object>} - Cloudinary upload response
 */
export const uploadImageToCloudinary = (file, folder = 'hall_images') => {
  return new Promise((resolve, reject) => {
    // Create a FormData instance
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.upload_preset);
    formData.append('folder', folder);

    // Use Cloudinary upload endpoint
    fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height
        });
      })
      .catch(error => {
        console.error('Error uploading to Cloudinary:', error);
        reject(error);
      });
  });
};

/**
 * Note: Direct image deletion from the browser is NOT secure and requires authentication
 * For security reasons, image deletion should be handled through a server
 * 
 * This implementation will log a warning and return a resolved promise for compatibility
 */
export const deleteImageFromCloudinary = (publicId) => {
  console.warn(
    'Warning: Direct deletion of Cloudinary images from the browser is not secure.\n' +
    'In a production environment, image deletion should be handled through a secure backend.'
  );
  
  // For this implementation, we're just returning a resolved promise
  // In a real app, you would implement a secure server-side solution
  return Promise.resolve({ result: 'pending_backend_implementation' });
};

export default cloudinaryConfig; 