const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("./s3Client");

const uploadImageToS3 = async (req) => {
    if (!req.file) {
        console.log("No file uploaded");
        return null;
    }

    const fileContent = Buffer.from(req.file.buffer);
    const fileName = `${Date.now().toString()}-${req.file.originalname}`;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: req.file.mimetype,
    };

    console.log("Uploading to S3 with params:", params);

    const command = new PutObjectCommand(params);
    try {
        await s3.send(command);
        console.log(`File uploaded successfully: ${fileName}`);
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
        console.log("Error uploading file:", error);
    }
};

module.exports = uploadImageToS3;
