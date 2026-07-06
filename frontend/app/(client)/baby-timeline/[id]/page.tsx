"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader, ArrowLeft, Calendar, ShoppingBag, Syringe, Activity, Sparkles, X, Heart, Star } from "lucide-react";
import { toast } from "@/lib/toast";

interface TimelineEventDto {
  eventDate: string;
  eventType: string; // "Growth", "Vaccination", "Shopping"
  title: string;
  description: string;
  imageUrl: string | null;
  relatedId: number | null;
}

interface TimelineResponseDto {
  babyProfileId: number;
  babyName: string;
  dateOfBirth: string;
  ageInMonths: number;
  gender: string;
  events: TimelineEventDto[];
  aiSummary: string | null;
}

const AI_IMAGES: Record<string, string> = {
  intro: "https://res.cloudinary.com/dmqow0hu4/image/upload/v1783363106/timeline/intro_baby_wide.jpg",
  Growth: "https://res.cloudinary.com/dmqow0hu4/image/upload/v1783363107/timeline/growth_baby_wide.jpg",
  Vaccination: "https://res.cloudinary.com/dmqow0hu4/image/upload/v1783363108/timeline/vaccine_baby_wide.jpg",
  Shopping: "https://res.cloudinary.com/dmqow0hu4/image/upload/v1783363109/timeline/shopping_baby_wide.jpg",
  outro: "https://res.cloudinary.com/dmqow0hu4/image/upload/v1783363110/timeline/outro_baby_wide.jpg"
};

