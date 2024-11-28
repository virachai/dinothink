import Cart from '../models/Cart.js'; // Assuming a Cart model
import Product from '../models/Product.js'; // Assuming a Product model
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes'; // For better status codes

// Helper function to get the cart for a user
const getCartForUser = async (userId) => {
  return await Cart.findOne({ _id: userId }).populate('items.product');
};

// Helper function to get a product by ID
const getProductById = async (productId) => {
  return await Product.findById(productId);
};

// Helper function to handle session transactions
const startSessionAndTransaction = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  return session;
};

// Add item to the cart
const addItemToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  if (!productId || !quantity || quantity <= 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid productId or quantity' });
  }

  try {
    // Check if the product exists
    const product = await getProductById(productId);
    if (!product) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Product not found' });
    }

    const session = await startSessionAndTransaction();

    let cart = await getCartForUser(userId);
    if (!cart) {
      cart = new Cart({ _id: userId, items: [] });
    }

    // Find the index of the product in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if the product already exists in the cart
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to the cart
      cart.items.push({ product: productId, quantity });
    }

    await cart.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Return the populated cart after update
    return res
      .status(StatusCodes.OK)
      .json(await Cart.findById(cart._id).populate('items.product'));
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Server error' });
  }
};

// Get the user's cart
const getCart = async (req, res) => {
  const userId = req.user._id;
  //   if (!userId || userId) {
  //     return res
  //       .status(StatusCodes.OK)
  //       .json({ message: JSON.stringify(req.user) });
  //   }

  try {
    const cart = await getCartForUser(userId);

    if (!cart || cart.items.length === 0) {
      return res.status(StatusCodes.OK).json({ message: 'Cart is empty' });
    }

    return res.status(StatusCodes.OK).json(cart);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Server error' });
  }
};

// Update item quantity in the cart
const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  if (!productId || !quantity || quantity <= 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid productId or quantity' });
  }

  try {
    const cart = await getCartForUser(userId);

    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Item not found in the cart' });
    }

    // Update item quantity in the cart
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Return the updated populated cart
    return res
      .status(StatusCodes.OK)
      .json(await Cart.findById(cart._id).populate('items.product'));
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Server error' });
  }
};

// Remove item from cart
const removeItemFromCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  try {
    const cart = await getCartForUser(userId);

    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Item not found in the cart' });
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Return the updated populated cart
    return res
      .status(StatusCodes.OK)
      .json(await Cart.findById(cart._id).populate('items.product'));
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Server error' });
  }
};

// Clear the cart
const clearCart = async (req, res) => {
  const userId = req.user._id;

  try {
    const cart = await Cart.findOneAndUpdate(
      { _id: userId },
      { $set: { items: [] } },
      { new: true }
    );

    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Cart not found' });
    }

    // Return the cleared cart
    return res.status(StatusCodes.OK).json(cart);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Server error' });
  }
};

export {
  addItemToCart,
  getCart,
  updateCartItem,
  removeItemFromCart,
  clearCart
};
