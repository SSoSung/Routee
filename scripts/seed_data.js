const { Client } = require('pg');

const dbClient = new Client({
    host: '15.165.245.138',
    port: 6543,
    user: 'postgres.skfsvydgwcntxtmyfaci',
    password: 'dkvkxm806!@',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

const NAVER_CLIENT_ID = 'es44ukji8l';
const NAVER_CLIENT_SECRET = 'naQeKGWRvLPkFGq8sf56LeGm2zpBJmX38XZxNIUr';

async function fetchNaverSearch(query) {
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
        }
    });
    return res.json();
}

async function fetchGeocode(address) {
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
        headers: {
            'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
            'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET
        }
    });
    const data = await res.json();
    if (data.addresses && data.addresses.length > 0) {
        return {
            lat: parseFloat(data.addresses[0].y),
            lng: parseFloat(data.addresses[0].x)
        };
    }
    return null;
}

async function seed() {
    try {
        await dbClient.connect();
        console.log('Connected to Supabase');

        // 1. Create Locale
        const localeRes = await dbClient.query(
            "INSERT INTO locales (name, description, image_url) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id",
            ['성수동', '서울의 브루클린, 붉은 벽돌과 감성 카페들이 가득한 핫플레이스', 'https://images.unsplash.com/photo-1626242551532-68c850239276?q=80&w=1000&auto=format&fit=crop']
        );
        const localeId = localeRes.rows[0].id;
        console.log('Locale created:', localeId);

        // 2. Search for places in Seongsu-dong
        const searchTerms = ['성수동 맛집', '성수동 카페'];
        const allPlaces = [];

        for (const term of searchTerms) {
            console.log(`Searching for: ${term}`);
            const searchData = await fetchNaverSearch(term);
            if (searchData.items) {
                for (const item of searchData.items) {
                    const cleanName = item.title.replace(/<[^>]*>?/gm, '');
                    console.log(`Processing: ${cleanName}`);
                    const coords = await fetchGeocode(item.address);

                    allPlaces.push({
                        name: cleanName,
                        category: item.category,
                        description: item.description || cleanName,
                        address: item.address,
                        rating: 4.5, // Mock rating or use another API
                        map_url: item.link || 'https://map.naver.com',
                        latitude: coords ? coords.lat : 37.5445,
                        longitude: coords ? coords.lng : 127.0561
                    });
                }
            }
        }

        // 3. Insert Places and Create a Course
        const courseRes = await dbClient.query(
            "INSERT INTO courses (title, description, locale_id, theme) VALUES ($1, $2, $3, $4) RETURNING id",
            ['성수동 힙스터 데이트', '가장 핫한 장소들만 모은 성수동 정복 코스', localeId, 'Hip & Trendy']
        );
        const courseId = courseRes.rows[0].id;
        console.log('Course created:', courseId);

        for (let i = 0; i < Math.min(allPlaces.length, 4); i++) {
            const p = allPlaces[i];
            const placeRes = await dbClient.query(
                "INSERT INTO places (name, category, description, address, rating, map_url, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
                [p.name, p.category, p.description, p.address, p.rating, p.map_url, p.latitude, p.longitude]
            );
            const placeId = placeRes.rows[0].id;

            await dbClient.query(
                "INSERT INTO course_places (course_id, place_id, sequence_order) VALUES ($1, $2, $3)",
                [courseId, placeId, i + 1]
            );
            console.log(`Linked place: ${p.name}`);
        }

        console.log('Seeding completed successfully!');
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        await dbClient.end();
    }
}

seed();
