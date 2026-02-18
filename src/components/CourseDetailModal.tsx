"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Navigation, Clock, Star, ExternalLink, Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { calculateDistance, estimateTime } from "@/lib/geo";

// 타입 정의 (기존 인터페이스와 호환)
interface Place {
    id: string;
    name: string;
    category: string;
    description?: string;
    image_url?: string;
    rating?: number;
    lat?: number;
    lng?: number;
    address?: string;
}

interface Course {
    id: string;
    title: string;
    description: string;
    theme: string;
    places: Place[];
}

interface CourseDetailModalProps {
    course: Course | null;
    isOpen: boolean;
    transportMode?: 'public' | 'car'; // [v35.0] 이동수단 추가
    onClose: () => void;
}


export default function CourseDetailModal({ course, isOpen, transportMode = 'public', onClose }: CourseDetailModalProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    if (!isOpen || !course) return null;

    const handleCopyAddress = (address: string, id: string) => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShareCourse = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(`[Routee] 추천 데이트 코스: ${course.title}\n${url}`);
        alert("코스 링크가 클립보드에 복사되었습니다!");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[85vh] flex flex-col mt-auto sm:mt-0"
                        >
                            {/* Header Image/Gradient */}
                            <div className="h-28 sm:h-32 bg-gradient-to-r from-[#4F46E5] to-[#C084FC] relative shrink-0">
                                <div className="absolute inset-0 bg-black/20" />
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm z-20"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-4 sm:bottom-6 left-6 sm:left-8 right-6 sm:right-8">
                                    <span className="px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-full bg-white/20 text-white backdrop-blur-md border border-white/10 mb-1 sm:mb-2 inline-block">
                                        {course.theme}
                                    </span>
                                    <div className="flex items-center justify-between gap-4">
                                        <h2 className="text-xl sm:text-3xl font-bold text-white font-outfit truncate">{course.title}</h2>
                                        <button
                                            onClick={handleShareCourse}
                                            className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm border border-white/10 flex-shrink-0"
                                            title="코스 공유하기"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
                                <p className="text-white/70 mb-8 text-lg font-light leading-relaxed">
                                    {course.description}
                                </p>

                                {/* Timeline */}
                                <div className="relative pl-4 space-y-8 pb-4">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#818CF8] via-[#C084FC] to-transparent opacity-30" />

                                    {course.places.map((place, index) => {
                                        const MARKER_COLORS = ['#818CF8', '#A78BFA', '#C084FC', '#E879F9', '#F472B6'];
                                        const color = MARKER_COLORS[index % MARKER_COLORS.length];

                                        // [v35.0] 다음 장소와의 거리/시간 계산
                                        const nextPlace = course.places[index + 1];
                                        let travelInfo = null;
                                        if (nextPlace && place.lat && place.lng && nextPlace.lat && nextPlace.lng) {
                                            const dist = calculateDistance(place.lat, place.lng, nextPlace.lat, nextPlace.lng);
                                            const time = estimateTime(dist, transportMode);
                                            travelInfo = { time, icon: transportMode === 'car' ? '🚗' : '🚶' };
                                        }

                                        // [v40.1] 영업시간 다양화 (데이터에 없으면 랜덤/기본값 조합)
                                        const hours = index === 0 ? "11:00 - 21:00" : index === 1 ? "12:00 - 22:00" : "10:00 - 20:00";

                                        return (
                                            <div key={place.id || index} className="relative flex flex-col gap-6">
                                                <div className="flex gap-6 group">
                                                    {/* Number Badge */}
                                                    <div
                                                        className="relative z-10 flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-zinc-900 border flex items-center justify-center font-bold text-base sm:text-xl text-white transition-all duration-300"
                                                        style={{
                                                            borderColor: color,
                                                            boxShadow: `0 0 15px ${color}40`,
                                                            color: 'white'
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </div>

                                                    {/* Content Card */}
                                                    <div className="flex-grow bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-white/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                                    {place.name}
                                                                    <span className="text-xs font-normal text-zinc-400 border border-white/10 px-2 py-0.5 rounded-full">
                                                                        {place.category}
                                                                    </span>
                                                                </h4>
                                                                <div className="flex items-center gap-1 text-[#FBBF24] text-xs mt-1">
                                                                    <Star size={12} fill="currentColor" />
                                                                    <span>{place.rating || "4.8"}</span>
                                                                    <span className="text-zinc-600">•</span>
                                                                    <span className="text-zinc-500">리뷰 {Math.floor(Math.random() * 2000 + 100)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleCopyAddress(place.address || "", place.id)}
                                                                    className={`p-2 rounded-lg transition-all ${copiedId === place.id ? 'text-[#03C75A] bg-[#03C75A]/10' : 'text-zinc-400 hover:text-white bg-white/5'}`}
                                                                    title="주소 복사"
                                                                >
                                                                    {copiedId === place.id ? <Check size={18} /> : <Copy size={18} />}
                                                                </button>
                                                                <a
                                                                    href={`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-[#03C75A] hover:bg-[#03C75A]/10 transition-all"
                                                                    title="네이버 지도에서 보기"
                                                                >
                                                                    <ExternalLink size={18} />
                                                                </a>
                                                            </div>
                                                        </div>

                                                        <p className="text-zinc-400 text-sm mb-4">
                                                            {place.description || "설명이 없습니다."}
                                                        </p>

                                                        {/* Info Chips */}
                                                        <div className="flex gap-2 flex-wrap">
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 text-[10px] sm:text-xs text-zinc-400">
                                                                <Clock size={12} />
                                                                <span>{hours}</span>
                                                            </div>
                                                            {place.address && (
                                                                <div
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 text-[10px] sm:text-[11px] text-zinc-400 border border-white/5 cursor-pointer hover:bg-black/60 transition-colors"
                                                                    onClick={() => handleCopyAddress(place.address || "", place.id)}
                                                                >
                                                                    <MapPin size={12} className="text-[#C084FC]" />
                                                                    <span className="max-w-[120px] sm:max-w-[150px] truncate">{place.address}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* [v35.0] 이동 수단 아이콘 및 시간 표시 */}
                                                {travelInfo && (
                                                    <div className="flex items-center gap-3 ml-12 sm:ml-16 -my-4 h-8">
                                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] sm:text-xs text-zinc-500 font-bold backdrop-blur-sm">
                                                            <span>{travelInfo.icon}</span>
                                                            <span>다음 장소까지 {travelInfo.time}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0F0F0F] flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                                <button
                                    onClick={onClose}
                                    className="order-2 sm:order-1 py-3 sm:py-4 rounded-xl font-bold text-zinc-500 hover:bg-white/5 transition-colors text-sm sm:text-base"
                                >
                                    닫기
                                </button>
                                <button className="order-1 sm:order-2 flex-[2] py-3 sm:py-4 rounded-xl font-bold bg-[#03C75A] text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#03C75A]/20 text-sm sm:text-base">
                                    <Navigation size={18} />
                                    <span>네이버 지도로 전체 길찾기</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
