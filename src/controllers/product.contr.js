import asyncHandler from '../utils/asyncHandler.js';
import { Product } from '../models/Product.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import CloudinaryService from '../utils/cloudinary.js';
// Create product
export const createProduct = asyncHandler(async (req, res) => {
    console.log(req.body, req.files); // Log the request body and files for debugging

    const {
        name,
        price,
        description,
        category,
        stock,
        discount,
        marketPrice,
        available,
        colors,
        flavors,
        brand,
        size,
        material,
        occasion,
    } = req.body;

    // Validate required fields
    if (
        [
            name,
            price,
            description,
            category,
            stock,
            discount,
            marketPrice,
            brand
        ].some((field) => !field)
    ) {
        throw new ApiError(400, 'All fields are required, including brand, colors, and size.');
    }

    // Check for image uploads
    if (!req.files || req?.files?.length === 0) {
        throw new ApiError(400, 'At least one image is required.');
    }

    let uploadedImages;

    // Handle image uploads
    if (req.files?.length > 0) {
        if (req.files?.length > 1) {
            uploadedImages = await CloudinaryService.uploadMultipleImages(
                req.files?.map((file) => file.path)
            );
        } else {
            const singleFilePath = req.files[0].path;
            uploadedImages = [await CloudinaryService.uploadImage(singleFilePath)];
        }
    } else {
        throw new ApiError(400, 'At least one image is required.');
    }

    const colorsArray = Array?.isArray(colors) ? colors : colors?.split(',')?.map(color => color?.trim());
    const flavorsArray = flavors ? (Array?.isArray(flavors) ? flavors : flavors?.split(',')?.map(flavor => flavor?.trim())) : [];
    
    const newProduct = new Product({
        name,
        price,
        description,
        category,
        stock,
        discount,
        marketPrice,
        available,
        images: uploadedImages,
        colors: colorsArray,
        flavors: flavorsArray,
        brand,
        // Only add size, material, and occasion if they are provided
        ...(size && { size: Array?.isArray(size) ? size?.map(s => s?.trim()) : size?.split(',')?.map(s => s.trim()) }),
        ...(material && { material }),
        ...(occasion && { occasion: Array?.isArray(occasion) ? occasion?.map(o => o.trim()) : occasion?.split(',')?.map(o => o.trim()) }),
    });

    await newProduct.save();

    res.status(201).json(
        new ApiResponse(201, newProduct, 'Product created successfully')
    );
});



// Get product
export const getProduct = asyncHandler(async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, products, 'Products retrieved successfully')
    );
});


export const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(imageUrl => {
            const publicId = extractPublicIdFromUrl(imageUrl);
            return CloudinaryService.deleteImage(publicId);
        });
        await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json(
        new ApiResponse(200, null, 'Product deleted successfully')
    );
});
// Update product
export const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const {
        name,
        price,
        description,
        category,
        stock,
        discount,
        marketPrice,
        available,
        colors,
        flavors,
        brand,
        size,
        material,
        occasion,
    } = req.body;

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
        throw new ApiError(404, 'Product not found');
    }

    // Check for required fields
    if (
        [
            name,
            price,
            description,
            category,
            stock,
            discount,
            marketPrice,
        ].some((field) => !field)
    ) {
        throw new ApiError(400, 'All fields are required, including brand, colors, and size.');
    }

    const colorsArray = Array.isArray(colors) ? colors : colors.split(',').map(color => color.trim());
    const flavorsArray = flavors ? (Array.isArray(flavors) ? flavors : flavors.split(',').map(flavor => flavor.trim())) : [];

    const updateData = {
        name,
        price,
        description,
        category,
        stock,
        discount,
        marketPrice,
        available,
        colors: colorsArray,
        flavors: flavorsArray,
        brand: brand || existingProduct.brand,
        // Only add size, material, and occasion if they are provided
        ...(size && { size: Array.isArray(size) ? size.map(s => s.trim()) : size.split(',').map(s => s.trim()) }),
        ...(material && { material: material || existingProduct.material }),
        ...(occasion && { occasion: Array.isArray(occasion) ? occasion.map(o => o.trim()) : occasion.split(',').map(o => o.trim()) }),
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
        if (existingProduct.images && existingProduct.images.length > 0) {
            const deletePromises = existingProduct.images.map(imageUrl => {
                const publicId = extractPublicIdFromUrl(imageUrl);
                return CloudinaryService.deleteImage(publicId);
            });
            await Promise.all(deletePromises);
        }

        let uploadedImages;
        if (req.files.length > 1) {
            uploadedImages = await CloudinaryService.uploadMultipleImages(
                req.files.map(file => file.path)
            );
        } else {
            const singleFilePath = req.files[0].path;
            uploadedImages = [await CloudinaryService.uploadImage(singleFilePath)];
        }

        updateData.images = uploadedImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json(
        new ApiResponse(200, updatedProduct, 'Product updated successfully')
    );
});

// Helper function to extract public ID from Cloudinary image URL
const extractPublicIdFromUrl = (url) => {
    const segments = url.split('/');
    const lastSegment = segments.pop();
    const publicId = lastSegment.split('.')[0];
    return publicId;
};






// Get product by ID
export const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    res.status(200).json(
        new ApiResponse(200, product, 'Product retrieved successfully')
    );
});





// Search products with a single input query across all relevant fields, including price or marketPrice
export const searchProducts = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const searchCriteria = {};

    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };

        searchCriteria.$or = [
            { name: searchRegex },        
            { description: searchRegex },
            { category: searchRegex },
            { available: searchRegex },
            { discount: Number(search) ? { $gte: Number(search) } : undefined },
            { stock: Number(search) ? { $gte: Number(search) } : undefined },
        ];

        if (!isNaN(Number(search))) {
            searchCriteria.$or.push(
                { price: { $gte: Number(search) } },
                { marketPrice: { $gte: Number(search) } }
            );
        }

        searchCriteria.$or = searchCriteria.$or.filter(criteria => criteria !== undefined);
    }

    try {
        const products = await Product.aggregate([
            { $match: searchCriteria },
            { $sample: { size: 5 } }
        ]);

        res.status(200).json({
            success: true,
            products,
            message: 'Random products retrieved successfully based on search criteria',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: error.message,
        });
    }
});




// Search products with a single input query across the category field
export const searchCategory = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const searchCriteria = {};

    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        searchCriteria.category = searchRegex;
    }

    try {
        const products = await Product.aggregate([
            { $match: searchCriteria },
            { $sample: { size: 5 } } 
        ]);

        res.status(200).json({
            success: true,
            products,
            message: 'Random products retrieved successfully based on category search',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: error.message,
        });
    }
});