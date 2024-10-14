import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    postalCode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    contacts: {
        type: String,
        required: true,
    },
    apartmentNumber: {
        type: String,
        required: false,
    },
    landmark: {
        type: String,
        required: false,
    },
})

export const Address = mongoose.model('Address', addressSchema)
