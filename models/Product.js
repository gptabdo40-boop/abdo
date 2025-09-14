import { supabase } from '../config/database.js';

export class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.car_model = data.car_model;
    this.year = data.year;
    this.condition = data.condition;
    this.price = data.price;
    this.city = data.city;
    this.image_url = data.image_url;
    this.seller_id = data.seller_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new product
  static async create(productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) throw error;
      return new Product(data);
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  // Get all products
  static async getAll(filters = {}) {
    try {
      let query = supabase.from('products').select(`
        *,
        users:seller_id (
          id,
          username,
          city
        )
      `);

      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.car_model) {
        query = query.ilike('car_model', `%${filters.car_model}%`);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(product => new Product(product));
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  }

  // Get product by ID
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users:seller_id (
            id,
            username,
            city,
            phone
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? new Product(data) : null;
    } catch (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }
  }

  // Get products by seller
  static async getBySeller(sellerId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(product => new Product(product));
    } catch (error) {
      throw new Error(`Error fetching seller products: ${error.message}`);
    }
  }

  // Update product
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', this.id)
        .select()
        .single();
      
      if (error) throw error;
      Object.assign(this, data);
      return this;
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  // Delete product
  async delete() {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', this.id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }
}