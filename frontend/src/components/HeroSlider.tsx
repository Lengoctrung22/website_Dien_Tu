'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Zap, ArrowRight, Award } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getBannerTheme } from '@/lib/bannerThemes';
import {
  useBlendedProductImage,
  getProductBlendStyles,
  getScenicFeatherStyles,
  ImageBlendMode,
} from '@/lib/imageBlender';

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
    removeWhiteBg: false,
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
  if (src.startsWith('/') || src.startsWith('data:')) return true;
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

function HeroProductShowcase({
  slide,
  displaySrc,
  blendMode,
  isPriority,
  accentColor,
}: {
  slide: HeroSlideItem;
  displaySrc: string;
  blendMode: ImageBlendMode;
  isPriority: boolean;
  accentColor: string;
}) {
  const isCutout = blendMode === 'cutout';
  const isSoftbox = blendMode === 'softbox';
  const imageStyle = isCutout
    ? undefined
    : isSoftbox
    ? getProductBlendStyles(true, 'softbox')
    : getScenicFeatherStyles();

  return (
    <>
      {/* Desktop/Tablet: dedicated 2/3 showcase blended seamlessly with slide backdrop */}
      <div className="hidden md:flex md:w-[60%] lg:w-[62%] xl:w-[64%] h-full items-center justify-center p-4 sm:p-6 lg:p-8 relative isolate">
        {/* Seamless Studio Lighting Stage (no opaque box or harsh vertical seam) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* 1. Theme-colored ambient studio halo */}
          <div
            className="w-[86%] h-[82%] rounded-full blur-3xl opacity-50 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse at 52% 48%, ${accentColor}55 0%, ${accentColor}20 48%, transparent 76%)`,
            }}
          />

          {/* 2. Soft central studio key-light behind product */}
          <div
            className="absolute w-[68%] h-[64%] rounded-full blur-2xl"
            style={{
              background: isCutout
                ? 'radial-gradient(ellipse at 50% 48%, rgba(226, 232, 240, 0.22) 0%, rgba(148, 163, 184, 0.08) 50%, transparent 75%)'
                : 'radial-gradient(ellipse at 50% 48%, rgba(255, 255, 255, 0.14) 0%, transparent 70%)',
            }}
          />

          {/* 3. Grounded contact shadow ellipse beneath product */}
          <div className="absolute bottom-7 lg:bottom-9 w-[58%] h-5 bg-black/80 rounded-[100%] blur-xl" />
        </div>

        <div className="relative w-full h-[300px] sm:h-[360px] md:h-[400px] lg:h-[440px] max-h-[88%] transition-transform duration-500 ease-out hover:scale-[1.03] flex items-center justify-center">
          <Image
            src={displaySrc || slide.image}
            alt={slide.title}
            fill
            sizes="(max-width: 768px) 100vw, 64vw"
            priority={isPriority}
            unoptimized={true}
            className={`${
              !isCutout
                ? 'object-cover rounded-3xl'
                : 'object-contain'
            } object-center transition-all duration-500 ${
              isCutout
                ? 'drop-shadow-[0_25px_45px_rgba(0,0,0,0.85)]'
                : 'drop-shadow-[0_18px_36px_rgba(0,0,0,0.65)]'
            }`}
            style={imageStyle}
          />
        </div>
      </div>

      {/* Mobile: crisp product display in upper-right without colliding with typography */}
      <div className="md:hidden absolute right-2 top-3 w-[42%] h-[135px] sm:w-[45%] sm:h-[155px] pointer-events-none flex items-center justify-center z-0 isolate">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-45"
          style={{
            background: `radial-gradient(circle, ${accentColor}55 0%, transparent 72%)`,
          }}
        />
        <div className="relative w-full h-full">
          <Image
            src={displaySrc || slide.image}
            alt={slide.title}
            fill
            sizes="42vw"
            priority={isPriority}
            unoptimized={true}
            className="object-contain object-center drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
            style={imageStyle}
          />
        </div>
      </div>
    </>
  );
}

