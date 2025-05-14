# Cloudinary Image Migration Guide

## ✅ Completed Changes

### 1. **Upload Middleware** (`server/middleware/uploadCloudinary.js`)
- ✅ Created new middleware using `multer` + `multer-storage-cloudinary`
- ✅ Configured two storage instances:
  - **Properties**: `rentease/properties` folder (max 5 images)
  - **Workers**: `rentease/workers` folder (single image)
- ✅ File size limit: **5MB per file**
- ✅ Allowed formats: `jpg`, `jpeg`, `png`, `webp`
- ✅ Exports: `uploadProperties` (array) and `uploadWorker` (single)

### 2. **Models** (Already Updated)
- ✅ **Property Model**: `images: [{ url: String, publicId: String }]`
- ✅ **Worker Model**: `image: { url: String, publicId: String }`

### 3. **Property Controller** (`server/controllers/propertyController.js`)
- ✅ Removed: `formidable` parsing and Base64 conversion
- ✅ Updated `listProperty()`:
  - Now extracts field data from `req.body` (parsed by express middleware)
  - Maps Cloudinary files from `req.files` to `{ url, publicId }` format
  - Stores only Cloudinary URLs (no Base64)
- ✅ Updated `deleteProperty()`:
  - Now deletes images from Cloudinary using `publicId`
  - Handles deletion errors gracefully

### 4. **Worker Controller** (`server/controllers/workerController.js`)
- ✅ Removed: `formidable` parsing and Base64 conversion
- ✅ Added: `cloudinary` import
- ✅ Updated `registerWorker()`:
  - Extracts form fields from `req.body`
  - Gets image from `req.file` (multer parsed)
  - Deletes old image from Cloudinary before updating
  - Stores only Cloudinary URL + publicId in MongoDB
- ✅ Updated `deleteWorkerAccount()`:
  - Deletes worker image from Cloudinary before account deletion

### 5. **Routes**

#### Property Routes (`server/routes/property.js`)
```javascript
router.post("/list-property", 
  isAuthenticated, 
  uploadProperties,  // ✅ NEW: Multer middleware
  propertyController.listProperty
);
```

#### Worker Routes (`server/routes/workers.js`)
```javascript
router.post("/register", 
  uploadWorker,  // ✅ NEW: Multer middleware
  workerController.registerWorker
);
```

---

## 🎯 What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Upload Method** | formidable (form parsing) | multer (streaming) |
| **Image Storage** | Base64 strings in MongoDB | Cloudinary URLs + publicIds |
| **Data Format** | `image: "data:image/png;base64,..."` | `image: { url: "https://...", publicId: "..." }` |
| **File Size** | Stored in DB (bloats MongoDB) | Stored on Cloudinary (CDN) |
| **Deletion** | No cleanup (Base64 remains in DB) | Automatic cleanup from Cloudinary |

---

## 📱 Frontend Updates Required

### Form Submission Changes
Your frontend must now send images as **FormData** (file objects), NOT Base64 strings or JSON.

#### ❌ **OLD (No Longer Works)**
```javascript
// This won't work anymore
const payload = {
  "full-name": "John Doe",
  image: "data:image/png;base64,..." // ❌ REMOVED
};
fetch("/api/workers/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
```

#### ✅ **NEW (Cloudinary)**
```javascript
// Property registration
const formData = new FormData();
formData.append("property-type", "apartment");
formData.append("property-subtype", "flat");
formData.append("city", "Mumbai");
formData.append("price", "15000");
formData.append("description", "...");
// Add multiple images
document.querySelectorAll('input[name="images"]').forEach(input => {
  Array.from(input.files).forEach(file => {
    formData.append("images", file); // ✅ File objects
  });
});

fetch("/api/properties/list-property", {
  method: "POST",
  body: formData // ✅ Don't set Content-Type header (browser sets it automatically)
}).then(res => res.json()).then(data => console.log(data));
```

```javascript
// Worker registration
const formData = new FormData();
formData.append("full-name", "John Doe");
formData.append("phone", "9876543210");
formData.append("email", "john@example.com");
formData.append("city", "Mumbai");
formData.append("area", "Andheri");
formData.append("service-type", "Plumber");
formData.append("experience", "5");
formData.append("price", "5000");
formData.append("description", "Professional plumber...");
formData.append("availability", "full-time");
formData.append("rateUnit", "daily");
formData.append("terms-agreement", "on");

// Add image file
const imageInput = document.querySelector('input[name="image"]');
if (imageInput.files.length > 0) {
  formData.append("image", imageInput.files[0]); // ✅ File object
}

fetch("/api/workers/register", {
  method: "POST",
  body: formData // ✅ Don't set Content-Type header
}).then(res => res.json()).then(data => console.log(data));
```

