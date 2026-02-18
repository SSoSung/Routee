"use client";

import { motion } from "framer-motion";
import { Sparkles, Heart, Coffee, Map, Utensils } from "lucide-react";

interface Theme {
    id: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    image: string;
    badge?: string;
    tagLine: string;
}

const THEMES: Theme[] = [
    {
        id: 'insta',
        label: '인스타 핫플',
        tagLine: 'MZ세대가 열광하는',
        description: '인생샷 보장 명소들만 모았습니다',
        icon: Sparkles,
        color: '#818CF8',
        badge: '인기 1위',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'mood',
        label: '분위기 깡패',
        tagLine: '로맨틱한 무드',
        description: '실패 없는 기념일 데이트 코스',
        icon: Heart,
        color: '#F472B6',
        badge: '커플 추천',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'healing',
        label: '힐링/정적',
        tagLine: '조용히 쉬고 싶을 때',
        description: '여유로운 대화와 안정이 있는 공간',
        icon: Coffee,
        color: '#34D399',
        badge: '힐링 픽',
        image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'local',
        label: '로컬 맛집',
        tagLine: '현지인들이 찾는',
        description: '줄 서서 기다리는 검증된 맛집',
        icon: Utensils,
        color: '#FBBF24',
        badge: '로컬 강추',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400'
    }
];

interface ThemeSelectorProps {
    onSelect: (themeId: string) => void;
}

export default function ThemeSelector({ onSelect }: ThemeSelectorProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {THEMES.map((theme, index) => (
                <motion.div
                    key={theme.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                    onClick={() => onSelect(theme.id)}
                    className="group relative h-64 rounded-[32px] overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all duration-500 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                >
                    {/* Background Image with Zoom */}
                    <motion.div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                        style={{ backgroundImage: `url(${theme.image})` }}
                    />

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/50" />

                    {/* Badge */}
                    {theme.badge && (
                        <div className="absolute top-4 right-4 z-20">
                            <span
                                className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter backdrop-blur-xl border border-white/20 text-white"
                                style={{ backgroundColor: `${theme.color}40` }}
                            >
                                {theme.badge}
                            </span>
                        </div>
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                        {/* Icon & Tagline */}
                        <div className="flex items-center gap-2 mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10"
                                style={{ backgroundColor: `${theme.color}30`, color: theme.color }}
                            >
                                <theme.icon size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                                {theme.tagLine}
                            </span>
                        </div>

                        {/* Label */}
                        <h3 className="text-white font-black text-xl mb-1 group-hover:text-white transition-colors duration-300">
                            {theme.label}
                        </h3>

                        {/* Description */}
                        <p className="text-zinc-400 text-[11px] leading-[1.4] opacity-60 group-hover:opacity-100 transition-all duration-300 max-w-[90%]">
                            {theme.description}
                        </p>
                    </div>

                    {/* Premium Glow Effect on Hover */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% 100%, ${theme.color}, transparent 80%)` }}
                    />

                    {/* Outer Shine */}
                    <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/10 rounded-[32px] transition-all duration-500" />
                </motion.div>
            ))}
        </div>
    );
}
