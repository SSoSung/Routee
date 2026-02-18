const { Client } = require('pg');

// mcp_config.json에 있는 주소를 직접 사용합니다.
const connectionString = 'postgresql://postgres:dkvkxm806%21%40@skfsvydgwcntxtmyfaci.supabase.co:5432/postgres';

const sql = `
-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS course_places;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS locales;

-- 2. 테이블 생성
CREATE TABLE locales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    address TEXT,
    rating DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT,
    locale_id UUID REFERENCES locales(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE course_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    sequence_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. 보안 설정
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_places ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (이미 있으면 무시)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Select' AND tablename = 'locales') THEN
        CREATE POLICY "Allow Select" ON locales FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Select' AND tablename = 'places') THEN
        CREATE POLICY "Allow Select" ON places FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Select' AND tablename = 'courses') THEN
        CREATE POLICY "Allow Select" ON courses FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Select' AND tablename = 'course_places') THEN
        CREATE POLICY "Allow Select" ON course_places FOR SELECT USING (true);
    END IF;
END $$;

-- 4. 데이터 삽입 로직
DO $$
DECLARE
    seongsu_id UUID;
    course_id UUID;
    p1 UUID; p2 UUID; p3 UUID;
BEGIN
    INSERT INTO locales (name, description, latitude, longitude)
    VALUES ('성수동', '힙스터들의 성지 성수동 코스', 37.5445, 127.0561)
    RETURNING id INTO seongsu_id;

    INSERT INTO courses (title, description, theme, locale_id)
    VALUES ('성수동 감성 데이트', '갤러리 카페부터 줄 서는 맛집까지', 'Hip & Trendy', seongsu_id)
    RETURNING id INTO course_id;

    INSERT INTO places (name, category, description, rating, latitude, longitude)
    VALUES ('대림창고', '카페', '압도적인 규모의 갤러리 카페', 4.8, 37.5445, 127.0561) RETURNING id INTO p1;
    INSERT INTO places (name, category, description, rating, latitude, longitude)
    VALUES ('온량', '레스토랑', '성수동 필수 코스 양식당', 4.9, 37.5450, 127.0570) RETURNING id INTO p2;
    INSERT INTO places (name, category, description, rating, latitude, longitude)
    VALUES ('누데이크', '카페', '예술적인 디저트가 있는 곳', 4.7, 37.5435, 127.0550) RETURNING id INTO p3;

    INSERT INTO course_places (course_id, place_id, sequence_order) VALUES
    (course_id, p1, 1), (course_id, p2, 2), (course_id, p3, 3);
END $$;
`;

async function setup() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Supabase via Postgres protocol.');
        await client.query(sql);
        console.log('✅ DB Setup Successfully completed!');
    } catch (err) {
        console.error('❌ Error during DB setup:', err);
    } finally {
        await client.end();
    }
}

setup();
