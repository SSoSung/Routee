// [v35.0] 지리 정보 계산 유틸리티
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const estimateTime = (distanceKm: number, mode: 'public' | 'car') => {
    // 도보: 시속 4.5km (2.0% 할증 - 횡단보도 등 고려)
    // 자차: 시속 25km (서울 도심 기준)
    const speed = mode === 'car' ? 25 : 4.5;
    const timeHours = distanceKm / speed;
    let timeMin = Math.round(timeHours * 60);

    // 최소 시간 보정: 뚜벅이라면 최소 1분, 자차라면 연산 후 보정
    if (timeMin < 1) return '1분 미만';
    return `${timeMin}분`;
};
