import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("No file path provided");
        }

        // Upload the file to Cloudinary
        const responce = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })

        // File uploaded successfully, delete the local file
        // console.log("File uploaded successfully:", responce.url);
        fs.unlinkSync(localFilePath); // Delete the local file after upload

        return responce.url;
    }
    catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        throw error;
    } finally {
        // Delete the local file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
    }
}



export { uploadOnCloudinary };