const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_info', { t_name: 'course_places' });
    if (error) {
        // If RPC fails, try generic query
        const { data: cols, error: colError } = await supabase
            .from('course_places')
            .select('*')
            .limit(1);

        if (colError) console.error('Error:', colError);
        else console.log('Sample data:', data);

        // Check columns via SQL
        const { data: columns, error: cErr } = await supabase.rpc('exec_sql', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'course_places'" });
        console.log('Columns:', columns);
    } else {
        console.log('Table info:', data);
    }
}

checkSchema();
