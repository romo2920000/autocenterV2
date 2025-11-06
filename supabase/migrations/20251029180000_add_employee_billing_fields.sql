/*
  # Add Employee Billing Fields

  1. New Columns
    - `is_employee` (boolean) - Indicates if customer is an employee (10% discount)
    - `employee_number` (text) - Employee identification number
    - `employee_discount_amount` (numeric) - Amount of employee discount applied
    - `final_total` (numeric) - Final total after discounts

  2. Notes
    - All new columns are nullable for backward compatibility
    - Employee discount is 10% of the grand total
    - These fields enable employee discount tracking and billing
*/

-- Add employee billing fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_employee'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_employee boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'employee_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN employee_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'employee_discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN employee_discount_amount numeric(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'final_total'
  ) THEN
    ALTER TABLE orders ADD COLUMN final_total numeric(10, 2);
  END IF;
END $$;
