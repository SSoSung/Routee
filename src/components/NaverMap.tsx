"use client";

import { useEffect, useRef, useState } from "react";
import { calculateDistance, estimateTime } from "@/lib/geo";

// Naver Maps API global declaration
declare global {
    interface Window {
        naver: any;
    }
    namespace naver {
        namespace maps {
            class Map {
                constructor(element: HTMLElement, options: any);
                setCenter(latlng: any): void;
                setZoom(zoom: number): void;
                morph(latlng: any, zoom?: number): void;
                fitBounds(bounds: any, margin?: any): void;
            }
            class LatLng {
                constructor(lat: number, lng: number);
                lat(): number;
                lng(): number;
            }
            class Marker {
                constructor(options: any);
                setMap(map: Map | null): void;
            }
            class Polyline {
                constructor(options: any);
                setMap(map: Map | null): void;
            }
            class LatLngBounds {
                constructor();
                extend(latlng: any): void;
                getCenter(): LatLng;
            }
            const Animation: { DROP: any };
            const Event: { addListener: (instance: any, eventName: string, handler: Function) => void };
            const Point: any;
        }
    }
}

interface MarkerData {
    lat: number;
    lng: number;
    title: string;
    originalIndex?: number; // 리스트 원본 인덱스 (실패한 마커가 있어도 번호 유지)
}

interface NaverMapProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    markers?: MarkerData[];
    transport?: 'public' | 'car'; // [v31.0] 이동 수단 추가
}

