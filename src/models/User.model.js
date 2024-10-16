import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        img: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female'],
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'blocke'],
            default: 'active',
            required: true,
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            required: true,
            default: 'user',
        },
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
        },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

export const User = mongoose.model('User', userSchema);
