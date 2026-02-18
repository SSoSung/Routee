"use client";

import { useState } from "react";
import { CoursePreferences } from "./CourseWizard";
import {
    Car, Bus, ChevronDown, RefreshCw,
    Settings2, Heart, Brain, ListFilter, Users,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchFiltersProps {
    prefs: CoursePreferences;
    onChange: (newPrefs: CoursePreferences) => void;
}

export default function SearchFilters({ prefs, onChange }: SearchFiltersProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isAnniversaryOpen, setIsAnniversaryOpen] = useState(false);

    const toggleAnniversary = () => setIsAnniversaryOpen(prev => !prev);

    const update = (key: keyof CoursePreferences, value: any) => {
        onChange({ ...prefs, [key]: value });
    };

    const handleAtmosphereToggle = (mood: string) => {
        const current = prefs.atmosphere;
        const next = current.includes(mood)
            ? current.filter(m => m !== mood)
            : [...current, mood];
        update('atmosphere', next);
    };

    const atmospheres = ['로맨틱한', '조용한', '활기찬', '가성비', '럭셔리', '뷰맛집', '힙한'];

    return (
        <div className="w-full flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-4 bg-black/20 p-2 rounded-[32px] border border-white/5 backdrop-blur-xl">

                {/* 1. Transport Segmented Control */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
                    <button
                        onClick={() => update('transport', 'public')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${prefs.transport === 'public'
                            ? 'bg-white text-black shadow-lg scale-105'
                            : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        <Bus size={14} /> 뚜벅이
                    </button>
                    <button
                        onClick={() => update('transport', 'car')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${prefs.transport === 'car'
                            ? 'bg-white text-black shadow-lg scale-105'
                            : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        <Car size={14} /> 자차
                    </button>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-8 bg-white/10" />

                {/* 2. Atmosphere Chips (Scrollable with Mask & Hidden Scrollbar) */}
                <div className="relative group max-w-full md:max-w-md overflow-hidden">
                    {/* Fade Mask Left */}
                    <div className="absolute left-0 inset-y-0 w-12 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {atmospheres.map(mood => (
                            <button
                                key={mood}
                                onClick={() => handleAtmosphereToggle(mood)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-bold border transition-all duration-300 ${prefs.atmosphere.includes(mood)
                                    ? 'bg-[#818CF8] border-[#818CF8] text-white shadow-[0_0_15px_rgba(129,140,248,0.3)]'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/30 hover:bg-white/10'
                                    }`}
                            >
                                {mood}
                            </button>
                        ))}
                    </div>

                    {/* Fade Mask Right */}
                    <div className="absolute right-0 inset-y-0 w-12 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-8 bg-white/10" />

                {/* 3. Advanced Toggle & Reset */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`group p-2.5 rounded-2xl border transition-all ${isAdvancedOpen
                            ? 'bg-[#C084FC] border-[#C084FC] text-white ring-4 ring-[#C084FC]/20'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                            }`}
                    >
                        <Settings2 size={18} className={`transition-transform duration-500 ${isAdvancedOpen ? 'rotate-90' : 'group-hover:rotate-45'}`} />
                    </button>

                    <button
                        onClick={() => onChange({
                            ...prefs,
                            transport: 'public',
                            atmosphere: [],
                            mbti: '',
                            anniversary: '',
                            companion: undefined,
                            theme: undefined
                        })}
                        className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        title="필터 초기화"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* 4. Advanced Filters Popover (Animated) */}
            <AnimatePresence>
                {isAdvancedOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="w-[calc(100vw-2rem)] md:w-full max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl z-40 mx-auto"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                            {/* Companion */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#818CF8]">
                                    <Users size={12} /> 동행자
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {['연인', '친구', '부모님', '아이와', '혼자'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => update('companion', c === prefs.companion ? undefined : c)}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${prefs.companion === c
                                                ? 'bg-white text-black border-white'
                                                : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* MBTI */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C084FC]">
                                    <Brain size={12} /> 성향 (MBTI)
                                </label>
                                <div className="flex bg-white/5 p-1 rounded-xl">
                                    {['E', 'I'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => update('mbti', m === prefs.mbti ? '' : m)}
                                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${prefs.mbti === m
                                                ? 'bg-white/10 text-white'
                                                : 'text-zinc-600 hover:text-white'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Anniversary */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F472B6]">
                                    <Heart size={12} /> 특별한 날
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => toggleAnniversary()}
                                        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 hover:border-white/20 transition-all font-bold"
                                    >
                                        <span className="truncate">{prefs.anniversary || '선택 안함'}</span>
                                        <ChevronDown size={14} className={`shrink-0 transition-transform duration-300 ${isAnniversaryOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isAnniversaryOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-1 flex flex-col gap-0.5"
                                            >
                                                {['아니요', '100일', '생일', '1주년', '크리스마스'].map(ann => (
                                                    <button
                                                        key={ann}
                                                        onClick={() => {
                                                            update('anniversary', ann === '아니요' ? '' : ann);
                                                            setIsAnniversaryOpen(false);
                                                        }}
                                                        className={`w-full px-3 py-2 rounded-lg text-left text-[11px] font-medium transition-colors ${(prefs.anniversary || '아니요') === ann
                                                            ? 'bg-[#F472B6]/20 text-[#F472B6]'
                                                            : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                                                            }`}
                                                    >
                                                        {ann}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Sort By */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FBBF24]">
                                    <ListFilter size={12} /> 추천 정렬
                                </label>
                                <div className="flex flex-col gap-1">
                                    {[
                                        { id: 'rating', label: '별점 높은 순' },
                                        { id: 'review', label: '리뷰 많은 순' },
                                        { id: 'new', label: '신상 순' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => update('sortBy', opt.id)}
                                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${prefs.sortBy === opt.id
                                                ? 'bg-white/10 text-white'
                                                : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {opt.label}
                                            {prefs.sortBy === opt.id && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
