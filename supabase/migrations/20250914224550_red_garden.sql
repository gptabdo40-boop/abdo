/*
  # خُردة - متجر قطع السيارات الإلكتروني
  
  ## نظرة عامة
  هذا الملف يحتوي على إعداد قاعدة البيانات الكاملة لمتجر خُردة الإلكتروني
  
  ## الجداول المُنشأة:
  1. **users** - معلومات المستخدمين (مشترين وتجار)
  2. **products** - منتجات قطع السيارات
  3. **orders** - طلبات الشراء
  4. **order_items** - تفاصيل المنتجات في كل طلب
  5. **messages** - رسائل العملاء للتجار
  6. **analytics** - إحصائيات النشاط
  
  ## الأمان:
  - تم تفعيل Row Level Security على جميع الجداول
  - سياسات أمان مخصصة لكل نوع مستخدم
  - حماية البيانات الشخصية والتجارية
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  city text,
  user_type text NOT NULL DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller')),
  subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free', 'bronze', 'silver', 'gold')),
  subscription_end timestamptz,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  car_model text NOT NULL,
  year integer,
  condition text NOT NULL CHECK (condition IN ('جديدة', 'شبه جديدة', 'ممتازة', 'جيد جداً', 'نظيف جداً', 'مستعملة')),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  city text NOT NULL,
  image_url text,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address text NOT NULL,
  phone text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

-- Messages table (for customer inquiries)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  sender_name text,
  sender_phone text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Analytics table (for tracking views and interactions)
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('view', 'contact', 'add_to_cart')),
  ip_address inet,
  user_agent text,
  city text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public can read seller profiles"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (user_type = 'seller' AND is_active = true);

-- Products policies
CREATE POLICY "Anyone can view available products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Sellers can manage own products"
  ON products
  FOR ALL
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can view orders for their products"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.seller_id = auth.uid()
    )
  );

-- Order items policies
CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can view order items for their products"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = order_items.product_id AND p.seller_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages sent to them"
  ON messages
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() OR sender_id IS NULL);

CREATE POLICY "Recipients can update message read status"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- Analytics policies
CREATE POLICY "Anyone can insert analytics"
  ON analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view analytics for their products"
  ON analytics
  FOR SELECT
  TO authenticated
  USING (
    product_id IS NULL OR
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = analytics.product_id AND p.seller_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_city ON products(city);
CREATE INDEX IF NOT EXISTS idx_products_car_model ON products(car_model);
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment product views
CREATE OR REPLACE FUNCTION increment_product_views(product_uuid uuid)
RETURNS void AS $$
BEGIN
    UPDATE products 
    SET views_count = views_count + 1 
    WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data (for development/testing)
DO $$
BEGIN
    -- Insert sample users (only if they don't exist)
    INSERT INTO users (id, username, email, phone, city, user_type, subscription_plan)
    VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'محمود العبيدي', 'mahmoud@example.com', '0912345678', 'طرابلس', 'seller', 'gold'),
        ('550e8400-e29b-41d4-a716-446655440002', 'أحمد السراج', 'ahmed@example.com', '0923456789', 'بنغازي', 'seller', 'silver'),
        ('550e8400-e29b-41d4-a716-446655440003', 'فاطمة الزهراء', 'fatima@example.com', '0934567890', 'مصراتة', 'buyer', NULL)
    ON CONFLICT (email) DO NOTHING;

    -- Insert sample products
    INSERT INTO products (name, description, car_model, year, condition, price, city, image_url, seller_id)
    VALUES 
        ('دينمو - مرسيدس C180', 'دينمو أصلي في حالة ممتازة، تم فحصه وصيانته', 'مرسيدس C180', 2015, 'ممتازة', 500.00, 'طرابلس', 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg', '550e8400-e29b-41d4-a716-446655440001'),
        ('كمبروسر - كيا سورينتو', 'كمبروسر تكييف بحالة جيدة جداً', 'كيا سورينتو', 2017, 'جيد جداً', 750.00, 'طرابلس', 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg', '550e8400-e29b-41d4-a716-446655440001'),
        ('بطارية - هيونداي إلنترا', 'بطارية شبه جديدة، استخدام قليل', 'هيونداي إلنترا', 2018, 'شبه جديدة', 250.00, 'بنغازي', 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg', '550e8400-e29b-41d4-a716-446655440002'),
        ('ردياتير - تويوتا ياريس', 'ردياتير نظيف ومفحوص', 'تويوتا ياريس', 2016, 'نظيف جداً', 300.00, 'بنغازي', 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg', '550e8400-e29b-41d4-a716-446655440002')
    ON CONFLICT DO NOTHING;

EXCEPTION
    WHEN others THEN
        -- Ignore errors if users don't exist (in case auth.uid() is not available)
        NULL;
END $$;