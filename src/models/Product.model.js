import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                'Uncategorized',
                'Electronics',
                'Fashion',
                'Sports & Outdoors',
                'Home & Kitchen',
                'Beauty & Personal Care',
                'Books',
                'Automotive',
                'Toys & Games',
                'Jewelry & Watches',
                'Health & Wellness',
                'Office Supplies',
                'Pet Supplies',
                'Music Instruments',
                'Groceries',
                'Furniture',
                'Outdoor & Garden',
                'Baby Products',
                'Fitness Equipment',
                'Gaming',
                'Stationery',
                'Software',
                'Tools & Hardware',
                'Craft Supplies',
                'Travel Accessories',
                'Smart Home Devices',
                'Clothing',
                'Shoes',
                'Watches',
                'Luggage',
                'Appliances',
                'Home Improvement',
                'Photography Equipment',
                'Art Supplies',
                'Collectibles',
                'Seasonal Products',
                'Gift Cards',
                'Camping & Hiking Gear',
                'Fishing Gear',
                'Cycling Accessories',
                'Yoga & Pilates',
                'Skincare Products',
                'Hair Care Products',
                'Nail Care Products',
                'Sunglasses',
                'Phone Accessories',
                'Computer Accessories',
                'Networking Equipment',
                'Virtual Reality Gear',
                'DIY Tools',
                'Electronics Accessories',
                'Fire Safety Equipment',
                'Kitchen Appliances',
                'Outdoor Furniture',
                'Bedding & Linens',
                'Cleaning Supplies',
                'Gardening Tools',
                'Smartwatch Accessories',
                'Home Security Systems',
                'Musical Instruments Accessories',
                'Exercise & Fitness Apps',
                'Dance & Performance Gear',
                'Sports Apparel',
                'Camping Cooking Gear',
                'Bicycle Accessories',
                'Personal Fitness Trainers',
                'Electric Scooters',
                'Lawn Care Equipment',
                'Hobby & Model Kits',
                'Travel Bags & Backpacks',
                'Party Supplies',
                'Wedding Supplies',
                'Home Decor',
                'Smartphone Cases',
                'Virtual Classes & Workshops',
                'Meditation & Mindfulness Tools',
                'Luxury Goods',
                'Electronics Repair Tools',
                'Motorcycle Gear',
                'DIY Craft Kits',
                'Paint & Painting Supplies',
                'Graphic Design Tools',
                'Childrens Educational Toys',
                'Board Games',
                'Puzzles & Brain Teasers',
                'Subscription Boxes',
                'Gourmet Food & Snacks',
                'Fitness Wearables',
            ],
            required: true,
            default: 'Uncategorized',
        },
        stock: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        price: {
            type: Number,
            required: true,
        },
        marketPrice: {
            type: Number,
        },
        discount: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        images: {
            type: [String],
            required: true,
        },
        colors: {
            type: [String],
            required: true,
        },
        flavors: {
            type: String,
        },
        brand: {
            type: String,
            required: true,
        },
        available: {
            type: String,
            enum: ['in stock', 'out of stock', 'pre-order'],
            required: true,
            default: 'in stock',
        },
        size: {
            type: [String],
            enum: ['S', 'M', 'L', 'XL', 'XXL'],
        },
        material: {
            type: String,
        },
        occasion: {
            type: [String],
        },
    },
    { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
