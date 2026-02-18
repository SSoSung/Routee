"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Map as MapIcon, RotateCcw, Target, Trophy } from "lucide-react";

interface Destination {
    id: string;
    name: string;
    label: string;
    x: number; // Percent from left
    y: number; // Percent from top
}

const DESTINATIONS: Destination[] = [
    // 핫플 상징성
    { id: "seoul-ss", name: "성수동", label: "서울 핫플", x: 28, y: 18 },
    { id: "busan-hu", name: "해운대", label: "부산 핫플", x: 82, y: 78 },
    { id: "jeju-aw", name: "애월", label: "제주 핫플", x: 20, y: 92 },
    { id: "gyeongju-hw", name: "황리단길", label: "경주 핫플", x: 75, y: 65 },
    // 시골/깡촌 (진짜 랜덤의 재미)
    { id: "cheongyang", name: "청양군", label: "충남 고추마을", x: 30, y: 45 },
    { id: "goesan", name: "괴산군", label: "충북 산골", x: 45, y: 40 },
    { id: "bonghwa", name: "봉화군", label: "경북 춘양면", x: 70, y: 35 },
    { id: "jangseong", name: "장성군", label: "전남 시골", x: 25, y: 70 },
    { id: "haman", name: "함안군", label: "경남 시골", x: 65, y: 75 },
    { id: "inje", name: "인제군", label: "강원 원통", x: 60, y: 12 },
    { id: "gonjiam", name: "곤지암", label: "경기 광주", x: 35, y: 25 },
    { id: "uiseong", name: "의성군", label: "경북 마을", x: 70, y: 50 },
    { id: "jindo", name: "진도", label: "전남 섬마을", x: 15, y: 85 },
    { id: "namhae", name: "남해군", label: "경남 보물섬", x: 55, y: 85 },
    { id: "boseong", name: "보성군", label: "전남 녹차밭", x: 35, y: 80 },
    { id: "sanchung", name: "산청군", label: "경남 산골", x: 55, y: 70 },
];

interface LuckyPickerProps {
    onPick: (region: string) => void;
}

