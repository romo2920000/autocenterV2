import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get supabaseUrl(): string {
    return environment.supabaseUrl;
  }

  get supabaseAnonKey(): string {
    return environment.supabaseAnonKey;
  }

  async validateSupplier(rfc: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('id, rfc, is_active')
      .eq('rfc', rfc)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error validating supplier:', error);
      return false;
    }

    return data !== null;
  }

  async getSupplierByRFC(rfc: string) {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('rfc', rfc)
      .maybeSingle();

    if (error) {
      console.error('Error getting supplier:', error);
      return null;
    }

    return data;
  }
}
