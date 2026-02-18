const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count, error } = await supabase.from('locales').select('*', { count: 'exact', head: true });
    if (error) {
        console.error('Error checking DB:', error);
    } else {
        console.log(`Found ${count || 0} locales.`);
        if (count === 0) {
            console.log('Database seems empty. Did you run the SQL script?');
        } else {
            console.log('Database populated successfully!');
        }
    }
}

check();
