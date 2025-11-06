/*
  # Add address and order fields

  1. Changes to `customers` table
    - Add `razon_social` (text) - Business name for invoicing
    - Add `colonia` (text) - Neighborhood/colony
    - Add `estado` (text) - State
    - Add `codigo_postal` (text) - Postal code

  2. Changes to `orders` table
    - Add `technician_number` (text) - Technician employee number
    - Add `purchase_order_number` (text) - Purchase order number for tracking

  3. Notes
    - All new columns are nullable to maintain compatibility with existing data
    - These fields enhance customer address information and order tracking
*/

-- Add address fields to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'razon_social'
  ) THEN
    ALTER TABLE customers ADD COLUMN razon_social text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'colonia'
  ) THEN
    ALTER TABLE customers ADD COLUMN colonia text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'estado'
  ) THEN
    ALTER TABLE customers ADD COLUMN estado text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'codigo_postal'
  ) THEN
    ALTER TABLE customers ADD COLUMN codigo_postal text;
  END IF;
END $$;

-- Add tracking fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'technician_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN technician_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'purchase_order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN purchase_order_number text;
  END IF;
END $$;
