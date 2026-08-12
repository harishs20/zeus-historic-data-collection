import { supabase } from '../lib/supabase';
import { Employee } from '../types/database';

export const employeeService = {
  async getEmployeeById(id: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Employee record not found for this user.');
      }
      throw new Error(`Failed to fetch employee: ${error.message}`);
    }
    
    if (!data.is_active) {
      throw new Error('This employee account is inactive.');
    }
    
    return data as Employee;
  },

  async getAllEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');
      
    if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
    return data as Employee[];
  }
};