function HeroSlideCard({
  slide,
  index,
}: {
  slide: HeroSlideItem;
  index: number;
}) {
  const themeConfig = slide.theme ? getBannerTheme(slide.theme) : getBannerTheme('purple');
  const gradientClass = themeConfig
    ? themeConfig.gradient
    : slide.color || 'from-purple-600/80 via-indigo-950/70 to-transparent';
  const accentColor = themeConfig?.accentColor || '#a855f7';
  const isCover = slide.imageFit === 'cover';

  const { displaySrc, blendMode, hasLightBg } = useBlendedProductImage(
    slide.image,
    Boolean(slide.removeWhiteBg)
  );

  // Suppress blurred background image when image has a white/light studio box or cutout mode
  // so it never washes out the dark banner into a muddy gray
  const showAmbientPhotoBackdrop =
    isCover || (!slide.removeWhiteBg && !hasLightBg && blendMode === 'scenic');

  return (
    <div className="relative flex-[0_0_100%] min-w-0 h-[380px] sm:h-[460px] md:h-[520px] bg-[#070b14] overflow-hidden">
      {/* 1. Base Atmospheric Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {showAmbientPhotoBackdrop && (
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority={index === 0}
            unoptimized={shouldUnoptimize(slide.image)}
            className={`object-cover object-center transition-all duration-700 ${
              isCover
                ? 'scale-100 opacity-85'
                : 'scale-125 blur-3xl opacity-25 saturate-150 brightness-75'
            }`}
          />
        )}

        {/* Full-banner harmonious theme aura (replaces muddy white blur) */}
        <div
          className="absolute inset-0 opacity-65"
          style={{
            background: `
              radial-gradient(ellipse 65% 80% at 70% 50%, ${accentColor}30 0%, ${accentColor}10 45%, transparent 75%),
              radial-gradient(ellipse 50% 60% at 15% 20%, ${accentColor}22 0%, transparent 65%)
            `,
          }}
        />
      </div>

      {/* 2. Dark text-protection scrim on the left, smoothly dissolving across the center */}
      <div
        className={`hidden md:block absolute inset-0 pointer-events-none z-[1] ${
          isCover
            ? 'bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/75 via-[42%] to-[#070b14]/20'
            : 'bg-gradient-to-r from-[#070b14] via-[#070b14]/88 via-[34%] to-transparent to-[65%]'
        }`}
      />
      <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/92 via-[52%] to-transparent to-[82%] pointer-events-none z-[1]" />

      {/* 3. Theme accent gradient ABOVE the dark scrim so theme color is rich and visible */}
      <div
        className={`absolute inset-y-0 left-0 w-full md:w-[55%] bg-gradient-to-r ${gradientClass} opacity-45 md:opacity-55 pointer-events-none z-[2] mix-blend-screen`}
      />

      {/* 4. Subtle studio floor vignette at bottom for telemetry indicator legibility */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050811]/90 via-[#050811]/40 to-transparent pointer-events-none z-[2]" />

      {/* 5. Content & Product Showcase Layout (with safe horizontal padding so < > buttons never overlap text) */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-14 md:px-16 lg:px-20 z-10 text-white flex items-center">
        <div
          className={`w-full h-full flex flex-col md:flex-row items-center ${
            isCover ? 'justify-start' : 'justify-between'
          } gap-6 md:gap-8`}
        >
          {/* Left Column: Typography & Action Buttons */}
          <div
            className={`w-full ${
              isCover
                ? 'max-w-2xl'
                : 'max-w-[88%] sm:max-w-[80%] md:max-w-none md:w-[40%] lg:w-[38%] xl:w-[36%]'
            } flex flex-col justify-end md:justify-center pt-24 sm:pt-28 md:pt-6 pb-6 sm:pb-8 space-y-2.5 sm:space-y-3.5 z-10`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {slide.badge && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-md border ${
                    themeConfig
                      ? `${themeConfig.badgeBg} ${themeConfig.badgeText} ${themeConfig.badgeBorder}`
                      : 'bg-white/10 text-white border-white/20'
                  }`}
                >
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

            <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-tight drop-shadow-md">
              {slide.title}
            </h1>

            {slide.subtitle && (
              <p className="text-xs sm:text-sm font-semibold text-slate-200/95 font-mono line-clamp-1">
                {slide.subtitle}
              </p>
            )}

            {slide.desc && (
              <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 md:line-clamp-3 leading-relaxed">
                {slide.desc}
              </p>
            )}

            <div className="pt-1.5 sm:pt-2 flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <Link
                href={(() => {
                  const raw = (slide.link || '').trim();
                  if ((raw.startsWith('/') && !raw.startsWith('//')) || /^https?:\/\//i.test(raw)) {
                    return raw;
                  }
                  return '/products';
                })()}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-slate-950 hover:bg-slate-100 shadow-lg surface-bevel active:translate-y-0.5 transition-all"
              >
                <span>{slide.cta || 'Khám Phá Ngay'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>

              {slide.showSecondaryBtn !== false && (
                <Link
                  href={(() => {
                    const raw = (slide.secondaryLink || '').trim();
                    if ((raw.startsWith('/') && !raw.startsWith('//')) || /^https?:\/\//i.test(raw)) {
                      return raw;
                    }
                    return '/products';
                  })()}
                  className="inline-flex items-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border hairline-border transition-colors"
                >
                  {slide.secondaryCta || 'Xem tất cả sản phẩm'}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Dedicated Product Showcase for contain mode */}
          {!isCover && (
            <HeroProductShowcase
              slide={slide}
              displaySrc={displaySrc}
              blendMode={blendMode}
              isPriority={index === 0}
              accentColor={accentColor}
            />
          )}
        </div>
      </div>
    </div>
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
    <div className="relative w-full overflow-hidden rounded-2xl group border hairline-border surface-bevel shadow-2xl bg-[#070b14]">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => {
            const slideKey = slide._id || slide.id || index;
            return <HeroSlideCard key={slideKey} slide={slide} index={index} />;
          })}
        </div>
      </div>

      {/* Navigation Arrows - Positioned safely outside text bounds */}
      {!isSingleSlide && (
        <>
          <button
            onClick={scrollPrev}
            className="hidden sm:flex absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-950/75 hover:bg-slate-900 text-white items-center justify-center backdrop-blur-md border hairline-border surface-bevel transition-all opacity-0 group-hover:opacity-100 z-20 hover:scale-105 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="hidden sm:flex absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-950/75 hover:bg-slate-900 text-white items-center justify-center backdrop-blur-md border hairline-border surface-bevel transition-all opacity-0 group-hover:opacity-100 z-20 hover:scale-105 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </>
      )}

      {/* Sleek Hardware Slide Telemetry / Indicators - Only visible when more than 1 slide */}
      {!isSingleSlide && (
        <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/80 dark:bg-surface-card/85 backdrop-blur-md border hairline-border surface-bevel z-20 shadow-lg">
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
