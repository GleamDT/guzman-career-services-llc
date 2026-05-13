const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function uploadFile(key, buffer, _contentType) {
    await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id: key,
                resource_type: 'raw',
                access_mode: 'authenticated',
                overwrite: true,
            },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });
}

async function getSignedDownloadUrl(key, expiresIn = 300) {
    return cloudinary.utils.private_download_url(key, null, {
        resource_type: 'raw',
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
        attachment: true,
    });
}

async function deleteFile(key) {
    try {
        await cloudinary.uploader.destroy(key, { resource_type: 'raw' });
    } catch (err) {
        console.error('[deleteFile] Cloudinary delete failed:', err.message);
    }
}

module.exports = { uploadFile, getSignedDownloadUrl, deleteFile };
