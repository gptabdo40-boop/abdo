import express from 'express';
import { Product } from '../models/Product.js';

const router = express.Router();

// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      city: req.query.city,
      car_model: req.query.car_model,
      condition: req.query.condition
    };

    const products = await Product.getAll(filters);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new product (requires authentication)
router.post('/', async (req, res) => {
  try {
    const productData = {
      ...req.body,
      seller_id: req.user?.id // Assuming user is attached to request
    };

    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (product.seller_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const updatedProduct = await product.update(req.body);
    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (product.seller_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await product.delete();
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get products by seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const products = await Product.getBySeller(req.params.sellerId);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;