import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
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
    // Create Supabase client with anon key (like the frontend does)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Try to login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'super@sears.com',
      password: '123'
    });

    if (authError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: authError.message,
          code: authError.code || 'unknown',
          status: authError.status || 0,
          details: JSON.stringify(authError)
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

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No user returned'
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login exitoso',
        authUser: {
          id: authData.user.id,
          email: authData.user.email,
          email_confirmed_at: authData.user.email_confirmed_at
        },
        profile: profile,
        profileError: profileError ? JSON.stringify(profileError) : null
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
        stack: error instanceof Error ? error.stack : undefined
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
});