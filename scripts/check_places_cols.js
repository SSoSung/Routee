const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlaces() {
    const { data, error } = await supabase.from('places').select('*').limit(1);
    if (error) console.error(error);
    else console.log('Places columns:', Object.keys(data[0] || {}));
}

checkPlaces();