export default function NaverMap({ latitude, longitude, zoom = 15, markers = [], transport = 'public' }: NaverMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<naver.maps.Map | null>(null);
    const markerInstances = useRef<naver.maps.Marker[]>([]);
    const polylineInstance = useRef<naver.maps.Polyline | null>(null); // [v31.0] 경로 선
    const infoInstances = useRef<naver.maps.Marker[]>([]); // [v31.0] 거리/시간 정보 오버레이
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. 네이버 지도 스크립트 로드 대기
    useEffect(() => {
        const checkNaver = setInterval(() => {
            if (window.naver && window.naver.maps) {
                clearInterval(checkNaver);
                setIsLoaded(true);
            }
        }, 100);
        return () => clearInterval(checkNaver);
    }, []);

    // 2. 지도 초기화 (생성)
    useEffect(() => {
        if (!isLoaded || !mapContainer.current || mapInstance.current) return;

        const { naver } = window;
        const location = new naver.maps.LatLng(latitude, longitude);

        const mapOptions = {
            center: location,
            zoom: zoom,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            logoControl: false,
            mapDataControl: false,
        };

        const map = new naver.maps.Map(mapContainer.current, mapOptions);
        mapInstance.current = map;
        console.log("🗺️ Map Initialized");

    }, [isLoaded]);

    // 3. 지도 중심 이동 & 마커 그리기 (핵심 로직 통합)
    useEffect(() => {
        if (!mapInstance.current || !window.naver || !isLoaded) return;
        const { naver } = window;

        // (1) 기존 요소 삭제
        markerInstances.current.forEach((marker) => marker.setMap(null));
        markerInstances.current = [];

        if (polylineInstance.current) {
            polylineInstance.current.setMap(null);
            polylineInstance.current = null;
        }

        infoInstances.current.forEach((info) => info.setMap(null));
        infoInstances.current = [];

        // (2) 마커가 없으면 -> props로 온 latitude, longitude로 이동
        if (!markers || markers.length === 0) {
            const newCenter = new naver.maps.LatLng(latitude, longitude);
            mapInstance.current.morph(newCenter, zoom);
            return;
        }

        console.log(`📍 Drawing ${markers.length} markers & Path (Mode: ${transport})...`);

        const bounds = new naver.maps.LatLngBounds();
        const positionMap: Record<string, number> = {};
        let validMarkerCount = 0;

        const MARKER_COLORS = [
            '#818CF8', // 1. Indigo
            '#A78BFA', // 2. Light Purple
            '#C084FC', // 3. Purple
            '#E879F9', // 4. Magenta
            '#F472B6'  // 5. Pink
        ];

        // [v31.0] 경로를 그리기 위한 좌표 배열
        const pathCoordinates: naver.maps.LatLng[] = [];

        // 마커 그리기
        // 원본 인덱스 순서대로 정렬해야 경로가 꼬이지 않음 (이미 page.tsx에서 순서대로 주지만 안전장치)
        const sortedMarkers = [...markers].sort((a, b) => (a.originalIndex || 0) - (b.originalIndex || 0));

        sortedMarkers.forEach((m, index) => {
            if (!m.lat || !m.lng) return;

            const displayIndex = m.originalIndex !== undefined ? m.originalIndex : index;

            const coordKey = `${m.lat.toFixed(5)},${m.lng.toFixed(5)}`;
            const collisionCount = positionMap[coordKey] || 0;
            positionMap[coordKey] = collisionCount + 1;

            const offset = 0.00015 * collisionCount;
            const position = new naver.maps.LatLng(m.lat + offset, m.lng + offset);

            pathCoordinates.push(position); // 경로 좌표 추가

            const color = MARKER_COLORS[displayIndex % MARKER_COLORS.length];

            const marker = new naver.maps.Marker({
                position: position,
                map: mapInstance.current!,
                title: m.title,
                animation: naver.maps.Animation.DROP,
                icon: {
                    content: `
                        <div style="
                            background: ${color}; 
                            color: white; 
                            border-radius: 50%; 
                            width: 32px; 
                            height: 32px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            font-weight: bold;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                            border: 2px solid white;
                            font-size: 14px;
                            position: relative;
                            z-index: ${100 - displayIndex}; 
                        ">
                            ${displayIndex + 1}
                        </div>
                    `,
                    anchor: new naver.maps.Point(16, 16)
                }
            });

            // 마커 클릭 시 네이버 지도로 이동
            naver.maps.Event.addListener(marker, 'click', () => {
                const url = `https://map.naver.com/v5/search/${encodeURIComponent(m.title)}`;
                window.open(url, '_blank');
            });

            markerInstances.current.push(marker);
            bounds.extend(position);
            validMarkerCount++;
        });

        // (3) 경로 선 그리기 (Polyline)
        if (pathCoordinates.length > 1) {
            polylineInstance.current = new naver.maps.Polyline({
                map: mapInstance.current!,
                path: pathCoordinates,
                strokeColor: '#818CF8', // Indigo color for path
                strokeWeight: 4,
                strokeOpacity: 0.8,
                strokeStyle: 'solid',
                strokeLineCap: 'round',
                strokeLineJoin: 'round'
            });

            // (4) 경로 사이 거리/시간 표시 (중간 지점)
            for (let i = 0; i < pathCoordinates.length - 1; i++) {
                const start = pathCoordinates[i];
                const end = pathCoordinates[i + 1];

                const midLat = (start.lat() + end.lat()) / 2;
                const midLng = (start.lng() + end.lng()) / 2;
                const midPoint = new naver.maps.LatLng(midLat, midLng);

                const distKm = calculateDistance(start.lat(), start.lng(), end.lat(), end.lng());
                const timeText = estimateTime(distKm, transport);
                const modeIcon = transport === 'car' ? '🚗' : '🚶';

                // 너무 가까우면(100m 미만) 표시 안 함 (지도 지저분해짐)
                if (distKm < 0.1) continue;

                const infoMarker = new naver.maps.Marker({
                    position: midPoint,
                    map: mapInstance.current!,
                    icon: {
                        content: `
                            <div style="
                                background: white;
                                padding: 6px 12px;
                                border-radius: 20px;
                                border: 1.5px solid #818CF8;
                                box-shadow: 0 4px 15px rgba(129,140,248,0.3);
                                font-size: 12px;
                                color: #1E1B4B;
                                font-weight: 800;
                                white-space: nowrap;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                                transform: translate(-50%, -50%);
                            ">
                                <span style="font-size: 14px;">${modeIcon}</span>
                                <span>${timeText}</span>
                                <div style="
                                    position: absolute;
                                    bottom: -5px;
                                    left: 50%;
                                    transform: translateX(-50%) rotate(45deg);
                                    width: 10px;
                                    height: 10px;
                                    background: white;
                                    border-right: 1.5px solid #818CF8;
                                    border-bottom: 1.5px solid #818CF8;
                                "></div>
                            </div>
                        `,
                        anchor: new naver.maps.Point(0, 0)
                    }
                });
                infoInstances.current.push(infoMarker);
            }
        }

        // (5) 지도를 범위에 맞게 강제 이동 (fitBounds)
        if (validMarkerCount > 0) {
            if (validMarkerCount === 1) {
                mapInstance.current.morph(bounds.getCenter(), 15);
            } else {
                mapInstance.current.fitBounds(bounds, {
                    padding: { top: 70, bottom: 70, left: 50, right: 50 } // Polyline 고려 여유
                });
            }
        }

    }, [markers, latitude, longitude, isLoaded, transport]); // transport 변경 시 다시 그림

    return (
        <div className="relative w-full h-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-zinc-900">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-500 font-medium animate-pulse">
                    지도 로딩 중...
                </div>
            )}
            <div ref={mapContainer} className="w-full h-full" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
    );
}
