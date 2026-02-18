const { Client } = require('pg');

// mcp_config.json에 있는 주소를 직접 사용합니다.
const connectionString = 'postgresql://postgres:dkvkxm806%21%40@skfsvydgwcntxtmyfaci.supabase.co:5432/postgres';

const sql = `
DO $$
BEGIN
    -- theme 컬럼이 있다면 themes로 데이터 이관 (혹은 그냥 둡니다)
    -- themes 컬럼 추가 (TEXT 배열)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='themes') THEN
        ALTER TABLE courses ADD COLUMN themes TEXT[];
    END IF;
END $$;
`;

async function setup() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Supabase via Postgres protocol.');
        await client.query(sql);
        console.log('✅ Added "themes" column successfully!');
    } catch (err) {
        console.error('❌ Error during migration:', err);
    } finally {
        await client.end();
    }
}

setup();
