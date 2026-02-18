"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Loader2, Sparkles, Heart } from "lucide-react";
import NaverMap from "@/components/NaverMap";
import CourseCard from "@/components/CourseCard";
import CourseDetailModal from "@/components/CourseDetailModal";
import { useState, useEffect } from "react";
import { Course } from "@/lib/supabase";
import CourseWizard, { CoursePreferences } from "@/components/CourseWizard";
import SearchFilters from "@/components/SearchFilters";
import ThemeSelector from "@/components/ThemeSelector";
import LuckyPicker from "@/components/LuckyPicker";
import { useRef } from "react";

export default function Home() {
  const [search, setSearch] = useState("성수동");
  const [introText, setIntroText] = useState("성수");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false); // [v30.0] Wizard Open State
  const [wizardInitialRegion, setWizardInitialRegion] = useState(''); // [v33.0] 위자드 초기 지역
  const [transportMode, setTransportMode] = useState<'public' | 'car'>('public'); // [v31.0] 이동 수단 상태
  const [lastPrefs, setLastPrefs] = useState<CoursePreferences | null>(null); // [v33.2] 이전 설정 저장
  const [hasUserSetPrefs, setHasUserSetPrefs] = useState(false); // [v33.7] 사용자 설정 완료 마킹

  const resultsRef = useRef<HTMLDivElement>(null);

  const [mapCenter, setMapCenter] = useState({ lat: 37.5445, lng: 127.0561 });
  const [courses, setCourses] = useState<Course[]>([]);
  const [realMarkers, setRealMarkers] = useState<any[]>([]);

  // 1. 데이터 로드 (POST 방식으로 변경)
  const loadData = async (input: string | CoursePreferences) => {
    setIsLoading(true);
    setCourses([]);
    setRealMarkers([]); // 초기화

    try {
      let body = {};
      let queryLabel = '';

      if (typeof input === 'string') {
        body = { region: input };
        queryLabel = input;
        setTransportMode('public'); // 기본값

        // [v33.6] 텍스트 검색 시에도 필터 바 노출을 위해 기본 설정 저장 (표시용)
        // 단, hasUserSetPrefs는 true로 설정하지 않음 (첫 검색 시 위자드 유도 위해)
        setLastPrefs({
          region: input,
          transport: 'public',
          atmosphere: [],
          anniversary: '',
          mbti: '',
          sortBy: 'rating',
          theme: undefined,
          companion: undefined
        });
      } else {
        body = input;
        queryLabel = input.region;
        setTransportMode(input.transport); // 선택한 이동수단 반영
        setLastPrefs(input); // [v33.2] 설정 저장
        setHasUserSetPrefs(true); // [v33.7] 사용자 설정 완료 마킹
      }

      // [v30.0] POST 요청으로 변경 (복잡한 필터링 전달)
      const response = await fetch(`/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Search failed');
      const result = await response.json();

      console.log('🔍 Server Data:', result);

      if (result && result.courses?.length > 0) {
        setCourses(result.courses);
        setActiveCourseId(result.courses[0].id);
        setIntroText(queryLabel);

        // [중요] 네이버 지오코더 대기 후 실행
        waitForNaverAndGeocode(result.courses[0].places, queryLabel);
      } else {
        setCourses([]);
        setActiveCourseId(null);
        alert(`'${queryLabel}'에 대한 검색 결과가 없습니다. 다른 검색어나 테마를 시도해 보세요!`);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setCourses([]);
    } finally {
      setIsLoading(false);
      setShowWizard(false); // 로딩 끝나면 위자드 닫기
    }
  };

  // 2. 네이버 스크립트 로딩 대기 (Polling)
  const waitForNaverAndGeocode = (places: any[], query: string) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.naver && window.naver.maps && window.naver.maps.Service) {
        clearInterval(interval);
        console.log("✅ Naver Maps Service Ready! Starting Geocoding...");
        geocodePlaces(places, query);
      } else if (attempts > 50) { // 5초 타임아웃
        clearInterval(interval);
        console.error("❌ Naver Maps Load Timeout");
      }
    }, 100);
  };

  // 3. 클라이언트 사이드 좌표 변환 (핵심)
  const geocodePlaces = async (places: any[], query: string) => {
    if (!window.naver || !window.naver.maps) return;

    console.log('🌏 Client-Side Geocoding Started for:', places.length, 'places');

    // [수정] 순서 보장을 위해 배열 크기만큼 미리 확보
    const newMarkers: any[] = new Array(places.length).fill(null);
    let count = 0;

    // (1) 개별 장소 변환 (순서 보장)
    const promises = places.map((p, index) => new Promise<void>((resolve) => {
      // 주소 검색
      if (!p.address) {
        resolve();
        return;
      }

      window.naver.maps.Service.geocode({ query: p.address }, (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const item = response.v2.addresses[0];
          const lat = parseFloat(item.y);
          const lng = parseFloat(item.x);

          // [중요] 응답 순서 상관없이 원래 인덱스 자리에 할당 + 원본 인덱스 저장
          // 이렇게 해야 3번이 실패해도 4번은 여전히 4번(Pink)으로 나옴
          newMarkers[index] = { lat, lng, title: p.name, originalIndex: index };
          count++;
        } else {
          console.warn(`❌ Geocode Failed: ${p.address}`);
        }
        resolve();
      });
    }));

    await Promise.all(promises);

    // (2) 결과 반영
    if (count > 0) {
      console.log(`✅ Success! Found ${count} coordinates.`);
      // null인(실패한) 마커 제거하지만, 남은 마커들은 originalIndex를 가지고 있기에 문제 없음
      const validMarkers = newMarkers.filter(m => m !== null);
      setRealMarkers(validMarkers);

      // [v35.0] 현재 활성화된 코스의 장소들에 좌표 정보 주입 (UI 소요 시간 표시용)
      setCourses(prev => prev.map(course => {
        if (course.id === activeCourseId) {
          return {
            ...course,
            places: course.places.map((place, idx) => ({
              ...place,
              lat: newMarkers[idx]?.lat,
              lng: newMarkers[idx]?.lng
            }))
          };
        }
        return course;
      }));
    } else {
      // (3) 실패 시 폴백
      console.warn("⚠️ No coordinates found via places. Trying Query Geocoding:", query);

      window.naver.maps.Service.geocode({ query: query }, (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const item = response.v2.addresses[0];
          const lat = parseFloat(item.y);
          const lng = parseFloat(item.x);
          console.log(`📍 Query Geocode Success: ${lat}, ${lng}`);
          setMapCenter({ lat, lng });
        } else {
          console.warn("⚠️ Query Geocoding Failed. Keeping current map center.");
          // 필요 시 alert("검색된 좌표가 없어 지도를 이동할 수 없습니다.");
        }
      });
    }
  };

  useEffect(() => {
    // loadData("성수동"); // 초기 자동 검색 대신 위자드 유도? 아니면 기본 검색?
    // 일단 기본 검색 유지
    loadData("성수동");
  }, []);

  const handleSearch = () => {
    if (!search.trim()) return;

    // [v2.0] 위자드 강제 오픈 대신 즉시 검색 수행
    loadData(search);
  };

  // [v2.0] 테마 카드 클릭 핸들러
  const handleThemeClick = (themeId: string) => {
    const themePrefs: Partial<CoursePreferences> = {
      region: search || '성수동',
      theme: themeId as any
    };
    // 위자드에서 테마 선택 시와 동일하게 기본 설정 채워서 로드
    loadData({
      region: themePrefs.region!,
      transport: 'public',
      atmosphere: [],
      anniversary: '',
      mbti: '',
      sortBy: 'rating',
      theme: themeId as any,
      companion: undefined
    });
  };

  // [v33.4] 필터 업데이트 핸들러
  const handleFilterUpdate = (newPrefs: CoursePreferences) => {
    setLastPrefs(newPrefs);
    setHasUserSetPrefs(true); // 필터 수동 조작 시에도 설정 완료로 간주
    loadData(newPrefs);
  };

  const handleLuckyPick = (region: string) => {
    setSearch(region);
    loadData(region);
    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-[#030303] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-[#818CF8]/20 rounded-full blur-[120px]" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-[#C084FC]/10 rounded-full blur-[120px]" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center gap-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/5 text-sm font-medium text-white/80">
              <Sparkles size={16} className="text-[#818CF8]" />
              당신의 완벽한 데이트를 위한 AI 가이드
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-outfit">
              어디로 <span className="bg-gradient-to-r from-[#818CF8] via-[#C084FC] to-[#F472B6] bg-clip-text text-transparent">가고 싶으신가요?</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
              성수, 홍대, 연남... 지역만 말씀해 주세요. <br />
              취향과 분위기에 딱 맞는 프리미엄 데이트 코스를 완성해 드립니다.
            </p>

            {/* Search Bar & Wizard Button */}
            <div className="flex flex-col items-center gap-4 w-full max-w-2xl mt-4">
              <div className="w-full relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#818CF8] to-[#C084FC] rounded-[24px] blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
                <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-[22px] px-6 py-4">
                  <Search size={20} className="text-zinc-500" />
                  <input
                    type="text"
                    placeholder="지역명 검색 (예: 성수동)"
                    className="bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 ml-4 flex-grow text-lg outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-white text-black font-bold px-6 py-2.5 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : "검색"}
                  </button>
                </div>
              </div>

              {/* [v2.0] Visual Theme Selector */}
              <div className="w-full mt-16">
                <div className="flex items-center mb-6 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8] animate-pulse" />
                    <h2 className="text-white/80 text-sm font-bold tracking-tight uppercase">인기 테마로 시작하기</h2>
                  </div>
                </div>
                <ThemeSelector onSelect={handleThemeClick} />
              </div>

              {/* [v33.4] Interactive Filter Bar */}
              {lastPrefs && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex justify-center mt-12 py-4"
                >
                  <SearchFilters
                    prefs={lastPrefs}
                    onChange={handleFilterUpdate}
                  />
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      </section>


      {/* Content Section */}
      <section ref={resultsRef} className="max-w-6xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Map Column */}
          <div className="h-[400px] lg:h-[600px] lg:sticky lg:top-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#818CF8]" />
                <h2 className="text-xl font-bold font-outfit">지금 {introText}의 핫플</h2>
              </div>
              <span className="text-sm text-zinc-500">선택된 코스의 장소들</span>
            </div>
            <div className="relative w-full h-full">
              <NaverMap
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                markers={realMarkers}
                transport={transportMode} // [v35.1] 이동수단 전달
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10 transition-opacity">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-white animate-spin" />
                    <p className="text-white font-medium">데이터를 불러오는 중...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Courses Column */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="text-[#F472B6]" fill="currentColor" />
              <h2 className="text-xl font-bold font-outfit">추천 {introText} 코스</h2>
            </div>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                // Skeleton UI during loading
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="w-full h-40 bg-white/5 rounded-3xl animate-pulse border border-white/5 flex flex-col p-6 gap-3">
                    <div className="h-6 w-2/3 bg-white/10 rounded-lg" />
                    <div className="h-4 w-1/2 bg-white/10 rounded-lg" />
                    <div className="mt-auto flex gap-2">
                      <div className="h-6 w-16 bg-white/10 rounded-full" />
                      <div className="h-6 w-16 bg-white/10 rounded-full" />
                    </div>
                  </div>
                ))
              ) : (
                courses.map((course, index) => (
                  <div
                    key={course.id}
                    onClick={() => {
                      setActiveCourseId(course.id);
                      // 클릭 시에도 좌표 다시 확인 (혹시 로딩 덜 됐을까봐)
                      geocodePlaces(course.places, introText);
                    }}
                    className="cursor-pointer"
                  >
                    <CourseCard
                      {...course}
                      index={index}
                      isActive={activeCourseId === course.id}
                      transportMode={transportMode} // [v35.0] 전달
                      onViewDetails={() => setDetailCourse(course)}
                    />
                  </div>
                ))
              )}
            </AnimatePresence>
            {courses.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 bg-white/5 rounded-[40px] border border-dashed border-white/10 px-8"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Sparkles size={32} className="text-[#818CF8]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-outfit">이런, 아직 코스가 없네요!</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed max-w-sm mx-auto">
                  선택하신 지역이나 취향에 맞는 장소를 찾지 못했어요.<br />
                  대신 다른 핫플을 둘러보는 건 어떨까요?
                </p>

                <div className="flex flex-wrap justify-center gap-3 mb-12">
                  {['성수', '연남', '송리단길', '해운대'].map((region) => (
                    <button
                      key={region}
                      onClick={() => {
                        setSearch(region);
                        loadData(region);
                      }}
                      className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
                    >
                      📍 {region}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setLastPrefs(null);
                    setHasUserSetPrefs(false);
                    loadData(search);
                  }}
                  className="px-8 py-4 rounded-2xl bg-[#818CF8] text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-[#818CF8]/20 flex items-center gap-2 mx-auto"
                >
                  필터 초기화하고 다시 찾기
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* [v39.0] Lucky Routee Section (Relocated to bottom) */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <div className="relative">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-[#818CF8]/5 to-transparent blur-3xl" />
          <LuckyPicker onPick={handleLuckyPick} />
        </div>
      </section>

      {/* Detail Modal */}
      <CourseDetailModal
        course={detailCourse}
        isOpen={!!detailCourse}
        transportMode={transportMode} // [v35.0] 전달
        onClose={() => setDetailCourse(null)}
      />

      {/* [v30.0] Wizard Overlay */}
      {showWizard && (
        <CourseWizard
          onClose={() => setShowWizard(false)}
          onComplete={(prefs) => loadData(prefs)}
          initialRegion={wizardInitialRegion} // [v33.0] 초기 지역 전달
          initialPrefs={lastPrefs} // [v33.2] 이전 설정 전달
        />
      )}
    </main>
  );
}
