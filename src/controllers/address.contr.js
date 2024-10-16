import { Address } from '../models/Address.model.js';
import { User } from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Create or Update Address
export const createOrUpdateAddress = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const {
        street,
        city,
        state,
        postalCode,
        country,
        contacts,
        apartmentNumber,
        landmark,
    } = req.body;

    // Validate required fields using some()
    if (
        [street, city, state, postalCode, country, contacts].some(
            (data) => !data
        )
    ) {
        throw new ApiError(400, 'All required fields must be filled.');
    }

    // Check if the user exists
    const user = await User.findById(userId).populate('address');
    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    if (!user.address) {
        // If the user doesn't have an address, create a new one
        const newAddress = await Address.create({
            street,
            city,
            state,
            postalCode,
            country,
            contacts,
            apartmentNumber,
            landmark,
        });

        // Associate the new address ID with the user
        user.address = newAddress._id;
        await user.save();

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newAddress,
                    'Address created and linked to user successfully'
                )
            );
    } else {
        // If the user already has an address, update it
        const updatedAddress = await Address.findByIdAndUpdate(
            user?.address._id,
            {
                street: street || user?.address.street,
                city: city || user?.address.city,
                state: state || user?.address.state,
                postalCode: postalCode || user?.address.postalCode,
                country: country || user?.address.country,
                contacts: contacts || user?.address.contacts,
                apartmentNumber:
                    apartmentNumber || user?.address.apartmentNumber,
                landmark: landmark || user?.address.landmark,
            },
            { new: true }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedAddress,
                    'Address updated successfully'
                )
            );
    }
});