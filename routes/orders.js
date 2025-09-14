import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const { items, shipping_address, phone, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.getById(item.product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create order
    const orderData = {
      user_id: userId,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address,
      phone,
      notes
    };

    const order = await Order.create(orderData);
    
    // Add order items
    await order.addItems(orderItems);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user orders
router.get('/my-orders', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const orders = await Order.getByUser(userId);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.getById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is the seller of any item
    const userId = req.user?.id;
    const isOwner = order.user_id === userId;
    const isSeller = order.order_items?.some(item => 
      item.products?.seller_id === userId
    );

    if (!isOwner && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update order status (sellers only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.getById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is seller of any item in the order
    const userId = req.user?.id;
    const isSeller = order.order_items?.some(item => 
      item.products?.seller_id === userId
    );

    if (!isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can update order status'
      });
    }

    const updatedOrder = await order.updateStatus(status);
    
    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;