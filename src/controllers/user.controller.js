import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    // Validation - not empty
    // Check if user already exists in the database: email, username
    // Check for images and avatar
    // Upload them to cloudinary
    // Create user object - create entry in the database
    // Remove password and refresh token from the response object
    // Check for user creation success
    // Send success response with user details


    const { fullName, username, email, password} = req.body;
    console.log("fullName, username, email, password",fullName, username, email, password);


    // if(!fullName || !username || !email || !password) {
    //     throw new ApiError(400, "All fields are required");
    // }

    if(
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }


    const existedUser = await User.findOne(
        { $or: [{ email }, { username }] }
    );

    if(existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    const avatarLocalPath = req?.files?.avatar[0]?.path;
    const coverImageLocalPath = req?.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Please upload avatar.");
    };

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if(!avatar) {
        throw new ApiError(400, "Avatar upload failed.");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser) {
        throw new ApiError(400, "User creation failed.");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    );
});


export { registerUser };