import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 네이버 검색 API 호출 함수
async function searchNaver(query: string, sort: 'sim' | 'date' | 'comment' | 'random' = 'sim', count: number = 5) {
    const client_id = process.env.NAVER_SEARCH_CLIENT_ID;
    const client_secret = process.env.NAVER_SEARCH_CLIENT_SECRET;

    if (!client_id || !client_secret) {
        throw new Error("NAVER API credentials missing");
    }

    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${count}&start=1&sort=${sort}`;

    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': client_id,
            'X-Naver-Client-Secret': client_secret,
        },
    });

    if (!res.ok) {
        console.error(`Naver API Error: ${res.statusText}`);
        return { items: [] };
    }

    return res.json();
}

// 카테고리 분류 함수
function categorizePlace(category: string): 'food' | 'cafe' | 'activity' | 'bar' {
    if (category.includes('카페') || category.includes('커피') || category.includes('디저트')) return 'cafe';
    if (category.includes('술집') || category.includes('바') || category.includes('포차') || category.includes('이자카야')) return 'bar';
    if (category.includes('영화') || category.includes('공원') || category.includes('체험') || category.includes('전시')) return 'activity';
    return 'food'; // 기본값
}

// [v34.1] 쿼리 생성 고도화: 점진적 폴백 지원
const generateSmartQueries = (body: any, level: 'smart' | 'relaxed' | 'simple' = 'smart') => {
    const { region, transport, atmosphere = [], mbti, anniversary, sortBy, theme, companion } = body;

    // 1. 테마별 키워드
    const THEME_KEYWORDS: Record<string, string> = {
        insta: '인스타 핫플 인생샷 트렌디',
        mood: '분위기 좋은 고급 무드',
        healing: '조용한 힐링 감성',
        local: '로컬 맛집 가성비',
    };
    const themeKeyword = theme && THEME_KEYWORDS[theme] ? THEME_KEYWORDS[theme] : '';

    // 2. 동행자 키워드
    const COMPANION_KEYWORDS: Record<string, string> = {
        '아이와': '아이와 가기 좋은',
        '부모님': '부모님 모시고',
        '반려동물': '반려동물 동반',
        '연인': '데이트 코스 커플',
        '친구': '친구랑 핫플',
    };
    const companionKeyword = companion && COMPANION_KEYWORDS[companion] ? COMPANION_KEYWORDS[companion] : '';

    // 3. 부가 필터 (Relaxed 레벨에선 제거됨)
    const moodKeywords = level === 'smart' ? atmosphere.join(' ') : '';
    const mbtiKeyword = level === 'smart' ? (mbti === 'I' ? '조용한' : (mbti === 'E' ? '핫플' : '')) : '';
    const anniKeyword = level === 'smart' && anniversary && anniversary !== '아니요' ? '기념일 이벤트' : '';

    // 4. 운송수단 유연화
    const regionAndTransport = transport === 'public'
        ? `${region}역 근처` // 서울권 강점
        : (transport === 'car' ? `${region} 주차` : region);

    // 비수도권 데이터 부족 대응: '역' 명칭이 없는 경우를 대비한 유연한 지역명
    const baseRegion = level === 'smart' ? regionAndTransport : region;

    // 쿼리 조합
    const foodQuery = `${baseRegion} ${themeKeyword} ${companionKeyword} ${moodKeywords} ${mbtiKeyword} ${anniKeyword} 맛집`.trim();
    const cafeQuery = `${baseRegion} ${themeKeyword} ${companionKeyword} ${moodKeywords} 카페`.trim();
    const activityQuery = `${baseRegion} ${themeKeyword} ${companionKeyword} 가볼만한곳`.trim();

    // 정렬 기준: Naver API는 sim(유사도) 또는 date(최신순) 지원
    // [v36.0] 'new'(신상 순)인 경우 date 적용, 그 외엔 기본 sim(random은 sim으로 폴백)
    const naverSort: 'sim' | 'date' | 'comment' = sortBy === 'review' ? 'comment' : (sortBy === 'new' ? 'date' : 'sim');

    return { foodQuery, cafeQuery, activityQuery, naverSort };
};


export async function POST(request: Request) {
    const body = await request.json();
    return handleSearch(body);
}

// 기존 GET 요청도 지원
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    const fakeBody = { region: query, transport: 'public', atmosphere: [], mbti: '', anniversary: '', sortBy: 'random' };
    return handleSearch(fakeBody);
}

// 공통 핸들러
async function handleSearch(body: any) {
    try {
        let { region } = body;

        // [v2.0] 자연어 검색 고도화 로직
        if (region && !body.theme && (!body.atmosphere || body.atmosphere.length === 0)) {
            const atmosphericKeywords = ['분위기', '로맨틱', '조용한', '활기찬', '이색', '가성비', '럭셔리', '뷰맛집', '힙한'];
            const foundAtmosphere = atmosphericKeywords.filter(k => region.includes(k));
            if (foundAtmosphere.length > 0) {
                body.atmosphere = foundAtmosphere.map(k => k === '이색' ? '이색적인' : (k === '분위기' ? '로맨틱한' : k + '한'));
            }
        }

        // [v34.2] 점진적 검색 폴백 (Progressive Fallback)
        let level: 'smart' | 'relaxed' | 'simple' = 'smart';
        let { foodQuery, cafeQuery, activityQuery, naverSort } = generateSmartQueries(body, level);

        let [foodRes, cafeRes, activityRes] = await Promise.all([
            searchNaver(foodQuery, naverSort, 10),
            searchNaver(cafeQuery, naverSort, 10),
            searchNaver(activityQuery, naverSort, 10)
        ]);

        let totalItems = (foodRes.items?.length || 0) + (cafeRes.items?.length || 0) + (activityRes.items?.length || 0);

        // 결과가 부족하면 'relaxed' 레벨로 재시도 (부가 필터 제거)
        if (totalItems < 3) {
            console.log("⚠️ Results low. Trying 'relaxed' queries...");
            level = 'relaxed';
            const relaxedQueries = generateSmartQueries(body, level);
            const [f2, c2, a2] = await Promise.all([
                searchNaver(relaxedQueries.foodQuery, naverSort, 10),
                searchNaver(relaxedQueries.cafeQuery, naverSort, 10),
                searchNaver(relaxedQueries.activityQuery, naverSort, 10)
            ]);

            foodRes = f2; cafeRes = c2; activityRes = a2;
            totalItems = (foodRes.items?.length || 0) + (cafeRes.items?.length || 0) + (activityRes.items?.length || 0);
        }

        // 그래도 부족하면 'simple' 레벨로 최종 재시도 (기본 검색)
        if (totalItems < 2) {
            console.log("⚠️ Still low. Trying 'simple' queries...");
            const [f3, c3, a3] = await Promise.all([
                searchNaver(`${region} 맛집`, 'random', 5),
                searchNaver(`${region} 카페`, 'random', 5),
                searchNaver(`${region} 가볼만한곳`, 'random', 5)
            ]);
            foodRes = f3; cafeRes = c3; activityRes = a3;
        }

        // [v34.3] 스마트 장소 선정 로직 (Scoring)
        const scorePlace = (item: any) => {
            let score = 0;
            const fullText = (item.title + item.address + item.category + (item.description || '')).replace(/<[^>]+>/g, '');

            // 1. 운송수단 가중치 (역세권 등)
            if (body.transport === 'public' && (fullText.includes('역') || fullText.includes('역세권') || fullText.includes('출구'))) score += 50;
            if (body.transport === 'car' && (fullText.includes('주차') || fullText.includes('발렛') || fullText.includes('넓은'))) score += 30;

            // 2. 테마별 키워드 정량 일치도
            if (body.theme === 'insta' && (fullText.includes('사진') || fullText.includes('인생샷') || fullText.includes('감성'))) score += 40;
            if (body.theme === 'mood' && (fullText.includes('고급') || fullText.includes('분위기') || fullText.includes('와인'))) score += 40;
            if (body.theme === 'healing' && (fullText.includes('조용한') || fullText.includes('힐링') || fullText.includes('숲'))) score += 40;

            // 3. 분위기 선정 일치도 (개별 분위기 단어 포함 시 점수)
            if (body.atmosphere?.length > 0) {
                body.atmosphere.forEach((atm: string) => {
                    if (fullText.includes(atm.slice(0, 2))) score += 15;
                });
            }

            return score;
        };

        const foods = (foodRes.items || []).sort((a: any, b: any) => scorePlace(b) - scorePlace(a));
        const cafes = (cafeRes.items || []).sort((a: any, b: any) => scorePlace(b) - scorePlace(a));
        const hotspots = (activityRes.items || []).sort((a: any, b: any) => scorePlace(b) - scorePlace(a));

        // [v38.0] 뚜벅이 최적화: 근접 이웃(Nearest Neighbor) 경로 탐색 로직
        // 단순히 앵커에서 가까운 것을 뽑는 것이 아니라, "현재 장소에서 가장 가까운 다음 장소"를 선정하여 '지그재그' 방지
        const getDistanceMeters = (p1: any, p2: any) => {
            const x1 = parseInt(p1.mapx || '0');
            const y1 = parseInt(p1.mapy || '0');
            const x2 = parseInt(p2.mapx || '0');
            const y2 = parseInt(p2.mapy || '0');
            if (x1 === 0 || x2 === 0) return 0;
            // 네이버 TM128 좌표계는 미터 단위이므로 단순 피타고라스로 거리(m) 계산 가능
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        };

        const totalPools = [
            ...foods.map((p: any) => ({ ...p, type: 'food' })),
            ...cafes.map((p: any) => ({ ...p, type: 'cafe' })),
            ...hotspots.map((p: any) => ({ ...p, type: 'activity' }))
        ];

        const usedTitles = new Set();
        const finalPlaces: any[] = [];
        let currentPlace: any = null;

        // 1. 첫 번째 장소 선정 (가장 점수 높은 맛집이나 카페)
        const firstCandidates = totalPools.slice(0, 5); // 상위 5개 중 하나
        if (firstCandidates.length > 0) {
            currentPlace = firstCandidates[0];
            const cleanTitle = currentPlace.title.replace(/<[^>]+>/g, '');
            finalPlaces.push({
                name: cleanTitle,
                address: currentPlace.address || currentPlace.roadAddress,
                category: currentPlace.category,
                description: currentPlace.description,
                link: currentPlace.link,
                mapx: currentPlace.mapx,
                mapy: currentPlace.mapy
            });
            usedTitles.add(cleanTitle);
        }

        // 2. Greedy Nearest Neighbor: 남은 5개 장소 채우기
        while (finalPlaces.length < 6 && currentPlace) {
            let bestNext: any = null;
            let minWeight = Infinity;

            // [v38.1] 자차 모드 시 검색 범위 및 거리 가중치 유연화
            const searchLimit = body.transport === 'car' ? 40 : 20;
            const candidates = totalPools.filter(p => !usedTitles.has(p.title.replace(/<[^>]+>/g, ''))).slice(0, searchLimit);

            for (const item of candidates) {
                const dist = getDistanceMeters(currentPlace, item);

                // 가중치 계산 (거리 + 카테고리 다양성)
                const categoryPenalty = finalPlaces.some(p => categorizePlace(p.category) === categorizePlace(item.category)) ? 800 : 0;

                // 자차일 때는 거리의 중요도를 30% 수준으로 낮춤 (멀어도 좋은 곳 우선)
                const distWeight = body.transport === 'car' ? 0.3 : 1.0;
                const weight = (dist * distWeight) + categoryPenalty;

                if (weight < minWeight) {
                    minWeight = weight;
                    bestNext = item;
                }
            }

            if (bestNext) {
                const cleanTitle = bestNext.title.replace(/<[^>]+>/g, '');
                finalPlaces.push({
                    name: cleanTitle,
                    address: bestNext.address || bestNext.roadAddress,
                    category: bestNext.category,
                    description: bestNext.description,
                    link: bestNext.link,
                    mapx: bestNext.mapx,
                    mapy: bestNext.mapy
                });
                usedTitles.add(cleanTitle);
                currentPlace = bestNext;
            } else {
                break; // 더 이상 후보가 없음
            }
        }

        const { data: localeData, error: localeError } = await supabaseAdmin
            .from('locales')
            .upsert({ name: region, description: `AI Recommended course for ${region}` }, { onConflict: 'name' })
            .select()
            .single();
        if (localeError) throw localeError;

        const THEME_LABELS: Record<string, string> = {
            insta: '✨ 인스타 핫플',
            mood: '🍷 분위기 깡패',
            healing: '🌿 힐링/정적',
            local: '🏠 가성비 로컬',
        };

        const themeLabel = body.theme ? THEME_LABELS[body.theme] || '' : '';
        const title = themeLabel
            ? `${region} ${themeLabel} 코스`
            : (body.mbti ? `${region} ${body.mbti} 맞춤 코스` : `${region} AI 추천 코스`);

        // [v33.9.2] 설명 문구 한글화 및 가독성 개선
        const companionPart = body.companion ? `👫 ${body.companion}` : '';
        const atmospherePart = body.atmosphere?.length > 0 ? `🎨 ${body.atmosphere.join(', ')}` : '';
        const themeShortLabel = body.theme ? THEME_LABELS[body.theme]?.split(' ')[1] || '커스텀' : '커스텀';

        const friendlyDescription = [
            `🏷️ ${themeShortLabel}`,
            companionPart,
            atmospherePart
        ].filter(Boolean).join(' · ');

        const { data: courseData, error: courseError } = await supabaseAdmin
            .from('courses')
            .insert({
                locale_id: localeData.id,
                title: title,
                description: friendlyDescription || '당신을 위한 맞춤 코스',
                themes: body.atmosphere || []
            })
            .select()
            .single();
        if (courseError) throw courseError;

        const placesToInsert = finalPlaces.map((p, i) => ({
            course_id: courseData.id,
            name: p.name,
            address: p.address,
            description: p.category,
            latitude: 0,
            longitude: 0,
            sequence_order: i,
            category: categorizePlace(p.category)
        }));

        const { data: insertedPlaces, error: placesError } = await supabaseAdmin
            .from('course_places')
            .insert(placesToInsert)
            .select();

        if (placesError) throw placesError;

        // 6. 결과 반환 (클라이언트 포맷에 맞춤)
        return NextResponse.json({
            locale: localeData,
            courses: [{
                ...courseData,
                places: insertedPlaces // [Fix] DB에서 생성된 ID 포함된 데이터 반환
            }]
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