const FloatingParticles = () => {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    setParticles([...Array(25)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${100 + Math.random() * 20}%`,
      animationDuration: `${8 + Math.random() * 12}s`,
      animationDelay: `${Math.random() * 5}s`,
      opacity: 0.3 + Math.random() * 0.7,
      scale: 0.5 + Math.random() * 1.2,
      icon: i % 4 === 0 ? '✨' : i % 4 === 1 ? '⭐' : i % 4 === 2 ? '🎈' : '💖'
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      {particles.map((p, i) => (
        <div 
          key={i} 
          className="absolute animate-[floatUp_linear_infinite]"
          style={{
            left: p.left,
            top: p.top,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            opacity: p.opacity,
            transform: `scale(${p.scale})`,
          }}
        >
          {p.icon}
        </div>
      ))}
    </div>
  );
};

export default function BabyTimelinePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<TimelineResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  
  const SLIDE_DURATION = 15000; // 15 seconds per slide (increased for Spotify Wrapped feel)
  const UPDATE_INTERVAL = 16; // ~60fps

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
        if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.endsWith('/api')) {
          apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api`;
        }
        const res = await fetch(`${apiUrl}/BabyTimeline/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Không thể tải dữ liệu timeline");
        const json = await res.json();
        if (json.success) setData(json.data);
        else toast.error(json.message);
      } catch (err) {
        toast.error("Lỗi khi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [id, router]);

  // Construct slides
  const slides = useMemo(() => {
    if (!data) return [];
    
    const sortedEvents = [...data.events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    const generatedSlides = [
      {
        id: 'intro',
        type: 'intro',
        title: `Hành trình rực rỡ của ${data.babyName}`,
        description: data.aiSummary || `Năm vừa qua, bé yêu của chúng ta đã khôn lớn thật nhiều. Cùng nhìn lại những cột mốc đáng nhớ nhất nhé!`,
        date: null,
        image: AI_IMAGES.intro,
        icon: <Sparkles size={24} className="text-white" />,
        color: "from-fuchsia-600 to-indigo-600"
      },
      ...sortedEvents.map((evt, idx) => ({
        id: `event-${idx}`,
        type: evt.eventType,
        title: evt.title,
        description: evt.description,
        date: evt.eventDate,
        image: AI_IMAGES[evt.eventType] || AI_IMAGES.intro,
        icon: evt.eventType === 'Growth' ? <Activity size={24} className="text-white" /> : 
              evt.eventType === 'Vaccination' ? <Syringe size={24} className="text-white" /> : 
              <ShoppingBag size={24} className="text-white" />,
        color: evt.eventType === 'Growth' ? "from-emerald-500 to-teal-700" :
               evt.eventType === 'Vaccination' ? "from-sky-500 to-blue-700" :
               "from-rose-500 to-pink-700"
      })),
      {
        id: 'outro',
        type: 'outro',
        title: `Và hành trình còn tiếp tục...`,
        description: `LazPe sẽ luôn đồng hành cùng mẹ và bé ${data.babyName} trên mọi chặng đường phát triển!`,
        date: null,
        image: AI_IMAGES.outro,
        icon: <Heart size={24} className="text-white" />,
        color: "from-amber-500 to-orange-600"
      }
    ];
    return generatedSlides;
  }, [data]);

  // Progress logic
  useEffect(() => {
    if (slides.length === 0) return;
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + (UPDATE_INTERVAL / SLIDE_DURATION) * 100;
        if (nextProgress >= 100) {
          if (currentSlideIndex < slides.length - 1) {
            setSlideDirection('next');
            setCurrentSlideIndex(c => c + 1);
            return 0; 
          } else {
            clearInterval(interval);
            return 100;
          }
        }
        return nextProgress;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentSlideIndex, isPaused, slides.length]);

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setSlideDirection('next');
      setCurrentSlideIndex(currentSlideIndex + 1);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setSlideDirection('prev');
      setCurrentSlideIndex(currentSlideIndex - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  if (loading || showSplash) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
        {/* Magic background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-black to-black animate-[pulse_4s_ease-in-out_infinite]"></div>
        
        {/* Use the same floating particles for consistency */}
        <FloatingParticles />
        
        <div className="relative z-10 flex flex-col items-center animate-[slideUpFade_1s_ease-out_forwards]">
          <div className="w-24 h-24 mb-10 relative flex items-center justify-center">
             <Sparkles size={40} className="text-amber-400 absolute animate-[spin_4s_linear_infinite]" />
             <div className="absolute inset-0 border-[4px] border-transparent border-t-amber-400 border-r-fuchsia-500 rounded-full animate-[spin_1.5s_ease-in-out_infinite]"></div>
             <div className="absolute inset-2 border-[4px] border-transparent border-b-sky-400 border-l-emerald-400 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-wide text-center px-4 leading-tight drop-shadow-lg">
            Đang mở ra hành trình<br/>lớn lên của con...
          </h2>
          <p className="text-amber-400 font-bold text-base sm:text-lg tracking-[0.25em] uppercase animate-[pulse_2s_ease-in-out_infinite] drop-shadow-md">
            Cùng dõi theo nhé!
          </p>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}} />
      </div>
    );
  }

  if (!data || slides.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <span className="material-symbols-outlined text-6xl text-zinc-600 mb-4">history_toggle_off</span>
        <h2 className="text-xl font-bold mb-2">Chưa có dữ liệu</h2>
        <button onClick={() => router.push("/profile?tab=profile")} className="mt-4 bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition-all">
          Quay lại Hồ sơ
        </button>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const slideAnimationClass = slideDirection === 'next' ? 'animate-[slideInRight_0.8s_cubic-bezier(0.16,1,0.3,1)]' : 'animate-[slideInLeft_0.8s_cubic-bezier(0.16,1,0.3,1)]';

  return (
    <div className="min-h-[calc(100vh-80px)] h-auto sm:h-[calc(100vh-80px)] relative flex items-center justify-center overflow-hidden font-sans select-none bg-black">
      
      {/* Floating Particles/Stars */}
      <FloatingParticles />

      {/* Horizontal Spotify-Wrapped Style Container (Full screen) */}
      <div className={`relative w-full h-full min-h-[600px] overflow-hidden bg-black flex flex-col z-30`}>
        
        {/* Render all slides for preloading and smooth crossfade */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          
          return (
            <div 
              key={slide.id} 
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-50 pointer-events-none' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              
              {/* Background Image with slight pan/zoom animation on mount */}
              <div 
                className={`absolute inset-0 bg-cover bg-center ${isActive ? 'animate-[panImage_15s_ease-in-out_forwards]' : ''}`}
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes panImage {
                  0% { transform: scale(1.05) translate(0, 0); }
                  100% { transform: scale(1.15) translate(-2%, 2%); }
                }
                @keyframes slideUpFade {
                  0% { opacity: 0; transform: translateY(30px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatUp {
                  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
                }
                .animate-slideUpFade {
                  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
              `}} />

              {/* Only render content if active to re-trigger animations */}
              {isActive && (
                <>
                  {/* Dark overlay gradients for text readability (stronger on the left) */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none sm:hidden" />

                  {/* Main Content Area (Left aligned for horizontal frame) */}
                  <div className="absolute inset-y-0 left-0 w-full sm:w-[55%] p-6 sm:p-12 flex flex-col justify-end sm:justify-center z-30 pointer-events-none pb-12 sm:pb-12">
                    <div className="mb-2">
                      <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r ${slide.color} text-white shadow-lg mb-6 uppercase tracking-widest animate-slideUpFade opacity-0`} style={{ animationDelay: '100ms' }}>
                        {slide.type === 'intro' ? 'Bắt đầu' : 
                         slide.type === 'outro' ? 'Tổng kết' : 
                         slide.type === 'Growth' ? 'Cột mốc tăng trưởng' : 
                         slide.type === 'Vaccination' ? 'Nhật ký tiêm phòng' : 'Hành trình mua sắm'}
                      </span>
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] leading-[1.1] animate-slideUpFade opacity-0 tracking-tight" style={{ animationDelay: '300ms' }}>
                        {slide.title}
                      </h2>
                      <p className="text-lg sm:text-xl text-white/90 leading-relaxed drop-shadow-md font-medium animate-slideUpFade opacity-0 max-w-[95%]" style={{ animationDelay: '500ms' }}>
                        {slide.description}
                      </p>
                    </div>
                    
                    {currentSlideIndex === slides.length - 1 && (
                      <div className="mt-10 animate-slideUpFade opacity-0 pointer-events-auto" style={{ animationDelay: '700ms' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push("/profile?tab=profile"); }}
                          className="px-8 py-4 rounded-full bg-white text-zinc-900 font-bold text-lg flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl active:scale-[0.98]"
                        >
                          <Sparkles size={20} className="text-amber-500" /> Quay lại Hồ sơ
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Top Progress Bars */}
        <div className="absolute top-6 left-6 right-6 z-50 flex gap-2 pointer-events-none">
          {slides.map((_, idx) => (
            <div key={idx} className="h-[4px] flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm shadow-sm">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{ 
                  width: idx === currentSlideIndex 
                          ? `${progress}%` 
                          : idx < currentSlideIndex 
                            ? '100%' 
                            : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Actions (Absolute top right) */}
        <div className="absolute top-12 left-6 right-6 z-50 flex items-center justify-between text-white pointer-events-none">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentSlide.color} flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]`}>
              {currentSlide.icon}
            </div>
            <div>
              <p className="font-black text-lg leading-tight text-white drop-shadow-md tracking-wide">{data.babyName}</p>
              {currentSlide.date && (
                <p className="text-sm text-white/80 font-bold drop-shadow-md uppercase tracking-wider">
                  {new Date(currentSlide.date).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); router.push("/profile?tab=profile"); }} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors pointer-events-auto border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tap areas for navigation */}
        <div className="absolute inset-0 z-40 flex">
          <div 
            className="w-1/3 h-full cursor-pointer" 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
          <div 
            className="w-2/3 h-full cursor-pointer" 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
        </div>

      </div>
    </div>
  );
}
