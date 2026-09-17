'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Zap, ArrowRight, Award } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getBannerTheme } from '@/lib/bannerThemes';
import { useBlendedProductImage } from '@/lib/imageBlender';

export interface HeroSlideItem {
  _id?: string;
  id?: string | number;
  badge?: string;
  title: string;
  subtitle?: string;
  desc?: string;
  cta?: string;
  link?: string;
  tag?: string;
  image: string;
  imageFit?: 'contain' | 'cover';
  removeWhiteBg?: boolean;
  theme?: string;
  color?: string;
  showSecondaryBtn?: boolean;
  secondaryCta?: string;
  secondaryLink?: string;
}

export const FALLBACK_HERO_SLIDES: HeroSlideItem[] = [
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
    imageFit: 'contain',
    removeWhiteBg: true,
    theme: 'blue',
    showSecondaryBtn: true,
    secondaryCta: 'Xem tất cả sản phẩm',
    secondaryLink: '/products',
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
    imageFit: 'contain',
    theme: 'purple',
    showSecondaryBtn: true,
    secondaryCta: 'Xem tất cả sản phẩm',
    secondaryLink: '/products',
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
    imageFit: 'contain',
    theme: 'cyan',
    showSecondaryBtn: true,
    secondaryCta: 'Xem tất cả sản phẩm',
    secondaryLink: '/products',
  },
];

