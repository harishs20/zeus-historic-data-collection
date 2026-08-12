import { supabase } from '../lib/supabase';
import { Project, Building, Discipline, WorkPackage } from '../types/database';

export const masterDataService = {
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('project_name');
    if (error) throw new Error(error.message);
    return data;
  },

  async getBuildings(): Promise<Building[]> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('is_active', true)
      .order('building_name');
    if (error) throw new Error(error.message);
    return data;
  },

  async getDisciplines(): Promise<Discipline[]> {
    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .order('discipline_name');
    if (error) throw new Error(error.message);
    return data;
  },

  async getWorkPackages(): Promise<WorkPackage[]> {
    const { data, error } = await supabase
      .from('work_packages')
      .select('*')
      .eq('is_active', true)
      .order('package_name');
    if (error) throw new Error(error.message);
    return data;
  }
};
