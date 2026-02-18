-- 1. Reset Schema (Optional, be careful)
-- DROP TABLE IF EXISTS course_places, places, courses, locales CASCADE;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS locales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    address TEXT,
    rating DOUBLE PRECISION,
    map_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT,
    locale_id UUID REFERENCES locales(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS course_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    sequence_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Enable RLS
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_places ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allow Public Read & Insert for Dev)
CREATE POLICY "Public Read Locales" ON locales FOR SELECT USING (true);
CREATE POLICY "Public Insert Locales" ON locales FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Places" ON places FOR SELECT USING (true);
CREATE POLICY "Public Insert Places" ON places FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public Insert Courses" ON courses FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read CoursePlaces" ON course_places FOR SELECT USING (true);
CREATE POLICY "Public Insert CoursePlaces" ON course_places FOR INSERT WITH CHECK (true);

-- 5. Insert Seed Data (Seongsu & Yeonnam)
DO $$
DECLARE
    seongsu_id UUID;
    yeonnam_id UUID;
    course1_id UUID;
    course2_id UUID;
    course3_id UUID;
    p1_id UUID; p2_id UUID; p3_id UUID; p4_id UUID; p5_id UUID; p6_id UUID; p7_id UUID; p8_id UUID;
BEGIN
    -- Locales
    INSERT INTO locales (name, description, latitude, longitude)
    VALUES ('성수동', '성수동 힙스터 성지', 37.5445, 127.0561)
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO seongsu_id;

    INSERT INTO locales (name, description, latitude, longitude)
    VALUES ('연남동', '연남동 숲길 산책', 37.5610, 126.9235)
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO yeonnam_id;

    -- Places
    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('대림창고', '카페', '성수동의 상징적인 갤러리 카페', 4.8, 37.5445, 127.0561) RETURNING id INTO p1_id;
    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('온량', '양식', '줄 서서 먹는 성수동 대표 맛집', 4.9, 37.5450, 127.0570) RETURNING id INTO p2_id;
    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('무신사 테라스', '복합문화공간', '패션과 뷰를 한 번에 즐기는 곳', 4.7, 37.5435, 127.0550) RETURNING id INTO p3_id;
    
    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('먼치스앤구디스', '소품샵', '감각적인 라이프스타일 샵', 4.6, 37.5440, 127.0580) RETURNING id INTO p4_id;
    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('누데이크 성수', '카페', '예술적인 디저트를 만나는 공간', 4.8, 37.5435, 127.0550) RETURNING id INTO p5_id;
    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('성수 연방', '복합문화공간', '다양한 브랜드가 모인 큐레이팅 플랫폼', 4.5, 37.5455, 127.0540) RETURNING id INTO p6_id;

    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('연남동 벚꽃집', '카페', '벚꽃이 아름다운 주택 개조 카페', 4.7, 37.5615, 126.9240) RETURNING id INTO p7_id;
    INSERT INTO places (name, category, description, rating, latitude, longitude) VALUES 
    ('소이연남', '태국음식', '태국 현지 느낌 물씬 나는 쌀국수 맛집', 4.6, 37.5605, 126.9230) RETURNING id INTO p8_id;

    -- Courses
    INSERT INTO courses (title, description, theme, locale_id)
    VALUES ('성수동 힙스터 감성 정복', '공장을 개조한 카페부터 숨겨진 파인다이닝까지', 'Hip & Trendy', seongsu_id)
    RETURNING id INTO course1_id;

    INSERT INTO courses (title, description, theme, locale_id)
    VALUES ('붉은 벽돌길 골목 데이트', '아기자기한 소품샵과 조용한 와인 바', 'Romantic & Cozy', seongsu_id)
    RETURNING id INTO course2_id;

    INSERT INTO courses (title, description, theme, locale_id)
    VALUES ('연남동 골목 산책', '경의선 숲길과 아기자기한 연남동 골목의 정취', 'Nature & Relax', yeonnam_id)
    RETURNING id INTO course3_id;

    -- Course Places Link
    INSERT INTO course_places (course_id, place_id, sequence_order) VALUES
    (course1_id, p1_id, 1), (course1_id, p2_id, 2), (course1_id, p3_id, 3),
    (course2_id, p4_id, 1), (course2_id, p5_id, 2), (course2_id, p6_id, 3),
    (course3_id, p7_id, 1), (course3_id, p8_id, 2);

END $$;
