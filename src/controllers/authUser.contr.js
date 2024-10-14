import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { jwtTokenGenerat } from '../utils/jwtToken.js'; // Adjust the path as necessary

// Register User
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, gender, role = 'user' } = req.body;

    if ([username, email, password, role].some((some) => !some)) {
        throw new ApiError(400, 'All fields are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
       return res.status(400).json(
            new ApiError(400, 'Email is already registered')
        );
    }

    const urlImg = `https://avatar.iran.liara.run/username?username=${username}&bold=false&length=1`;

    const newUser = new User({
        username,
        email,
        password,
        role,
        img: urlImg,
        gender,
    });

    await newUser.save();
    const token = jwtTokenGenerat(res, newUser._id);

    res.status(201).json(
        new ApiResponse(
            201,
            {
                token,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
            'User registered successfully'
        )
    );
});

// LoginUser user
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password, role = 'user' } = req.body;

    if ([email, password].some((data) => !data)) {
        throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email, role });
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const token = jwtTokenGenerat(res, user._id);

    res.status(200).json(
        new ApiResponse(
            200,
            {token, username: user.username, email: user.email, role: user.role },
            'User logged in successfully'
        )
    );
});

// login admin
export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password, role = 'admin' } = req.body;

    if ([email, password].some((data) => !data)) {
        throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email, role });
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials');
    }
    const token = jwtTokenGenerat(res, user._id);

    res.status(200).json(
        new ApiResponse(
            200,
            { token,username: user.username, email: user.email, role: user.role },
            'User logged in successfully'
        )
    );
});

// reLogin user
export const reLoginUser = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.status(200).json(
        new ApiResponse(200, user, 'Session refreshed successfully')
    );
});

// logoutUser
export const logoutUser = asyncHandler((req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
    });
    let token = null

    res.status(200).json(
        new ApiResponse(200, {token}, 'User logged out successfully')
    );
});

export const updateUser = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { username, email, passwordAdmin, gender, role } = req.body;
    const { userId } = req.user;

    if (!userId) {
        throw new ApiError(400, 'User ID is required');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (username) user.username = username;

    if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                error: 'email already use. Please choose another one',
            });
        }
        user.email = email;
    }

    if (gender) user.gender = gender;
    if (role !== 'user') user.role = role;

    if (username) {
        user.img = `https://avatar.iran.liara.run/username?username=${username}&bold=false&length=1`;
    }

    if (passwordAdmin) {
        if (passwordAdmin.length >= 6) {
            user.password = passwordAdmin;
        }
    }

    await user.save();

    res.status(200).json(
        new ApiResponse(
            200,
            {
                username: user.username,
                email: user.email,
                role: user.role,
                img: user.img,
                gender: user.gender,
                status: user.status,
            },
            'User updated successfully'
        )
    );
});
