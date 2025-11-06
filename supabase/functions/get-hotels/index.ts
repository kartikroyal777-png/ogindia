import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Read the Lite API Key from environment variables
const LITE_API_KEY = Deno.env.get('LITE_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure the API key is available
    if (!LITE_API_KEY) {
      throw new Error("LITE_API_KEY is not configured in the server environment variables.");
    }

    // Get parameters from the POST request body
    const { city, checkin, checkout, adults = '1' } = await req.json();
    
    // Amadeus uses IATA codes, we're assuming the user provides this for now.
    const cityCode = city; 
    const checkInDate = checkin;
    const checkOutDate = checkout;

    // Validate required parameters
    if (!cityCode || !checkInDate || !checkOutDate) {
      return new Response(JSON.stringify({ error: true, message: 'Missing required parameters: city, checkin, checkout' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construct the Amadeus API URL
    const url = `https://test.api.amadeus.com/v2/shopping/hotel-offers?cityCode=${encodeURIComponent(cityCode)}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=${adults}&roomQuantity=1&bestRateOnly=true`;
    
    // Fetch data from Amadeus using the Lite API Key (Bearer Token)
    const res = await fetch(url, { 
      headers: { Authorization: `Bearer ${LITE_API_KEY}` } 
    });
    
    // Handle non-successful responses from Amadeus
    if (!res.ok) {
      const text = await res.text();
      console.error("Amadeus API Error:", text);
      const errorDetails = `Amadeus API Error: ${res.status} - ${text}`;
      return new Response(JSON.stringify({ error: true, details: errorDetails }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: res.status });
    }
    
    const data = await res.json();
    
    // Return the successful response
    return new Response(JSON.stringify({ ok: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    // Handle any other errors during execution
    console.error(err);
    return new Response(JSON.stringify({ error: true, message: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
