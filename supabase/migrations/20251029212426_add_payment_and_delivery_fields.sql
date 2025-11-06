/*
  # Agregar campos de pago y entrega a orders

  1. Nuevos Campos
    - `payment_status`: Estado del pago (pending, paid, partial)
    - `amount_paid`: Cantidad pagada por el cliente
    - `paid_at`: Fecha y hora del pago
    - `paid_by`: Usuario que registró el pago
    - `delivery_status`: Estado de entrega (pending, delivered)
    - `delivered_at`: Fecha y hora de entrega
    - `delivered_by`: Usuario que registró la entrega

  2. Notas
    - payment_status por defecto es 'pending'
    - delivery_status por defecto es 'pending'
    - amount_paid por defecto es 0
*/

-- Agregar campos de pago
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
    ALTER TABLE orders ADD CONSTRAINT check_payment_status 
      CHECK (payment_status IN ('pending', 'paid', 'partial'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE orders ADD COLUMN amount_paid numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN paid_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'paid_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN paid_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Agregar campos de entrega
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_status text DEFAULT 'pending';
    ALTER TABLE orders ADD CONSTRAINT check_delivery_status 
      CHECK (delivery_status IN ('pending', 'delivered'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivered_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_by uuid REFERENCES auth.users(id);
  END IF;
END $$;