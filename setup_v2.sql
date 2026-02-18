-- [v32.0 Schema Update]
-- AI 맞춤 코스 생성을 위해 테이블 구조를 확장합니다.

-- 1. courses 테이블: 테마(themes) 저장을 위한 컬럼 추가
ALTER TABLE courses ADD COLUMN IF NOT EXISTS themes TEXT[] DEFAULT '{}';

-- 2. course_places 테이블: 장소 상세 정보 직접 저장 허용
-- (기존에는 place_id로 참조만 했으나, AI 검색 결과는 실시간 데이터이므로 직접 저장)
ALTER TABLE course_places ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE course_places ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE course_places ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE course_places ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE course_places ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 0;
ALTER TABLE course_places ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 0;

-- 3. 호환성 처리: place_id가 없어도 데이터가 들어가도록 제약 조건 완화
ALTER TABLE course_places ALTER COLUMN place_id DROP NOT NULL;

-- 4. 권한 설정 재확인 (혹시 모를 권한 문제 방지)
GRANT ALL ON locales TO postgres, anon, authenticated, service_role;
GRANT ALL ON places TO postgres, anon, authenticated, service_role;
GRANT ALL ON courses TO postgres, anon, authenticated, service_role;
GRANT ALL ON course_places TO postgres, anon, authenticated, service_role;
