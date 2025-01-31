const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const isSupported = fileTypes.test(file.mimetype) && fileTypes.test(file.originalname.split('.').pop());

        if (isSupported) {
            cb(null, true);
        } else {
            cb(new Error("Error: File type not supported! Supported types are: jpeg, jpg, png, gif."));
        }
    },
});

module.exports = upload;
