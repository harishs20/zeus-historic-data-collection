-- Migration to add optional description column to historical_hours_entries table
ALTER TABLE historical_hours_entries 
ADD COLUMN IF NOT EXISTS description TEXT NULL;
