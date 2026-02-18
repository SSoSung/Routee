# 🚀 데이터베이스 초기화 안내

현재 데이터베이스가 비어 있어 화면에 아무것도 나오지 않을 수 있습니다.
보안 설정으로 인해 제가 직접 데이터를 넣을 수 없으므로, 아래 SQL을 **Supabase SQL Editor**에서 실행해 주세요!

## 실행 방법
1. **Supabase 대시보드** 접속
2. 좌측 메뉴 **SQL Editor** 클릭
3. **New Query** 클릭
4. 아래 내용을 복사 & 붙여넣기 후 **Run** 버튼 클릭

```sql
-- 1. 테이블 생성
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

-- 2. RLS(보안) 설정 및 정책 추가
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_places ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있도록 허용 (개발용)
CREATE POLICY "Public Read Locales" ON locales FOR SELECT USING (true);
CREATE POLICY "Public Read Places" ON places FOR SELECT USING (true);
CREATE POLICY "Public Read Courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public Read CoursePlaces" ON course_places FOR SELECT USING (true);

-- 3. 데이터 삽입 (성수동, 연남동)
DO $$
DECLARE
    seongsu_id UUID;
    yeonnam_id UUID;
    course1_id UUID;
    course2_id UUID;
    course3_id UUID;
    p1_id UUID; p2_id UUID; p3_id UUID; p4_id UUID; p5_id UUID; p6_id UUID; p7_id UUID; p8_id UUID;
BEGIN
    -- 지역
    INSERT INTO locales (name, description, latitude, longitude)
    VALUES ('성수동', '성수동 힙스터 성지', 37.5445, 127.0561)
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO seongsu_id;

    INSERT INTO locales (name, description, latitude, longitude)
    VALUES ('연남동', '연남동 숲길 산책', 37.5610, 126.9235)
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO yeonnam_id;

    -- 장소
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

    -- 코스 및 연결
    INSERT INTO courses (title, description, theme, locale_id) VALUES 
    ('성수동 힙스터 감성 정복', '공장을 개조한 카페부터 숨겨진 파인다이닝까지', 'Hip & Trendy', seongsu_id) RETURNING id INTO course1_id;
    INSERT INTO courses (title, description, theme, locale_id) VALUES 
    ('붉은 벽돌길 골목 데이트', '아기자기한 소품샵과 조용한 와인 바', 'Romantic & Cozy', seongsu_id) RETURNING id INTO course2_id;
    INSERT INTO courses (title, description, theme, locale_id) VALUES 
    ('연남동 골목 산책', '경의선 숲길과 아기자기한 연남동 골목의 정취', 'Nature & Relax', yeonnam_id) RETURNING id INTO course3_id;

    INSERT INTO course_places (course_id, place_id, sequence_order) VALUES
    (course1_id, p1_id, 1), (course1_id, p2_id, 2), (course1_id, p3_id, 3),
    (course2_id, p4_id, 1), (course2_id, p5_id, 2), (course2_id, p6_id, 3),
    (course3_id, p7_id, 1), (course3_id, p8_id, 2);
    
    RAISE NOTICE '데이터 생성 완료!';
END $$;
```

**[Success]** 또는 **[No rows returned]** 메시지가 뜨면 완료입니다!
완료 후 페이지를 새로고침하면 데이터가 나옵니다.