// Helper to determine if an image hostname requires unoptimized loading
function shouldUnoptimize(src: string): boolean {
  if (!src) return true;
  if (src.startsWith('/') || src.startsWith('data:')) return false;
  try {
    const url = new URL(src);
    if (url.hostname === 'images.unsplash.com' || url.hostname === 'via.placeholder.com') {
      return false;
    }
    if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && (url.port === '5000' || !url.port)) {
      return false;
    }
    if (url.hostname === 'api.techgear.vn') {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

// Component for dedicated 2/3 product showcase with studio lighting and smart white-bg blending
function HeroProductShowcase({
  slide,
  isPriority,
}: {
  slide: HeroSlideItem;
  isPriority: boolean;
}) {
  const themeConfig = slide.theme ? getBannerTheme(slide.theme) : null;
  const isRemoveBg = Boolean(slide.removeWhiteBg);

  return (
    <>
      {/* Desktop/Tablet: dedicated 2/3 showcase */}
      <div className="hidden md:flex md:w-[62%] lg:w-[65%] xl:w-[66%] h-full items-center justify-center p-4 sm:p-6 lg:p-8 relative isolate">
        {/* Studio Lighting Backdrop (spotlight glow + desk surface + floor shadow) when removeWhiteBg is active (matches Image 2) */}
        {isRemoveBg && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden bg-[#0c121e]">
            {/* 1. Broad soft ambient halo tuned to theme accent */}
            <div
              className="absolute w-[88%] h-[84%] rounded-full blur-3xl opacity-35 dark:opacity-45 pointer-events-none transition-opacity duration-500"
              style={{
                background: themeConfig?.accentColor
                  ? `radial-gradient(ellipse at 52% 45%, ${themeConfig.accentColor}50 0%, ${themeConfig.accentColor}15 50%, transparent 75%)`
                  : 'radial-gradient(ellipse at 52% 45%, rgba(59, 130, 246, 0.35) 0%, rgba(30, 64, 175, 0.12) 50%, transparent 75%)',
              }}
            />

            {/* 2. Concentrated studio spotlight behind the product */}
            <div className="absolute w-[80%] h-[72%] top-[8%] left-[10%] rounded-full blur-2xl pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(140,180,230,0.70)_0%,_rgba(60,95,145,0.35)_45%,_transparent_75%)]" />

            {/* 3. Studio desk / table surface horizon plane across the lower 32% (matches Image 2) */}
            <div className="absolute bottom-0 inset-x-0 h-[32%] bg-gradient-to-b from-[#2b384a] to-[#151e2b] border-t border-slate-500/30 pointer-events-none" />

            {/* 4. Studio pedestal / contact drop-shadow line beneath product base */}
            <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-[15%] w-[70%] h-4 bg-black/90 rounded-[100%] blur-md pointer-events-none" />
          </div>
        )}

        <div className="relative w-full h-[300px] sm:h-[380px] md:h-[420px] lg:h-[460px] max-h-[90%] transition-transform duration-500 ease-out hover:scale-105 flex items-center justify-center">
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            priority={isPriority}
            unoptimized={true}
            className={`object-contain object-center transition-all duration-300 ${
              isRemoveBg
                ? ''
                : 'drop-shadow-[0_20px_45px_rgba(0,0,0,0.7)]'
            }`}
            style={
              isRemoveBg
                ? {
                    mixBlendMode: 'multiply',
                    WebkitMaskImage:
                      'radial-gradient(ellipse 90% 86% at 50% 50%, #000 70%, rgba(0, 0, 0, 0.6) 85%, transparent 100%)',
                    maskImage:
                      'radial-gradient(ellipse 90% 86% at 50% 50%, #000 70%, rgba(0, 0, 0, 0.6) 85%, transparent 100%)',
                  }
                : undefined
            }
          />
        </div>

        {/* Decorative 4-point studio sparkle (matches Image 2 bottom-right) */}
        {isRemoveBg && (
          <div className="absolute bottom-4 right-6 sm:bottom-6 sm:right-8 text-slate-400/40 dark:text-slate-300/35 pointer-events-none text-xl sm:text-2xl font-serif select-none">
            ✦
          </div>
        )}
      </div>

      {/* Mobile: crisp product display in upper-right without colliding with typography */}
      <div className="md:hidden absolute right-1.5 top-2 w-[40%] h-[130px] sm:w-[44%] sm:h-[150px] pointer-events-none flex items-center justify-center z-0 isolate overflow-hidden">
        {isRemoveBg && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden bg-[#0c121e]">
            <div className="w-[85%] h-[85%] rounded-full blur-xl bg-[radial-gradient(circle,_rgba(140,180,230,0.65)_0%,_rgba(60,95,145,0.30)_50%,_transparent_75%)] pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-[28%] bg-gradient-to-b from-[#2b384a] to-[#151e2b] border-t border-slate-500/30 pointer-events-none" />
          </div>
        )}
        <div className="relative w-full h-full">
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="40vw"
            priority={isPriority}
            unoptimized={true}
            className="object-contain object-center"
            style={
              isRemoveBg
                ? {
                    mixBlendMode: 'multiply',
                    WebkitMaskImage:
                      'radial-gradient(ellipse 90% 86% at 50% 50%, #000 70%, rgba(0, 0, 0, 0.6) 85%, transparent 100%)',
                    maskImage:
                      'radial-gradient(ellipse 90% 86% at 50% 50%, #000 70%, rgba(0, 0, 0, 0.6) 85%, transparent 100%)',
                  }
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlideItem[]>(FALLBACK_HERO_SLIDES);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch active banners from API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBanners() {
      try {
        const res = await fetchApi<HeroSlideItem[]>('/banners');
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setSlides(res.data);
        }
      } catch (err) {
        console.warn('[HeroSlider] Fallback to default slides:', err);
      }
    }
    loadBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  const isSingleSlide = slides.length <= 1;

  const autoplay = useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
    []
  );

  const plugins = useMemo(() => (isSingleSlide ? [] : [autoplay]), [isSingleSlide, autoplay]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: !isSingleSlide, duration: 25 },
    plugins
  );

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
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Dynamically re-initialize carousel when slides or single-slide state changes
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit(
      { loop: !isSingleSlide, duration: 25 },
      isSingleSlide ? [] : [autoplay]
    );
  }, [emblaApi, slides, isSingleSlide, autoplay]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl group border hairline-border surface-bevel shadow-2xl bg-surface-card">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => {
            const slideKey = slide._id || slide.id || index;
            const themeConfig = slide.theme ? getBannerTheme(slide.theme) : null;
            const gradientClass = themeConfig
              ? themeConfig.gradient
              : slide.color || 'from-purple-600/80 via-indigo-950/70 to-transparent';
            const isCover = slide.imageFit === 'cover';

            return (
              <div
                key={slideKey}
                className="relative flex-[0_0_100%] min-w-0 h-[380px] sm:h-[460px] md:h-[520px] bg-slate-950 overflow-hidden"
              >
                {/* 1. Background image layer:
                    - In 'cover' mode: full bleed cover image
                    - In 'contain' mode: subtle blurred ambient background, HIDDEN when removeWhiteBg is active to prevent milky white haze */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {!slide.removeWhiteBg && (
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 1280px"
                      priority={index === 0}
                      unoptimized={shouldUnoptimize(slide.image)}
                      className={`object-cover object-center ${
                        isCover
                          ? 'scale-100 opacity-90'
                          : 'scale-110 blur-3xl opacity-35 dark:opacity-40'
                      }`}
                    />
                  )}
                </div>

                {/* 2. Theme accent gradient:
                    Confined to left ~35% so right 2/3 product remains vivid and clear without haze */}
                <div
                  className={`absolute inset-y-0 left-0 w-full md:w-[38%] lg:w-[35%] bg-gradient-to-r ${gradientClass} opacity-30 md:opacity-40 pointer-events-none z-[1]`}
                />

                {/* 3. Dark text-protection scrim:
                    - Desktop: covers strictly the left 1/3 (~35%-38%), leaving the right 2/3 completely unobstructed
                    - Mobile: bottom-up gradient keeping typography 100% legible while showing top product */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 via-[26%] to-transparent to-[38%] pointer-events-none z-[2]" />
                <div className="md:hidden absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/95 via-[50%] to-transparent to-[75%] pointer-events-none z-[2]" />

                {/* 4. Content & Product Showcase Layout (1/3 text on left, 2/3 product showcase on right) */}
                <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 z-10 text-white flex items-center">
                  <div
                    className={`w-full h-full flex flex-col md:flex-row items-center ${
                      isCover ? 'justify-start' : 'justify-between'
                    } gap-6 md:gap-8`}
                  >
                    {/* Left Column: Typography & Action Buttons (1/3 ratio: ~34%-38%) */}
                    <div
                      className={`w-full ${
                        isCover
                          ? 'max-w-2xl'
                          : 'max-w-[88%] sm:max-w-[80%] md:max-w-none md:w-[38%] lg:w-[35%] xl:w-[34%]'
                      } flex flex-col justify-end md:justify-center pt-24 sm:pt-28 md:pt-6 pb-6 sm:pb-8 space-y-2.5 sm:space-y-3.5 z-10`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {slide.badge && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 backdrop-blur-md">
                            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                            {slide.badge}
                          </span>
                        )}
                        {slide.tag && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md text-[10px] sm:text-xs font-mono font-semibold bg-white/10 text-slate-200 backdrop-blur-md border hairline-border">
                            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {slide.tag}
                          </span>
                        )}
                      </div>

                      <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                        {slide.title}
                      </h1>

                      {slide.subtitle && (
                        <p className="text-xs sm:text-sm font-semibold text-slate-200 font-mono line-clamp-1">
                          {slide.subtitle}
                        </p>
                      )}

                      {slide.desc && (
                        <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 xl:line-clamp-none">
                          {slide.desc}
                        </p>
                      )}

                      <div className="pt-1.5 sm:pt-2 flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        <Link
                          href={slide.link || '/products'}
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-slate-950 hover:bg-slate-100 shadow-md surface-bevel active:translate-y-0.5 transition-all"
                        >
                          <span>{slide.cta || 'Khám Phá Ngay'}</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Link>

                        {slide.showSecondaryBtn !== false && (
                          <Link
                            href={slide.secondaryLink || '/products'}
                            className="inline-flex items-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border hairline-border transition-colors"
                          >
                            {slide.secondaryCta || 'Xem tất cả sản phẩm'}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Dedicated Product Showcase for contain mode (2/3 ratio: ~62%-66%) */}
                    {!isCover && <HeroProductShowcase slide={slide} isPriority={index === 0} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows - Only visible when more than 1 slide */}
      {!isSingleSlide && (
        <>
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
        </>
      )}

      {/* Sleek Hardware Slide Telemetry / Indicators - Only visible when more than 1 slide */}
      {!isSingleSlide && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/75 dark:bg-surface-card/85 backdrop-blur-md border hairline-border surface-bevel z-20 shadow-lg">
          <div className="flex items-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  selectedIndex === index
                    ? 'w-6 bg-signal-cyan shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono tabular-nums text-slate-300 border-l hairline-border pl-2.5">
            {String(selectedIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