### Key Points
- ✅ Use `FormData` object for file uploads
- ✅ Append actual file objects (from `<input type="file">`)
- ✅ **DO NOT** set `Content-Type` header - browser handles it automatically
- ✅ JSON with Base64 strings no longer works
- ✅ Images are now stored on Cloudinary, not in MongoDB

---

## 🗑️ Image Deletion Logic

Deletion happens automatically in two places:

### 1. **Property Deletion**
```javascript
// server/controllers/propertyController.js - deleteProperty()
if (property.images && property.images.length > 0) {
  for (const image of property.images) {
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
  }
}
```

### 2. **Worker Account Deletion**
```javascript
// server/controllers/workerController.js - deleteWorkerAccount()
if (worker.image && worker.image.publicId) {
  await cloudinary.uploader.destroy(worker.image.publicId);
}
```

### 3. **Worker Image Update**
```javascript
// When updating worker profile with new image
if (worker.image && worker.image.publicId) {
  await cloudinary.uploader.destroy(worker.image.publicId); // Delete old
}
worker.image = { url: newUrl, publicId: newPublicId }; // Set new
```

---

## 🔐 Cloudinary Configuration

The system automatically reads from `CLOUDINARY_URL` environment variable:
```bash
# .env file
CLOUDINARY_URL=cloudinary://YOUR_KEY:YOUR_SECRET@YOUR_NAME
```

The config is in `server/config/cloudinary.js`:
```javascript
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  secure: true, // ✅ Always use HTTPS URLs
});
module.exports = cloudinary;
```

---

## 📊 Data Structure Examples

### Property with Images
```javascript
{
  _id: ObjectId("..."),
  name: "2 BHK Apartment in Mumbai",
  images: [
    {
      url: "https://res.cloudinary.com/rentease/image/upload/v1234567890/rentease/properties/abc123.jpg",
      publicId: "rentease/properties/abc123"
    },
    {
      url: "https://res.cloudinary.com/rentease/image/upload/v1234567890/rentease/properties/def456.jpg",
      publicId: "rentease/properties/def456"
    }
  ],
  // ... other fields
}
```

### Worker with Image
```javascript
{
  _id: ObjectId("..."),
  firstName: "John",
  lastName: "Doe",
  image: {
    url: "https://res.cloudinary.com/rentease/image/upload/v1234567890/rentease/workers/xyz789.jpg",
    publicId: "rentease/workers/xyz789"
  },
  serviceType: "Plumber",
  // ... other fields
}
```

---

## ✨ Benefits

✅ **Reduced MongoDB Size**: No Base64 strings bloating the database  
✅ **Better Performance**: Images served from Cloudinary CDN  
✅ **Flexible Transformations**: Easy image resizing on-the-fly  
✅ **Automatic Cleanup**: Old images deleted when records updated  
✅ **Secure URLs**: HTTPS by default  
✅ **Version Control**: Track image changes via publicId  

---

## 🧪 Testing Checklist

- [ ] Property listing with multiple images
- [ ] Property deletion removes Cloudinary images
- [ ] Worker registration with profile image
- [ ] Worker profile update replaces old image on Cloudinary
- [ ] Worker account deletion removes image
- [ ] Property display shows correct image URLs
- [ ] Worker detail page shows profile image
- [ ] Admin dashboard displays all images correctly
- [ ] No Base64 strings stored in MongoDB
- [ ] Cloudinary folder structure is correct (`rentease/properties`, `rentease/workers`)

---

## 🚀 Deployment Notes

1. **No Migration Needed**: Existing Base64 images in DB remain, new uploads use Cloudinary
2. **Gradual Rollout**: Old and new data coexist - display logic already handles both
3. **Environment Variable**: Ensure `CLOUDINARY_URL` is set in production
4. **File Format**: Only JPEG, PNG, WEBP accepted
5. **Size Limit**: 5MB per file (enforced by multer)

---

## 📝 Summary

This migration replaces Base64 image handling with **production-ready Cloudinary integration**:
- ✅ Cloudinary handles file uploads and storage
- ✅ Multer middleware processes multipart/form-data
- ✅ MongoDB stores only URLs + publicIds
- ✅ Automatic image deletion on record deletion
- ✅ Secure, reliable image hosting

**No breaking DB changes** - the system is backward compatible with existing data.
