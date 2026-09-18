'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Send,
  Trash2,
  Bot,
  Sparkles,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatVND } from '@/lib/utils';
import { fetchApi } from '@/lib/api';

export interface RecommendedProduct {
  name: string;
  slug: string;
  brand: string;
  category?: string;
  price: number;
  discountPrice?: number;
  image: string;
  stock: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  recommendedProducts?: RecommendedProduct[];
  isError?: boolean;
}

const STORAGE_KEY = 'techgear_chat_history';

const QUICK_PROMPTS = [
  'Màn hình OLED 240Hz',
  'Chuột gaming siêu nhẹ',
  'Bàn phím cơ dưới 2 triệu',
  'Chính sách bảo hành',
];

const INITIAL_GREETING: ChatMessage = {
  id: 'initial-greeting',
  role: 'assistant',
  content:
    'Xin chào! Tôi là **Chuyên gia Công nghệ AI của TechGear Pro** 🤖\n\nTôi sẵn sàng tư vấn chọn mua **màn hình OLED**, **chuột siêu nhẹ**, **bàn phím cơ Hall Effect** hoặc giải đáp chính sách bảo hành 24 tháng. Bạn đang tìm kiếm thiết bị nào?',
  timestamp: 0,
};

// Safe, high-contrast markdown renderer for chat bubbles
function ChatMarkdown({ content, isUser }: { content: string; isUser?: boolean }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-sm">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Bullet point check: - or *
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        // Numbered list check: 1. 2. etc.
        const numMatch = !isBullet && trimmed.match(/^(\d+)\.\s+(.*)/);
        const isNumber = Boolean(numMatch);

        let textToFormat = trimmed;
        let prefixNode: React.ReactNode = null;

        if (isBullet) {
          textToFormat = trimmed.slice(2);
          prefixNode = (
            <span
              className={
                isUser
                  ? 'text-white/80 mt-1 text-xs select-none'
                  : 'text-cyan-600 dark:text-cyan-400 mt-1 text-xs select-none'
              }
            >
              •
            </span>
          );
        } else if (isNumber && numMatch) {
          textToFormat = numMatch[2];
          prefixNode = (
            <span
              className={
                isUser
                  ? 'text-white/90 text-xs font-bold font-mono mt-0.5 shrink-0'
                  : 'text-cyan-700 dark:text-cyan-400 text-xs font-bold font-mono mt-0.5 shrink-0'
              }
            >
              {numMatch[1]}.
            </span>
          );
        }

        // Parse inline **bold**, `code`, and markdown links [label](url)
        const parts: React.ReactNode[] = [];
        let cursor = 0;
        const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
        let match;

        while ((match = regex.exec(textToFormat)) !== null) {
          if (match.index > cursor) {
            parts.push(textToFormat.substring(cursor, match.index));
          }

          if (match[1]) {
            // **bold**
            parts.push(
              <strong
                key={`${lineIdx}-${match.index}`}
                className={
                  isUser
                    ? 'font-extrabold text-white underline decoration-white/30'
                    : 'font-bold text-cyan-700 dark:text-cyan-300'
                }
              >
                {match[2]}
              </strong>
            );
          } else if (match[3]) {
            // `code`
            parts.push(
              <code
                key={`${lineIdx}-${match.index}`}
                className={
                  isUser
                    ? 'px-1.5 py-0.5 rounded text-xs font-mono bg-white/20 text-white border border-white/30'
                    : 'px-1.5 py-0.5 rounded text-xs font-mono bg-slate-100 text-cyan-800 dark:bg-slate-900 dark:text-cyan-300 border border-slate-200 dark:border-slate-700'
                }
              >
                {match[4]}
              </code>
            );
          } else if (match[5]) {
            // [label](url)
            const label = match[6];
            const rawUrl = match[7].trim();
            // Sanitize URL
            const isSafeUrl =
              rawUrl.startsWith('/') ||
              rawUrl.startsWith('https://') ||
              rawUrl.startsWith('http://');

            if (isSafeUrl) {
              parts.push(
                <a
                  key={`${lineIdx}-${match.index}`}
                  href={rawUrl}
                  target={rawUrl.startsWith('/') ? undefined : '_blank'}
                  rel={rawUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
                  className={
                    isUser
                      ? 'underline font-semibold text-white hover:text-white/80'
                      : 'underline font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300'
                  }
                >
                  {label}
                </a>
              );
            } else {
              parts.push(label);
            }
          }
          cursor = regex.lastIndex;
        }

        if (cursor < textToFormat.length) {
          parts.push(textToFormat.substring(cursor));
        }

        if (isBullet || isNumber) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 ml-1">
              {prefixNode}
              <div className="flex-1">{parts}</div>
            </div>
          );
        }

        return <p key={lineIdx}>{parts}</p>;
      })}
    </div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Mark client mounted and load chat history from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // LocalStorage unavailable or parse error, keep default
    }
  }, []);

  // Sync chat history to localStorage (keep last 30 messages max)
  useEffect(() => {
    if (!isMounted) return;
    try {
      const hasUserMessage = messages.some((m) => m.role === 'user');
      if (hasUserMessage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage quota / access errors
    }
  }, [messages, isMounted]);

  // Handle ESC key and click-outside to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        widgetContainerRef.current &&
        !widgetContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Cleanup pending AI request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setShowTooltip(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    // Update local UI state with the new user message
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send ONLY prior messages in history (excluding initial greeting and error states)
      const history = messages
        .filter((m) => m.id !== 'initial-greeting' && !m.isError)
        .slice(-10)
        .map((m) => ({
          role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          text: m.content,
        }));

      const response = await fetchApi<{
        reply: string;
        recommendedProducts: RecommendedProduct[];
      }>('/chat', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          message: messageContent,
          history,
        }),
      });

      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.data.reply,
          timestamp: Date.now(),
          recommendedProducts: response.data.recommendedProducts || [],
        };
        setMessages((prev) => [...prev, aiMessage]);
        if (!isOpen) {
          setHasUnread(true);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content:
            response.message ||
            'Rất tiếc, TechGear AI đang gián đoạn kết nối. Quý khách vui lòng thử lại sau giây lát!',
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User aborted the request, ignore silently
        return;
      }
      const errorMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: 'Không thể kết nối đến máy chủ TechGear AI. Vui lòng kiểm tra lại kết nối mạng!',
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleRetry = (errorMsg: ChatMessage) => {
    // Find the user message that led to this error
    const errorIdx = messages.findIndex((m) => m.id === errorMsg.id);
    const searchPool = errorIdx > -1 ? messages.slice(0, errorIdx) : messages;
    const lastUserMsg = [...searchPool].reverse().find((m) => m.role === 'user');

    if (lastUserMsg) {
      // Remove the error message from view and re-send
      setMessages((prev) => prev.filter((m) => m.id !== errorMsg.id));
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa lịch sử trò chuyện và bắt đầu lại?')) {
      const resetMsg: ChatMessage = {
        ...INITIAL_GREETING,
        timestamp: Date.now(),
      };
      setMessages([resetMsg]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProductNavigate = () => {
    // Automatically close chat on mobile screens so the product page is immediately visible
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={widgetContainerRef}>
      {/* Floating Chat Bubble & Greeting Tooltip (Bottom-Right) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
        {/* Tooltip Greeting Balloon (shown before first open) */}
        <AnimatePresence>
          {isMounted && !isOpen && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative mb-3 mr-1 max-w-xs bg-slate-900/95 dark:bg-slate-850/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-cyan-500/30 flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsOpen(true)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-semibold text-cyan-300 flex items-center gap-1">
                  TechGear AI Tech Expert <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
                </p>
                <p className="text-slate-300 line-clamp-2 mt-0.5">
                  Cần tư vấn màn hình, chuột, phím cơ? Bấm để chat ngay!
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-slate-400 hover:text-white p-1 transition-colors"
                title="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {/* Little speech bubble arrow */}
              <div className="absolute -bottom-2 right-6 w-3 h-3 bg-slate-900 dark:bg-slate-850 border-b border-r border-cyan-500/30 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Floating Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-gradient-to-tr from-cyan-500 via-cyan-400 to-blue-600 text-white shadow-cyan-500/35 hover:shadow-cyan-500/50'
          }`}
          aria-label={isOpen ? 'Đóng cửa sổ chat' : 'Mở tư vấn AI TechGear'}
          title="Tư vấn AI TechGear Pro"
        >
          {isOpen ? (
            <ChevronDown className="w-6 h-6 transition-transform group-hover:translate-y-0.5" />
          ) : (
            <>
              <Bot className="w-7 h-7 transition-transform group-hover:rotate-6" />
              {/* Pulsing indicator ring */}
              <span className="absolute -inset-1 rounded-full bg-cyan-400/25 animate-ping -z-10" />
            </>
          )}

          {/* Unread badge indicator */}
          {!isOpen && hasUnread && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-dark-900 animate-bounce" />
          )}
        </motion.button>
      </div>

      {/* Main Popup Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Cửa sổ chat tư vấn TechGear AI"
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[440px] h-[calc(100dvh-6.5rem)] sm:h-[620px] max-h-[720px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">TechGear AI Expert</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Trực tuyến • Tư vấn gaming gear 24/7
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-rose-400 transition-colors"
                  title="Xóa đoạn chat & bắt đầu lại"
                  aria-label="Xóa đoạn chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                  title="Thu nhỏ"
                  aria-label="Thu nhỏ chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (Message stream) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-dark-900/60">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`flex gap-2.5 max-w-[90%] ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      {!isUser && (
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                            msg.isError
                              ? 'bg-rose-500 text-white'
                              : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white'
                          }`}
                        >
                          {msg.isError ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      {/* Content Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${
                          isUser
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-xs'
                            : msg.isError
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-tl-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-xs'
                        }`}
                      >
                        <ChatMarkdown content={msg.content} isUser={isUser} />
                      </div>
                    </div>

                    {/* Retry button for error states */}
                    {msg.isError && (
                      <div className="mt-1.5 pl-9 flex items-center gap-2">
                        <button
                          onClick={() => handleRetry(msg)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Thử lại</span>
                        </button>
                      </div>
                    )}

                    {/* Recommended Products Stack */}
                    {!isUser && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="mt-3 pl-9 w-full space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sản phẩm TechGear Pro gợi ý:</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.recommendedProducts.map((prod) => {
                            const hasDiscount =
                              prod.discountPrice &&
                              prod.discountPrice > 0 &&
                              prod.discountPrice < prod.price;
                            const finalPrice = hasDiscount ? prod.discountPrice! : prod.price;
                            const isOutOfStock = prod.stock <= 0;

                            return (
                              <div
                                key={prod.slug}
                                className="group relative flex items-center justify-between gap-3 p-2.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                {/* Thumbnail and Details as Link */}
                                <Link
                                  href={`/products/${prod.slug}`}
                                  onClick={handleProductNavigate}
                                  className="flex items-center gap-3 flex-1 min-w-0"
                                >
                                  {/* Thumbnail */}
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={
                                        prod.image ||
                                        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80'
                                      }
                                      alt={prod.name}
                                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80';
                                      }}
                                    />
                                  </div>

                                  {/* Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                                        {prod.brand}
                                      </span>
                                      {isOutOfStock ? (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                          Tạm hết
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          Còn hàng ({prod.stock})
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                      {prod.name}
                                    </h4>

                                    <div className="flex items-baseline gap-1.5 mt-1">
                                      <span className="text-xs font-bold text-rose-600 dark:text-signal-rose">
                                        {formatVND(finalPrice)}
                                      </span>
                                      {hasDiscount && (
                                        <span className="text-[10px] line-through text-slate-400">
                                          {formatVND(prod.price)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>

                                {/* Explicit 'Xem chi tiết' Action Button */}
                                <Link
                                  href={`/products/${prod.slug}`}
                                  onClick={handleProductNavigate}
                                  className="self-center flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-700 dark:text-cyan-300 hover:text-white dark:hover:text-white border border-cyan-500/30 text-xs font-semibold transition-all shrink-0 active:scale-95 group/btn"
                                  title="Xem chi tiết sản phẩm"
                                >
                                  <span className="hidden sm:inline">Xem chi tiết</span>
                                  <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chips */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-850/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  Gợi ý:
                </span>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isLoading ? 'TechGear AI đang suy nghĩ...' : 'Nhập câu hỏi hoặc yêu cầu tư vấn...'}
                  disabled={isLoading}
                  maxLength={1000}
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl border border-transparent focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder:text-slate-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-500/20 active:scale-95 shrink-0"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
                <span>Nhấn Enter để gửi tin (tối đa 1000 ký tự)</span>
                <span>TechGear Pro AI Assistant</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
