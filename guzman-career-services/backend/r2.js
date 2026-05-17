const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function uploadFile(key, buffer, _contentType) {
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id: key,
                resource_type: 'raw',
                type: 'private',
                overwrite: true,
            },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });
    console.log('[uploadFile] public_id:', result.public_id, '| type:', result.type);
    return result;
}

async function getSignedDownloadUrl(key, expiresIn = 300) {
    let resource;
    try {
        resource = await cloudinary.api.resource(key, { resource_type: 'raw' });
    } catch (err) {
        const detail = err?.error?.message || err?.message || JSON.stringify(err);
        throw new Error(`File not found in storage: ${detail}`);
    }

    if (resource.type === 'upload') {
        // Signed delivery URL — must include the actual version or the signature won't match.
        return cloudinary.url(key, {
            resource_type: 'raw',
            type: 'upload',
            sign_url: true,
            secure: true,
            version: resource.version,
        });
    }

    // type:'private' — use private_download_url which handles versioning internally.
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
