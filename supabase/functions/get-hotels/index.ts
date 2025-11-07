import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { city, checkIn, checkOut, adults } = await req.json();
    const apiKey = Deno.env.get('LITE_API_KEY');

    if (!apiKey) {
      console.error('LITE_API_KEY is not set in Supabase environment variables.');
      return new Response(
        JSON.stringify({
          error: 'Hotel API key is not configured on the server. Please contact support or the site administrator.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const apiUrl = `https://engine.liteapi.travel/api/v2.0/search?city=${city}&checkin=${checkIn}&checkout=${checkOut}&adults=${adults}&currency=USD&country=US`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Hotel API request failed:', errorData);
      throw new Error(`Hotel API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing hotel search request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
