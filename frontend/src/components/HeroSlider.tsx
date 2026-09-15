'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Zap, ArrowRight, Award } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 1,
    badge: 'SIÊU PHẨM MÀN HÌNH OLED 2026',
    title: 'ASUS ROG Swift OLED PG27AQDM',
    subtitle: 'Tần số quét 240Hz • Phản hồi 0.03ms • Tản nhiệt buồng hơi Custom',
    desc: 'Đột phá hiển thị với màu đen vô cực và tốc độ phản hồi cực hạn cho game thủ đỉnh cao.',
    cta: 'Khám Phá Ngay',
    link: '/products/asus-rog-swift-oled-pg27aqdm-27-2k-240hz',
    tag: 'Chính Hãng ROG',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=80',
    color: 'from-blue-600/80 via-indigo-900/60 to-transparent',
  },
  {
    id: 2,
    badge: 'CÔNG NGHỆ RAPID TRIGGER MỚI NHẤT',
    title: 'Bàn Phím Cơ Hall Effect & Magnetic Switch',
    subtitle: 'Kích hoạt phím từ 0.1mm • Tần số quét tín hiệu 8000Hz • Vỏ nhôm CNC',
    desc: 'Triệt tiêu hoàn toàn delay gõ phím. Định hình lại trải nghiệm thi đấu Esports CS2 và Valorant.',
    cta: 'Xem Bộ Sưu Tập',
    link: '/products?category=keyboard',
    tag: 'Trending #1',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=80',
    color: 'from-purple-600/80 via-indigo-950/70 to-transparent',
  },
  {
    id: 3,
    badge: 'CHUỘT THI ĐẤU SIÊU NHẸ 54G',
    title: 'Razer Viper V3 Pro & Logitech Superlight 2',
    subtitle: 'Cảm biến Focus Pro 35K DPI • 8000Hz HyperPolling không dây',
    desc: 'Chuẩn mực mới của dòng chuột thi đấu chuyên nghiệp. Cầm chắc, lia chuẩn xác đến từng pixel.',
    cta: 'Sở Hữu Ngay',
    link: '/products?category=mouse',
    tag: 'Esports Pro Choice',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1400&q=80',
    color: 'from-cyan-600/80 via-slate-900/80 to-transparent',
  },
];

export default function HeroSlider() {
  const [autoplay] = useState(() =>
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 }, [autoplay]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    setTimeout(() => onSelect(), 0);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl group border hairline-border surface-bevel shadow-2xl bg-surface-card">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {HERO_SLIDES.map((slide) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0 h-[380px] sm:h-[460px] md:h-[520px]">
              {/* Background Image with dark overlay */}
              <div className="absolute inset-0">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority
                  className="object-cover object-center"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-900/30" />
                <div className={`absolute inset-0 bg-gradient-to-t ${slide.color}`} />
              </div>

              {/* Content overlay */}
              <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center z-10 text-white">
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider uppercase bg-signal-cyan/20 text-signal-cyan border border-signal-cyan/30 backdrop-blur-md">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      {slide.badge}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-semibold bg-white/10 text-slate-200 backdrop-blur-md border hairline-border">
                      <Award className="w-3.5 h-3.5" />
                      {slide.tag}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                    {slide.title}
                  </h1>

                  <p className="text-xs sm:text-sm md:text-base font-semibold text-cyan-300 font-mono">
                    {slide.subtitle}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg line-clamp-2 sm:line-clamp-none">
                    {slide.desc}
                  </p>

                  <div className="pt-2 flex items-center gap-4">
                    <Link
                      href={slide.link}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white text-slate-950 hover:bg-slate-100 shadow-md surface-bevel active:translate-y-0.5 transition-all"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/products"
                      className="inline-flex items-center px-5 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border hairline-border transition-colors"
                    >
                      Xem tất cả sản phẩm
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border hairline-border surface-bevel transition-all opacity-0 group-hover:opacity-100 z-20 hover:scale-105"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border hairline-border surface-bevel transition-all opacity-0 group-hover:opacity-100 z-20 hover:scale-105"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Sleek Hardware Slide Telemetry / Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/75 dark:bg-surface-card/85 backdrop-blur-md border hairline-border surface-bevel z-20 shadow-lg">
        <div className="flex items-center gap-1.5">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                selectedIndex === index ? 'w-6 bg-signal-cyan shadow-sm shadow-cyan-400/50' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono tabular-nums text-slate-300 border-l hairline-border pl-2.5">
          0{selectedIndex + 1} / 0{HERO_SLIDES.length}
        </span>
      </div>
    </div>
  );
}
