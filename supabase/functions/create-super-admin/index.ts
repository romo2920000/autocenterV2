import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if super admin already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('email', 'super@sears.com')
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Super Admin ya existe',
          user: existingProfile,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'super@sears.com',
      password: '123',
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Error creando usuario auth: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: 'super@sears.com',
        full_name: 'Super Administrador',
        role: 'super_admin',
        is_active: true,
      });

    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error creando perfil: ${profileError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Super Admin creado exitosamente',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});