const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using service role key would be better for seeding, but anon key with RLS might fail if policies block insert.
// Wait, I don't have service role key in .env.local usually.
// I should check .env.local content.
// If I only have ANON KEY, I can only insert if RLS allows it.
// I set up RLS. "enable read access to everyone".
// Did I enable insert?
// If not, seeding via anon key will fail.

// Optimization: User probably has the SERVICE_ROLE_KEY in Supabase dashboard.
// But I can't ask for it now easily.
// I can try to use the 'postgres' connection string with 'pg' library IF I fix the connection.
// But 'pg' failed.

// Alternative: Update RLS policies to allow insert for now?
// Or, assume I have the service key? No.

// Let's assume the user has the service key OR the policy allows insert for authenticated/anon for now.
// Actually, earlier I created policies: "Enable read access for all users".
// I probably didn't enable insert.

// Let's try to fetch first.
// If fetch returns empty, I know connection works.
// Then I can try insert. If fail, I'll ask user to run SQL.

// Wait, I can use `psql` command line if available? No.
// I'll stick to `supabase-js`.
// If insert fails, I will generate a SQL file `seed.sql` and ask user to run it in SQL Editor. This is 100% reliable.

const supabase = createClient(supabaseUrl, supabaseKey);

const MOCK_DATA = {
    "성수": {
        lat: 37.5445,
        lng: 127.0561,
        courses: [
            {
                title: "성수동 힙스터 감성 정복",
                description: "공장을 개조한 카페부터 숨겨진 파인다이닝까지, 요즘 가장 핫한 성수동을 완벽하게 즐기는 코스입니다.",
                theme: "Hip & Trendy",
                places: [
                    { name: "대림창고", category: "카페", description: "성수동의 상징적인 갤러리 카페", rating: 4.8, lat: 37.5445, lng: 127.0561 },
                    { name: "온량", category: "양식", description: "줄 서서 먹는 성수동 대표 맛집", rating: 4.9, lat: 37.5450, lng: 127.0570 },
                    { name: "무신사 테라스", category: "복합문화공간", description: "패션과 뷰를 한 번에 즐기는 곳", rating: 4.7, lat: 37.5435, lng: 127.0550 }
                ]
            },
            {
                title: "붉은 벽돌길 골목 데이트",
                description: "아기자기한 소품샵과 조용한 와인 바를 중심으로 여유롭게 걷기 좋은 성수동 뒷골목 코스입니다.",
                theme: "Romantic & Cozy",
                places: [
                    { name: "먼치스앤구디스", category: "소품샵", description: "감각적인 라이프스타일 샵", rating: 4.6, lat: 37.5440, lng: 127.0580 },
                    { name: "누데이크 성수", category: "카페", description: "예술적인 디저트를 만나는 공간", rating: 4.8, lat: 37.5435, lng: 127.0550 },
                    { name: "성수 연방", category: "복합문화공간", description: "다양한 브랜드가 모인 큐레이팅 플랫폼", rating: 4.5, lat: 37.5455, lng: 127.0540 }
                ]
            }
        ]
    },
    "연남": {
        lat: 37.5610,
        lng: 126.9235,
        courses: [
            {
                title: "연남동 골목 산책",
                description: "경의선 숲길과 아기자기한 연남동 골목의 정취를 느낄 수 있는 코스입니다.",
                theme: "Nature & Relax",
                places: [
                    { name: "연남동 벚꽃집", category: "카페", description: "벚꽃이 아름다운 주택 개조 카페", rating: 4.7, lat: 37.5615, lng: 126.9240 },
                    { name: "소이연남", category: "태국음식", description: "태국 현지 느낌 물씬 나는 쌀국수 맛집", rating: 4.6, lat: 37.5605, lng: 126.9230 }
                ]
            }
        ]
    }
};

async function seed() {
    console.log('Seeding data...');

    // 1. Insert Locales
    for (const [key, data] of Object.entries(MOCK_DATA)) {
        console.log(`Processing ${key}...`);

        // Check if locale exists
        let { data: locale, error: lErr } = await supabase
            .from('locales')
            .select('id')
            .eq('name', key)
            .single();

        if (!locale) {
            const { data: newLocale, error: insertErr } = await supabase
                .from('locales')
                .insert({
                    name: key,
                    description: `${key} 핫플레이스`,
                    latitude: data.lat,
                    longitude: data.lng,
                    image_url: 'https://placehold.co/600x400'
                })
                .select()
                .single();

            if (insertErr) {
                console.error(`Error creating locale ${key}:`, insertErr);
                continue;
            }
            locale = newLocale;
        }

        console.log(`Locale ID: ${locale.id}`);

        // 2. Insert Courses
        for (const courseData of data.courses) {
            let { data: course, error: cErr } = await supabase
                .from('courses')
                .select('id')
                .eq('title', courseData.title)
                .single();

            if (!course) {
                const { data: newCourse, error: insertCErr } = await supabase
                    .from('courses')
                    .insert({
                        title: courseData.title,
                        description: courseData.description,
                        theme: courseData.theme,
                        locale_id: locale.id
                    })
                    .select()
                    .single();

                if (insertCErr) {
                    console.error(`Error creating course ${courseData.title}:`, insertCErr);
                    continue;
                }
                course = newCourse;
            }
            console.log(`Course ID: ${course.id}`);

            // 3. Insert Places and CoursePlaces
            for (const [index, placeData] of courseData.places.entries()) {
                // Check/Insert Place
                let { data: place, error: pErr } = await supabase
                    .from('places')
                    .select('id')
                    .eq('name', placeData.name)
                    .single();

                if (!place) {
                    const { data: newPlace, error: insertPErr } = await supabase
                        .from('places')
                        .insert({
                            name: placeData.name,
                            category: placeData.category,
                            description: placeData.description,
                            rating: placeData.rating,
                            latitude: placeData.lat,
                            longitude: placeData.lng,
                            address: '서울시 상세 주소 미정' // Mock address
                        })
                        .select()
                        .single();

                    if (insertPErr) {
                        console.error(`Error creating place ${placeData.name}:`, insertPErr);
                        continue;
                    }
                    place = newPlace;
                }

                // Link Course Place
                const { error: cpErr } = await supabase
                    .from('course_places')
                    .insert({
                        course_id: course.id,
                        place_id: place.id,
                        sequence_order: index + 1
                    });

                if (cpErr && cpErr.code !== '23505') { // Ignore unique constraint violations
                    console.error(`Error linking place ${placeData.name}:`, cpErr);
                }
            }
        }
    }
    console.log('Seeding complete!');
}

seed();
