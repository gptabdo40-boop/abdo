import { supabase } from '../config/database.js';

export class Order {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.total_amount = data.total_amount;
    this.status = data.status;
    this.shipping_address = data.shipping_address;
    this.phone = data.phone;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new order
  static async create(orderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (error) throw error;
      return new Order(data);
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }

  // Get orders by user
  static async getByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(order => new Order(order));
    } catch (error) {
      throw new Error(`Error fetching user orders: ${error.message}`);
    }
  }

  // Get order by ID
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              id,
              name,
              image_url,
              seller_id
            )
          ),
          users (
            username,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? new Order(data) : null;
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }
  }

  // Update order status
  async updateStatus(status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();
      
      if (error) throw error;
      this.status = data.status;
      return this;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }

  // Add order items
  async addItems(items) {
    try {
      const orderItems = items.map(item => ({
        order_id: this.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { data, error } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error adding order items: ${error.message}`);
    }
  }
}