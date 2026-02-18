"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Car, Bus, Heart, User, Star, ArrowRight, Check, Sparkles } from "lucide-react";

export interface CoursePreferences {
    region: string;
    theme?: string;     // [v33.x] 테마 추가
    companion?: string; // [v33.x] 동행자 추가
    transport: 'public' | 'car';
    atmosphere: string[];
    anniversary: string;
    mbti: string;
    sortBy: 'rating' | 'review' | 'new';
}

interface CourseWizardProps {
    onComplete: (prefs: CoursePreferences) => void;
    onClose: () => void;
    initialRegion?: string; // [v33.0] 초기 지역 설정
    initialPrefs?: CoursePreferences | null; // [v33.2] 이전 설정 유지
}

const STEPS = [
    { id: 'region', title: '어디로 떠나시나요?', desc: '데이트를 즐길 지역을 알려주세요.' },
    { id: 'theme', title: '어떤 테마를 원하시나요?', desc: '테마를 선택하면 AI가 최적의 설정을 도와드려요.' },
    { id: 'transport', title: '어떻게 이동하시나요?', desc: '이동 수단을 선택해주세요.' },
    { id: 'atmosphere', title: '어떤 분위기를 원하시나요?', desc: '원하는 데이트 무드를 선택해주세요.' },
    { id: 'companion', title: '누구와 함께하시나요?', desc: '동행자와 성향에 맞춰 코스를 정밀 추천해드려요.' },
    { id: 'sort', title: '장소 선정 기준은?', desc: '무엇을 가장 중요하게 생각하시나요?' },
];

const THEMES = [
    { id: 'insta', label: '인스타 핫플', icon: Sparkles, desc: 'SNS 트렌디 / 사진맛집', color: '#818CF8' },
    { id: 'mood', label: '분위기 깡패', icon: Heart, desc: '로맨틱 / 프리미엄 식사', color: '#C084FC' },
    { id: 'healing', label: '힐링/정적', icon: MapPin, desc: '여유로운 산책 / 대화', color: '#10B981' },
    { id: 'local', label: '가성비 로컬', icon: Star, desc: '현지인 인증 / 실패없는', color: '#FBBF24' },
    { id: 'custom', label: '직접 설정', icon: User, desc: '하나하나 직접 고르기', color: '#94A3B8' }
];

const THEME_PRESETS: Record<string, Partial<CoursePreferences>> = {
    insta: { transport: 'public', atmosphere: ['활기찬', '이색적인'], sortBy: 'new' },
    mood: { transport: 'car', atmosphere: ['로맨틱한', '럭셔리'], sortBy: 'rating' },
    healing: { transport: 'public', atmosphere: ['조용한'], mbti: 'I', sortBy: 'rating' },
    local: { transport: 'public', atmosphere: ['가성비'], sortBy: 'review' },
};