export default function LuckyPicker({ onPick }: LuckyPickerProps) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [selected, setSelected] = useState<Destination | null>(null);
    const [history, setHistory] = useState<Destination[]>([]);
    const [dartPhase, setDartPhase] = useState<"idle" | "aiming" | "flying" | "hit">("idle");
    const [tempTarget, setTempTarget] = useState({ x: 50, y: 50 });

    const handlePick = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setSelected(null);
        setDartPhase("aiming");

        // Aiming Phase (Random light flashes)
        const aimInterval = setInterval(() => {
            setTempTarget({
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80
            });
        }, 120);

        setTimeout(() => {
            clearInterval(aimInterval);
            setDartPhase("flying");

            // Result selection
            const randomIndex = Math.floor(Math.random() * DESTINATIONS.length);
            const result = DESTINATIONS[randomIndex];

            setTimeout(() => {
                setDartPhase("hit");
                setIsSpinning(false);
                setSelected(result);
                setHistory(prev => [result, ...prev].slice(0, 3));
            }, 800); // Flight time
        }, 2200); // Aiming time
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[48px] p-8 md:p-12 shadow-2xl overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#818CF8]/10 blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C084FC]/10 blur-[100px] -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Left: Map INTERACTION area */}
                <div className="relative aspect-[3/4] bg-black/40 rounded-[32px] border border-white/10 overflow-hidden group shadow-inner">
                    {/* Realistic KR Map SVG - Revised Path */}
                    <div className="absolute inset-0 opacity-40 flex items-center justify-center p-6">
                        <svg viewBox="0 0 200 300" className="w-full h-full text-[#818CF8] fill-current drop-shadow-[0_0_20px_rgba(129,140,248,0.3)]">
                            <path d="M30 10 L50 15 L70 12 L90 20 L110 30 L115 50 L120 70 L130 100 L140 130 L155 160 L160 190 L155 220 L150 240 L130 260 L100 275 L70 280 L40 270 L25 250 L15 220 L10 180 L15 140 L20 100 L25 50 Z" />
                            <circle cx="40" cy="285" r="14" /> {/* Jeju */}
                            <circle cx="185" cy="110" r="4" /> {/* Dokdo */}
                            <circle cx="170" cy="105" r="3" /> {/* Ulleungdo */}
                        </svg>
                    </div>

                    {/* Aiming/Scanning Crosshair - Fixed positioning bug */}
                    {dartPhase === "aiming" && (
                        <motion.div
                            style={{
                                position: 'absolute',
                                left: `${tempTarget.x}%`,
                                top: `${tempTarget.y}%`,
                            }}
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.6, 1, 0.6]
                            }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                            className="z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        >
                            <div className="relative">
                                <Target className="text-[#818CF8] w-14 h-14" strokeWidth={1.5} />
                                <div className="absolute inset-0 bg-[#818CF8]/40 rounded-full blur-xl animate-pulse" />
                            </div>
                        </motion.div>
                    )}

                    {/* Flying Dart */}
                    <AnimatePresence>
                        {dartPhase === "flying" && (
                            <motion.div
                                initial={{ top: "120%", left: "50%", scale: 3, rotate: -45 }}
                                animate={{
                                    top: selected ? `${selected.y}%` : "50%",
                                    left: selected ? `${selected.x}%` : "50%",
                                    scale: 0.8,
                                    rotate: 0
                                }}
                                transition={{ duration: 0.8, ease: "circOut" }}
                                className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                            >
                                <div className="text-5xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] animate-bounce font-serif italic text-white">🎯</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Result Hit Effect */}
                    <AnimatePresence>
                        {selected && dartPhase === "hit" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute z-20"
                                style={{ left: `${selected.x}%`, top: `${selected.y}%` }}
                            >
                                <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
                                    <motion.div
                                        initial={{ scale: 0, y: 10 }}
                                        animate={{ scale: [0, 1.6, 1], y: 0 }}
                                        className="bg-white text-black px-5 py-2.5 rounded-2xl text-[14px] font-black whitespace-nowrap mb-6 shadow-[0_0_40px_rgba(255,255,255,0.3)] relative z-10 border-[3px] border-[#818CF8]"
                                    >
                                        <Sparkles className="inline-block mr-1.5 text-[#818CF8]" size={16} />
                                        {selected.name}
                                    </motion.div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#818CF8]/40 rounded-full blur-[60px]" />
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="text-5xl relative z-10 drop-shadow-2xl"
                                    >
                                        📍
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Idle State Banner */}
                    {dartPhase === "idle" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-transparent via-black/20 to-black/80">
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="w-24 h-24 bg-[#818CF8]/20 rounded-full flex items-center justify-center mb-8 border border-[#818CF8]/40 shadow-[0_0_50px_rgba(129,140,248,0.3)]"
                            >
                                <Target className="text-[#818CF8]" size={48} />
                            </motion.div>
                            <h3 className="text-white font-black text-2xl mb-3 font-outfit">어디로 날아갈까요?</h3>
                            <p className="text-zinc-300 text-sm font-medium leading-relaxed max-w-[200px]">
                                오늘 데이트 목적지는 운명에 맡기세요.<br />
                                전국 구석구석, 루티 다트가 찍어드립니다!
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Controls & Content */}
                <div className="space-y-8">
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#818CF8]/10 text-[#818CF8] text-[10px] font-black uppercase tracking-widest border border-[#818CF8]/20 mb-6 transition-all">
                            <Trophy size={12} />
                            Lucky Routee V2.1
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit leading-[1.1]">
                            진짜 리얼 랜덤,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] via-[#C084FC] to-[#F472B6]">
                                운명의 다트 🎯
                            </span>
                        </h2>
                        <p className="text-zinc-400 leading-relaxed font-outfit text-lg">
                            "진짜 아무데나 가보고 싶다!"<br />
                            유명 핫플부터 한적한 시골 마을까지,<br />
                            루티가 한국의 숨은 보석 같은 곳들을 골라드려요.
                        </p>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#818CF8] to-[#C084FC] rounded-2xl blur opacity-30 group-hover:opacity-50 transition" />
                        <button
                            onClick={handlePick}
                            disabled={isSpinning}
                            className="relative w-full py-6 px-10 rounded-2xl bg-[#818CF8] hover:bg-[#717cf8] text-white font-black text-2xl transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            {isSpinning ? <RotateCcw className="animate-spin" /> : <Target size={28} />}
                            {isSpinning ? "운명 조준 중..." : "다트 던지기"}
                        </button>
                    </div>

                    {/* Result Card */}
                    <AnimatePresence>
                        {selected && dartPhase === "hit" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-[32px] p-8 relative overflow-hidden group/card shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-30 transition-opacity">
                                    <Sparkles size={100} className="text-white" />
                                </div>

                                <div className="relative z-10">
                                    <p className="text-[#818CF8] font-black text-sm mb-2 tracking-tighter uppercase">{selected.label} 당첨!</p>
                                    <h3 className="text-4xl font-black text-white mb-8 flex items-center gap-2">
                                        {selected.name}
                                        <motion.span
                                            animate={{ y: [-5, 5, -5] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                        >🍀</motion.span>
                                    </h3>

                                    <button
                                        onClick={() => onPick(selected.name)}
                                        className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-[#818CF8] hover:text-white transition-all shadow-xl active:scale-95"
                                    >
                                        여기서 코스 짜기
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* History Chips */}
                    {history.length > 1 && (
                        <div className="space-y-4 pt-8 border-t border-white/5">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                <RotateCcw size={10} />
                                최근 스캔한 지역
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {history.slice(1).map((h, i) => (
                                    <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-400 font-bold hover:bg-white/10 transition-colors">
                                        {h.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
