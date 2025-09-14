import { supabase } from '../config/database.js';

export class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.phone = data.phone;
    this.city = data.city;
    this.user_type = data.user_type;
    this.subscription_plan = data.subscription_plan;
    this.subscription_end = data.subscription_end;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new user
  static async create(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return new User(data);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Get user by email
  static async getByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? new User(data) : null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Get user by ID
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? new User(data) : null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Update user
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', this.id)
        .select()
        .single();
      
      if (error) throw error;
      Object.assign(this, data);
      return this;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Update subscription
  async updateSubscription(plan, endDate) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          subscription_plan: plan,
          subscription_end: endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();
      
      if (error) throw error;
      this.subscription_plan = data.subscription_plan;
      this.subscription_end = data.subscription_end;
      return this;
    } catch (error) {
      throw new Error(`Error updating subscription: ${error.message}`);
    }
  }

  // Check if subscription is active
  isSubscriptionActive() {
    if (!this.subscription_end) return false;
    return new Date(this.subscription_end) > new Date();
  }
}