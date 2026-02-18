require('dotenv').config({ path: '.env.local' });

async function testGeocode() {
    const ncpId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const ncpSecret = process.env.NAVER_CLIENT_SECRET;

    console.log('🔑 Testing Geocoding API Key...');
    console.log('ID:', ncpId ? ncpId.substring(0, 4) + '****' : 'MISSING');
    console.log('Secret:', ncpSecret ? ncpSecret.substring(0, 4) + '****' : 'MISSING');

    const query = '대구광역시 수성구 범물동';
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url, {
            headers: {
                'X-NCP-APIGW-API-KEY-ID': ncpId,
                'X-NCP-APIGW-API-KEY': ncpSecret
            }
        });

        console.log('📡 Response Status:', res.status);
        const text = await res.text();

        try {
            const data = JSON.parse(text);
            console.log('📦 Data:', JSON.stringify(data, null, 2));

            if (data.addresses && data.addresses.length > 0) {
                console.log('✅ Success! Lat:', data.addresses[0].y, 'Lng:', data.addresses[0].x);
            } else {
                console.log('❌ No coordinates found.');
            }
        } catch (e) {
            console.log('❌ Invalid JSON:', text);
        }

    } catch (error) {
        console.error('❌ Request Failed:', error);
    }
}

testGeocode();
