// import { asyncHandler } from '../utils/asyncHandler.js';
// import { ApiError } from '../utils/ApiError.js';
// import { User } from '../models/user.model.js';
// import { uploadOnCloudinary } from '../utils/cloudinary.js';
// import { ApiResponse } from '../utils/ApiResponse.js';

// const registerUser = asyncHandler(async (req, res) => {
//     // Get user details from frontend
//     // Validation - not empty
//     // Check if user already exists in the database: email, username
//     // Check for images and avatar
//     // Upload them to cloudinary
//     // Create user object - create entry in the database
//     // Remove password and refresh token from the response object
//     // Check for user creation success
//     // Send success response with user details


//     const { fullName, username, email, password} = req.body;
//     console.log("fullName, username, email, password",fullName, username, email, password);


//     // if(!fullName || !username || !email || !password) {
//     //     throw new ApiError(400, "All fields are required");
//     // }

//     if(
//         [fullName, username, email, password].some((field) => field?.trim() === "")
//     ){
//         throw new ApiError(400, "All fields are required");
//     }


//     const existedUser = await User.findOne(
//         { $or: [{ email }, { username }] }
//     );

//     if(existedUser) {
//         throw new ApiError(409, "User with this email or username already exists");
//     }

//     const avatarLocalPath = req.files?.avatar[0]?.path;
//     const coverImageLocalPath = req?.files?.coverImage[0]?.path;

//     if(!avatarLocalPath) {
//         throw new ApiError(400, "Please upload avatar.");
//     };

//     const avatar = await uploadOnCloudinary(avatarLocalPath);
//     const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

//     if(!avatar) {
//         throw new ApiError(400, "Avatar upload failed.");
//     }

//     const user = await User.create({
//         fullName,
//         avatar: avatar.url,
//         coverImage: coverImage?.url || "",
//         email,
//         password,
//         username: username.toLowerCase(),
//     });

//     const createdUser = await User.findById(user._id).select("-password -refreshToken");

//     if(!createdUser) {
//         throw new ApiError(400, "User creation failed.");
//     }

//     return res.status(201).json(
//         new ApiResponse(200, createdUser, "User created successfully")
//     );
// });


// export { registerUser };












import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';


const generateAccessAndRefreshTokens = async (userId) => {
    // Generate access token and refresh token using JWT or any other method
    // For example, using jsonwebtoken library:
    // const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    // const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    // return { accessToken, refreshToken };
    // Placeholder implementation, replace with actual token generation logic
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken(); 
        const refreshToken = user.generateRefreshToken(); 

        user.refreshToken = refreshToken; // Save refresh token in the database
        await user.save({ validateBeforeSave: false }); // Save the user with the new refresh token

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Token generation failed");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    const { fullName, username, email, password} = req.body;
    // console.log("fullName, username, email, password", fullName, username, email, password);

    // Validation - not empty
    if(
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne(
        { $or: [{ email }, { username }] }
    );

    if(existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }


    // console.log("req.files", req.files);
    // Check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Please upload avatar.");
    };

    try {
        // Upload them to cloudinary - now returning just the URL string
        const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
        
        if(!avatarUrl) {
            throw new ApiError(400, "Avatar upload failed.");
        }
        
        // Handle cover image if provided
        let coverImageUrl = "";
        if(coverImageLocalPath) {
            coverImageUrl = await uploadOnCloudinary(coverImageLocalPath) || "";
        }

        // let coverImageLocalPath;
        // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        //     coverImageLocalPath = req.files.coverImage[0].path;
        // }

        // Create user object with the URLs directly
        const user = await User.create({
            fullName,
            avatar: avatarUrl,  // Direct URL string
            coverImage: coverImageUrl,  // Direct URL string
            email,
            password,
            username: username.toLowerCase(),
        });

        // Remove password and refresh token from the response
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if(!createdUser) {
            throw new ApiError(400, "User creation failed.");
        }

        // Send success response
        return res.status(201).json(
            new ApiResponse(201, createdUser, "User created successfully")
        );
    } catch (error) {
        console.error("Error during registration:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Registration failed");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    // req body - data
    // username or email, password
    // find user in the database
    // check if password is correct
    // create access token and refresh token
    // save refresh token in the database
    // send cookies with refresh token
    // send success response with user details and tokens


    const {username, email, password} = req.body;

    if(!username && !email ) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {   
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(200, 
            {
            user: loggedInUser, accessToken, refreshToken
        },
             "User logged in successfully")
    );


});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        { 
            $set: { 
                refreshToken: undefined
            }
        }, 
        {
             new: true 
    });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res.status(200)
        .cookie("refreshToken", options)
        .cookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));


});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used");
        }
    
        const { accessToken, newRefreshToken } =await generateAccessAndRefreshTokens(user._id);
    
        const options = {
            httpOnly: true,
            secure: true,
        };
    
        return res.status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};