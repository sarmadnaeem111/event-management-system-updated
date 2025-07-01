# Cloudinary Setup Guide

This application uses Cloudinary for storing wedding hall images. Follow these steps to set up Cloudinary:

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account.
2. After signing up, you'll be taken to your dashboard.

## 2. Get Your Cloud Name

1. In your Cloudinary dashboard, you'll see your Cloud Name.
2. Copy this value.

## 3. Create an Upload Preset

1. In your Cloudinary dashboard, go to Settings > Upload.
2. Scroll down to "Upload presets" and click "Add upload preset".
3. Give it a name (e.g., "event_management_preset").
4. Set "Signing Mode" to "Unsigned".
5. Configure other settings as needed (folder path, transformations, etc.).
6. Save the preset.

## 4. Configure Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist).
2. Add the following lines:

```
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

3. Replace `your_cloud_name` with your actual Cloud Name.
4. Replace `your_upload_preset` with the name of the upload preset you created.

## 5. Restart Your Development Server

After setting up the environment variables, restart your development server for the changes to take effect.

## Notes

- The application is now configured to upload wedding hall images to Cloudinary.
- Images are stored in the `hall_images/{hallId}` folder in your Cloudinary account.
- For security reasons, image deletion is not implemented directly from the browser. When an image is marked for deletion in the UI, it's only removed from the database reference but remains in Cloudinary storage. 