import asyncHandler from '../utils/asyncHandler.js'
import { Cart } from '../models/Cart.model.js'
import { Product } from '../models/Product.model.js'
import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponse.js'

export const createCart = asyncHandler(async (req, res) => {

    const { productId, quantity } = req.body
    const { userId } = req.user

    if (
        [productId, quantity].some(
            (data) => data === undefined || data === null
        )
    ) {
        throw new ApiError(
            400,
            'All fields are required: productId and quantity.'
        )
    }

    const product = await Product.findById(productId)
    if (!product) {
        throw new ApiError(404, 'Product not found.')
    }

    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
        cart = new Cart({
            user: userId,
            products: [{ productId, quantity }],
        })
    } else {
        const existingProduct = cart.products.find(
            (item) => item.productId.toString() === productId.toString()
        )

        if (existingProduct) {
            existingProduct.quantity = quantity
        } else {
            cart.products.push({ productId, quantity })
        }
    }
    await cart.save()
    res.status(201).json(
        new ApiResponse(201, cart, 'Product added to cart successfully')
    )
})

// getCart 
export const getCart = asyncHandler(async (req, res) => {
    const { userId } = req.user

    const cart = await Cart.findOne({ user: userId })
        .populate({
            path: 'products.productId',
            select: '-stack',
        })
        .sort({ createdAt: -1 }) 
        .select('-user')

    if (!cart) {
        throw new ApiError(404, 'Cart not found')
    }

    let totalAmount = 0
    let totalDiscountAmount = 0

    const modifiedProducts = cart?.products?.map((item) => {
        const price = item?.productId?.price
        const quantity = item?.quantity
        const discount = item?.productId?.discount || 0
        const totalPrice = price * quantity

        const discountAmount = (price * discount) / 100
        const discountedPrice = price - discountAmount
        const totalDiscountedPrice = discountedPrice * quantity

        totalAmount += totalPrice
        totalDiscountAmount += discountAmount * quantity

        return {
            ...item.toObject(),
            totalPrice,
            totalDiscountedPrice,
            discountAmount: discountAmount * quantity,
        }
    })

    const cartWithTotals = {
        ...cart.toObject(),
        products: modifiedProducts,
        totalAmount,
        totalDiscountAmount,
        totalDiscountedAmount: totalAmount - totalDiscountAmount,
    }

    res.status(200).json(
        new ApiResponse(200, cartWithTotals, 'Cart retrieved successfully')
    )
})

// Remove a product from the cart
export const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params
    const { userId } = req.user
    
    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
        throw new ApiError(404, 'Cart not found')
    }
    
    const productIndex = cart.products.findIndex(
        (item) => item.productId.toString() === productId
    )
    
    if (productIndex === -1) {
        throw new ApiError(404, 'Product not found in cart')
    }

    cart.products.splice(productIndex, 1)

    await cart.save()

    res.status(200).json(
        new ApiResponse(200, cart, 'Product removed from cart successfully')
    )
})