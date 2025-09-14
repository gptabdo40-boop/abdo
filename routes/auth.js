import express from 'express';
import { User } from '../models/User.js';
import { supabase } from '../config/database.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, city, user_type = 'buyer' } = req.body;

    // Check if user already exists
    const existingUser = await User.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Create user profile
    const userData = {
      id: authData.user.id,
      username,
      email,
      phone,
      city,
      user_type,
      subscription_plan: user_type === 'seller' ? 'free' : null,
      subscription_end: user_type === 'seller' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
    };

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      data: {
        user,
        session: authData.session
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Get user profile
    const user = await User.getById(data.user.id);

    res.json({
      success: true,
      data: {
        user,
        session: data.session
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const userProfile = await User.getById(user.id);
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const userProfile = await User.getById(user.id);
    const updatedUser = await userProfile.update(req.body);
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;