export default function CourseWizard({ onComplete, onClose, initialRegion, initialPrefs }: CourseWizardProps) {
    const [step, setStep] = useState(initialRegion ? 1 : 0);

    // 기본값 정의
    const defaultPrefs: CoursePreferences = {
        region: initialRegion || '',
        theme: undefined,
        companion: undefined,
        transport: 'public',
        atmosphere: [],
        anniversary: '',
        mbti: '',
        sortBy: 'rating'
    };

    // 초기 상태: 이전 설정이 있으면 병합하되, 지역(region)은 현재 검색어 우선
    const [prefs, setPrefs] = useState<CoursePreferences>({
        ...defaultPrefs,
        ...(initialPrefs || {}),
        region: initialRegion || initialPrefs?.region || ''
    });

    const handleReset = () => {
        setPrefs({
            ...defaultPrefs, // 지역만 현재 검색어로 유지되고 나머지는 초기화
            region: initialRegion || ''
        });
        // 0단계나 1단계로 이동? 지역 있으면 1단계 그대로.
    };

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            onComplete(prefs);
        }
    };

    const updatePref = (key: keyof CoursePreferences, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    const handleThemeSelect = (themeId: string) => {
        updatePref('theme', themeId);
        if (themeId !== 'custom' && THEME_PRESETS[themeId]) {
            // 프리셋 적용
            setPrefs(prev => ({
                ...prev,
                ...THEME_PRESETS[themeId],
                theme: themeId
            }));
        }
        // 다음 단계로 이동
        setStep(2);
    };

    // --- Step Components ---

    const renderStepContent = () => {
        switch (step) {
            case 0: // Region
                return (
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="예: 성수동, 홍대, 강남역..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-lg placeholder-zinc-500 focus:outline-none focus:border-[#818CF8] transition-colors"
                            value={prefs.region}
                            onChange={(e) => updatePref('region', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && prefs.region && handleNext()}
                            autoFocus
                        />
                        <div className="flex gap-2 flex-wrap">
                            {['성수동', '연남동', '한남동', '을지로', '잠실'].map(rec => (
                                <button
                                    key={rec}
                                    onClick={() => updatePref('region', rec)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${prefs.region === rec ? 'bg-[#818CF8]/20 border-[#818CF8] text-[#818CF8]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                                >
                                    {rec}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 1: // Theme Selection
                return (
                    <div className="grid grid-cols-1 gap-3">
                        {THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeSelect(theme.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${prefs.theme === theme.id
                                    ? 'bg-white/10 border-white/20 ring-1 ring-[#818CF8]/50'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: `${theme.color}20` }}>
                                    <theme.icon size={24} style={{ color: theme.color }} />
                                </div>
                                <div className="flex-grow">
                                    <div className="font-bold text-white text-lg flex items-center gap-2">
                                        {theme.label}
                                        {prefs.theme === theme.id && <Check size={16} className="text-[#818CF8]" />}
                                    </div>
                                    <div className="text-sm text-zinc-500">{theme.desc}</div>
                                </div>
                                <ArrowRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
                            </button>
                        ))}
                    </div>
                );
            case 2: // Transport
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'public', label: '뚜벅이', icon: Bus, desc: '대중교통 & 도보' },
                            { id: 'car', label: '자차', icon: Car, desc: '주차장 필수' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => updatePref('transport', item.id)}
                                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${prefs.transport === item.id
                                    ? 'bg-[#818CF8]/20 border-[#818CF8] text-white shadow-[0_0_20px_rgba(129,140,248,0.3)]'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                            >
                                <item.icon size={32} strokeWidth={1.5} />
                                <div className="text-center">
                                    <div className="font-bold text-lg">{item.label}</div>
                                    <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                );
            case 3: // Atmosphere
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {['로맨틱한', '조용한', '활기찬', '이색적인', '가성비', '럭셔리', '뷰맛집', '힙한'].map(mood => (
                            <button
                                key={mood}
                                onClick={() => {
                                    const current = prefs.atmosphere;
                                    const next = current.includes(mood)
                                        ? current.filter(m => m !== mood)
                                        : [...current, mood];
                                    updatePref('atmosphere', next);
                                }}
                                className={`p-4 rounded-xl border text-left transition-all ${prefs.atmosphere.includes(mood)
                                    ? 'bg-gradient-to-r from-[#818CF8]/20 to-[#C084FC]/20 border-[#818CF8] text-white'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{mood}</span>
                                    {prefs.atmosphere.includes(mood) && <Check size={16} className="text-[#818CF8]" />}
                                </div>
                            </button>
                        ))}
                    </div>
                );
            case 4: // Companion & MBTI
                return (
                    <div className="flex flex-col gap-6">
                        <div className="space-y-3">
                            <label className="text-sm text-zinc-400 font-medium">누구와 함께하시나요?</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['연인', '친구', '부모님', '아이와', '혼자', '반려동물'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updatePref('companion', c)}
                                        className={`p-2.5 rounded-xl border text-sm transition-all ${prefs.companion === c
                                            ? 'bg-[#818CF8]/20 border-[#818CF8] text-white'
                                            : 'bg-white/5 border-white/10 text-zinc-400'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm text-zinc-400 font-medium">성향 (MBTI)</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['I (내향형)', 'E (외향형)'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => updatePref('mbti', m.split(' ')[0])}
                                        className={`p-3 rounded-xl border text-center transition-all ${prefs.mbti === m.split(' ')[0]
                                            ? 'bg-[#818CF8]/20 border-[#818CF8] text-white'
                                            : 'bg-white/5 border-white/10 text-zinc-400'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm text-zinc-400 font-medium">특별한 날인가요?</label>
                            <div className="flex gap-2 flex-wrap">
                                {['아니요', '100일', '생일', '1주년', '크리스마스'].map(ann => (
                                    <button
                                        key={ann}
                                        onClick={() => updatePref('anniversary', ann === '아니요' ? '' : ann)}
                                        className={`px-4 py-2 rounded-full text-sm border transition-all ${prefs.anniversary === (ann === '아니요' ? '' : ann)
                                            ? 'bg-[#F472B6]/20 border-[#F472B6] text-[#F472B6]'
                                            : 'bg-white/5 border-white/10 text-zinc-400'}`}
                                    >
                                        {ann}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 5: // Sort
                return (
                    <div className="flex flex-col gap-3">
                        {[
                            { id: 'rating', label: '별점 높은 순', desc: '실패 없는 검증된 곳' },
                            { id: 'review', label: '리뷰 많은 순', desc: '사람들이 많이 찾는 핫플' },
                            { id: 'new', label: '새로 오픈/숨은 명소', desc: '나만 알고 싶은 곳' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => updatePref('sortBy', item.id as any)}
                                className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${prefs.sortBy === item.id
                                    ? 'bg-gradient-to-r from-[#818CF8]/20 to-[#C084FC]/20 border-[#818CF8] text-white'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                            >
                                <div className="text-left">
                                    <div className="font-bold text-lg">{item.label}</div>
                                    <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>
                                </div>
                                {prefs.sortBy === item.id && <div className="w-4 h-4 rounded-full bg-[#818CF8] shadow-[0_0_10px_#818CF8]" />}
                            </button>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2">
                            {STEPS.map((s, i) => (
                                <div key={s.id} className={`w-2 h-2 rounded-full transition-colors ${i <= step ? 'bg-[#818CF8]' : 'bg-white/10'}`} />
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleReset}
                                className="text-zinc-500 hover:text-[#F472B6] px-2 py-1 text-sm transition-colors"
                            >
                                초기화
                            </button>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white px-3 py-1 text-sm">닫기</button>
                        </div>
                    </div>
                    <motion.div
                        key={step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-3xl font-bold font-outfit text-white mb-2">{STEPS[step].title}</h2>
                        <p className="text-zinc-400">{STEPS[step].desc}</p>
                    </motion.div>
                </div>

                {/* Body */}
                <div className="px-8 py-4 flex-grow overflow-y-auto custom-scrollbar">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="p-8 pt-4">
                    {/* [v33.8] 바로 검색 버튼 (테마 선택 시 활성화) */}
                    {prefs.theme && prefs.theme !== 'custom' && step > 0 && step < STEPS.length - 1 && (
                        <button
                            onClick={() => onComplete(prefs)}
                            disabled={!prefs.region}
                            className="w-full py-4 mb-3 rounded-xl font-bold text-lg bg-[#818CF8]/10 border border-[#818CF8]/30 text-[#818CF8] hover:bg-[#818CF8]/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            이 테마로 바로 검색 🚀
                        </button>
                    )}
                    {/* 기존 설정으로 바로 검색 (이전 기록 있을 때만) */}
                    {initialPrefs && !prefs.theme && step > 0 && step < STEPS.length - 1 && (
                        <button
                            onClick={() => onComplete(prefs)}
                            disabled={!prefs.region}
                            className="w-full py-4 mb-3 rounded-xl font-bold text-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            이전 설정으로 검색
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={step === 0 && !prefs.region}
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#818CF8] to-[#C084FC] text-white shadow-lg shadow-[#818CF8]/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {step === STEPS.length - 1 ? 'AI 코스 생성하기 ✨' : '다음으로'}
                        {step < STEPS.length - 1 && <ArrowRight size={20} />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
