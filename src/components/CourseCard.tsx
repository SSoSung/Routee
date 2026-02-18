"use client";

import { motion } from "framer-motion";
import { MapPin, Star, ArrowRight, Share2 } from "lucide-react";
import Image from "next/image";
import { calculateDistance, estimateTime } from "@/lib/geo";

interface Place {
    id: string;
    name: string;
    category: string;
    description?: string;
    image_url?: string;
    rating?: number;
    lat?: number;
    lng?: number;
}

interface CourseCardProps {
    id: string;
    title: string;
    description: string;
    theme: string;
    places: Place[];
    imageUrl?: string;
    index: number;
    isActive?: boolean;
    transportMode?: 'public' | 'car'; // [v35.0] 이동수단 추가
    onViewDetails?: () => void;
}


export default function CourseCard({ id, title, description, theme, places, imageUrl, index, isActive, transportMode = 'public', onViewDetails }: CourseCardProps) {
    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = window.location.href;
        navigator.clipboard.writeText(`[Routee] 이 데이트 코스 어때? "${title}"\n${url}`);
        alert("코스 링크가 복사되었습니다!");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative overflow-hidden rounded-[32px] border p-6 backdrop-blur-xl transition-all duration-300 ${isActive
                ? 'bg-white/10 border-[#818CF8] shadow-[0_0_30px_rgba(129,140,248,0.2)]'
                : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                }`}
        >
            <div className="flex flex-col gap-6">
                {/* [v35.0] 상단 코스 요약 정보 */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${isActive ? 'text-white bg-[#818CF8]' : 'text-[#818CF8] bg-[#818CF8]/10'
                            }`}>
                            {theme}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleShare}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-[#818CF8] transition-all border border-white/5"
                                title="공유하기"
                            >
                                <Share2 size={14} />
                            </button>
                            <div className="flex items-center gap-1 text-[#FBBF24]">
                                <Star size={14} fill="currentColor" />
                                <span className="text-sm font-medium">4.9</span>
                            </div>
                        </div>
                    </div>
                    <h3 className={`text-2xl font-bold font-outfit transition-colors ${isActive ? 'text-[#818CF8]' : 'text-white group-hover:text-[#818CF8]'
                        }`}>
                        {title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                        {description}
                    </p>
                </div>

                {/* Places List with [v35.0] Travel Time */}
                <div className="flex flex-col gap-1">
                    {places.map((place, i) => {
                        const MARKER_COLORS = ['#818CF8', '#A78BFA', '#C084FC', '#E879F9', '#F472B6'];
                        const color = MARKER_COLORS[i % MARKER_COLORS.length];

                        // 다음 장소와의 이동 시간 계산
                        const nextPlace = places[i + 1];
                        let travelInfo = null;
                        if (nextPlace && place.lat && place.lng && nextPlace.lat && nextPlace.lng) {
                            const dist = calculateDistance(place.lat, place.lng, nextPlace.lat, nextPlace.lng);
                            const time = estimateTime(dist, transportMode);
                            travelInfo = { time, icon: transportMode === 'car' ? '🚗' : '🚶' };
                        }

                        return (
                            <div key={place.id || i} className="flex flex-col">
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 transition-colors hover:bg-white/10">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: color }}>
                                        {place.image_url ? (
                                            <Image src={place.image_url} alt={place.name} width={40} height={40} className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                                {i + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-grow">
                                        <span className="text-sm font-semibold text-white">{place.name}</span>
                                        <span className="text-xs text-zinc-500">{place.category}</span>
                                    </div>
                                    <MapPin size={14} style={{ color: color }} />
                                </div>

                                {travelInfo && (
                                    <div className="flex items-center gap-3 px-8 my-1">
                                        <div className="w-0.5 h-4 bg-white/10 ml-2" />
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-500 font-medium">
                                            <span>{travelInfo.icon}</span>
                                            <span>{travelInfo.time}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onViewDetails) onViewDetails();
                    }}
                    className={`mt-2 flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] ${isActive
                        ? 'bg-gradient-to-r from-[#818CF8] to-[#C084FC] text-white shadow-[0_0_30px_rgba(129,140,248,0.4)] px-8'
                        : 'bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white'
                        }`}
                >
                    코스 상세보기
                    <ArrowRight size={18} />
                </button>
            </div>
        </motion.div>
    );
}
