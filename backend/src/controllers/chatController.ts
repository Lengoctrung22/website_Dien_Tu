import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { ENV } from '../config/env';

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatHistoryItem[];
}

export async function handleChat(req: Request<{}, {}, ChatRequestBody>, res: Response) {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống.',
      });
    }

    const userMessage = message.trim();
    if (userMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn vượt quá độ dài tối đa cho phép (2000 ký tự).',
      });
    }

    const apiKey = ENV.GEMINI_API_KEY;
    const primaryModel = ENV.GEMINI_MODEL || 'gemini-2.5-flash';
    const fallbackModel = primaryModel === 'gemini-3.6-flash' ? 'gemini-2.5-flash' : 'gemini-3.6-flash';
    const candidateModels = Array.from(
      new Set([primaryModel, fallbackModel, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'])
    );

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'Hệ thống AI chưa được cấu hình khóa API. Vui lòng liên hệ quản trị viên!',
      });
    }

    // 1. Fetch active products to ground AI responses
    const products = await Product.find({ isActive: true })
      .select('name slug brand category price discountPrice stock specs description images')
      .lean();

    // Build catalog summary for grounding
    let catalogSummary = '';
    if (products.length === 0) {
      catalogSummary = 'Hiện tại cửa hàng đang cập nhật sản phẩm.';
    } else {
      catalogSummary = products
        .map((p) => {
          const price = p.price || 0;
          const discPrice = p.discountPrice || 0;
          const priceStr =
            discPrice > 0 && discPrice < price
              ? `${discPrice.toLocaleString('vi-VN')}đ (Giá gốc: ${price.toLocaleString('vi-VN')}đ)`
              : `${price.toLocaleString('vi-VN')}đ`;
          const stock = typeof p.stock === 'number' ? p.stock : 0;
          const stockStr = stock > 0 ? `Còn hàng (${stock} cái)` : 'Tạm hết hàng';
          const specsList: string[] = [];
          if (p.specs && typeof p.specs === 'object') {
            for (const [k, v] of Object.entries(p.specs)) {
              if (v !== undefined && v !== null && v !== '') {
                specsList.push(`${k}: ${v}`);
              }
            }
          }
          const specsStr = specsList.length > 0 ? ` | Thông số: ${specsList.join(', ')}` : '';
          return `- Tên: "${p.name}" | Slug: "${p.slug}" | Hãng: ${p.brand} | Loại: ${p.category} | Giá: ${priceStr} | Tình trạng: ${stockStr}${specsStr}`;
        })
        .join('\n');
    }

    // 2. System Instruction Prompt
    const systemInstruction = `Bạn là Chuyên gia tư vấn công nghệ ảo của TechGear Pro (TechGear Pro Virtual AI Tech Expert) - thương hiệu hàng đầu về phụ kiện máy tính, linh kiện và gaming gear cao cấp tại Việt Nam.

PHONG CÁCH & TÍNH CÁCH:
- Nhiệt tình, thân thiện, am hiểu chuyên sâu về gaming gear: màn hình OLED/Fast-IPS 240Hz-360Hz, bàn phím cơ Custom & Magnetic Hall Effect Rapid Trigger, chuột gaming siêu nhẹ PAW3395/PAW3950 8000Hz, tai nghe esports âm thanh vòm không dây độ trễ siêu thấp.
- Tư vấn khách quan, giải thích rõ ưu nhược điểm kỹ thuật, phù hợp với nhu cầu và ngân sách của từng khách hàng.
- Ngôn từ: Tiếng Việt tự nhiên, chuyên nghiệp, truyền cảm hứng gaming.

QUY TẮC BẮT BUỘC:
1. PHẠM VI TƯ VẤN:
   - CHỈ tư vấn, so sánh tính năng và báo giá các sản phẩm hiện có trong danh mục của TechGear Pro được cung cấp dưới đây.
   - Chính sách TechGear Pro: Bảo hành chính hãng 24 tháng, 1-đổi-1 trong 30 ngày đầu đối với lỗi nhà sản xuất; bảo dưỡng, vệ sinh miễn phí trọn đời tại showroom; giao hàng hỏa tốc 2h tại HN/HCM và toàn quốc 1-3 ngày; miễn phí vận chuyển cho đơn từ 1.000.000đ.
   - TỪ CHỐI LỊCH SỰ: Nếu khách hàng hỏi những câu hỏi ngoài lề không liên quan đến công nghệ phụ kiện máy tính hoặc cửa hàng TechGear Pro (như chính trị, ẩm thực, văn học, toán học, thời tiết...), hãy từ chối một cách lịch sự và khéo léo mời khách hàng đặt câu hỏi về gaming gear và phụ kiện của TechGear Pro.

2. KIỂM TRA TỒN KHO:
   - Chỉ nhiệt tình gợi ý các sản phẩm CÒN HÀNG (tồn kho > 0).
   - Nếu khách hàng hỏi về một sản phẩm đã HẾT HÀNG, hãy thông báo chân thành rằng sản phẩm hiện đang tạm hết và chủ động đề xuất sản phẩm thay thế tương đương còn hàng trong shop.
   - Tuyệt đối không tự bịa ra sản phẩm hoặc thông số không có trong danh sách.

3. ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC JSON):
Bạn BẮT BUỘC phải trả về phản hồi dưới định dạng JSON theo đúng schema sau:
{
  "reply": "Nội dung trả lời tư vấn cho khách bằng tiếng Việt. Có thể dùng markdown (**in đậm**, bullet points - gạch đầu dòng) để làm nổi bật thông tin sản phẩm và thông số.",
  "recommendedProductSlugs": ["slug-chinh-xac-1", "slug-chinh-xac-2"]
}

LƯU Ý VỀ recommendedProductSlugs:
- "recommendedProductSlugs" là mảng chứa các slug CHÍNH XÁC từ danh mục dưới đây mà bạn nhắc đến hoặc gợi ý khách mua trong câu trả lời (tối đa 3 sản phẩm nổi bật nhất).
- Nếu câu trả lời là lời chào hỏi thông thường, trả lời chính sách, hoặc từ chối câu hỏi ngoài lề không gợi ý sản phẩm cụ thể nào, hãy để mảng rỗng: [].

DANH MỤC SẢN PHẨM TECHGEAR PRO:
${catalogSummary}`;

    // 3. Prepare Gemini API Request with Strictly Valid Multi-Turn History
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      // Filter out invalid items
      const validHistory = history.filter(
        (item) =>
          item &&
          (item.role === 'user' || item.role === 'model') &&
          typeof item.text === 'string' &&
          item.text.trim()
      );

      // Gemini multi-turn chat MUST start with role: 'user'. Drop any leading 'model' turns.
      let firstUserIdx = validHistory.findIndex((h) => h.role === 'user');
      const usableHistory = firstUserIdx !== -1 ? validHistory.slice(firstUserIdx) : [];

      // Keep last 10 turns max
      const trimmedHistory = usableHistory.slice(-10);

      for (const item of trimmedHistory) {
        // Prevent duplicate consecutive user turns when client already appended userMessage
        if (
          item.role === 'user' &&
          contents.length > 0 &&
          contents[contents.length - 1].role === 'user'
        ) {
          continue;
        }
        contents.push({
          role: item.role,
          parts: [{ text: item.text.trim() }],
        });
      }
    }

    // If the last turn in contents is already the current user message, avoid duplicate turn
    const lastTurn = contents[contents.length - 1];
    if (!lastTurn || lastTurn.role !== 'user' || lastTurn.parts[0]?.text !== userMessage) {
      // If previous turn was 'user', drop it or ensure alternation
      if (lastTurn && lastTurn.role === 'user') {
        contents.pop();
      }
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });
    }

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            reply: {
              type: 'STRING',
              description: 'Nội dung câu trả lời tư vấn cho khách hàng bằng tiếng Việt (có thể dùng markdown bold, bullet points).',
            },
            recommendedProductSlugs: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Danh sách slug chính xác của sản phẩm TechGear Pro được đề xuất.',
            },
          },
          required: ['reply', 'recommendedProductSlugs'],
        },
        temperature: 0.7,
      },
    };

    let reply = '';
    let recommendedSlugs: string[] = [];
    let rawText: string | null = null;
    let lastStatusCode = 200;

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];
      const hasNextFallback = i < candidateModels.length - 1;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(25000),
        });

        if (response.ok) {
          const responseData = (await response.json()) as any;
          const parts = responseData.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts) && parts.length > 0) {
            const textParts = parts
              .map((p: any) => (typeof p.text === 'string' ? p.text : ''))
              .filter(Boolean);
            rawText = textParts.join('\n');
          } else {
            rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || null;
          }
          break; // Successfully got response from currentModel
        }

        lastStatusCode = response.status;
        const errorText = await response.text();
        console.warn(`[Gemini API Error] Model ${currentModel} returned ${response.status}: ${errorText.slice(0, 300)}`);

        // If 429 or 503 and another model is available, switch immediately to fallback model
        if ((response.status === 429 || response.status === 503) && hasNextFallback) {
          console.log(`[Gemini Fallback] Model ${currentModel} returned ${response.status}, switching immediately to ${candidateModels[i + 1]}...`);
          continue;
        }

        // If 429 on final fallback
        if (response.status === 429) {
          return res.status(429).json({
            success: false,
            message: 'Hệ thống AI đang tiếp nhận quá nhiều yêu cầu tư vấn cùng lúc. Quý khách vui lòng đợi vài giây và thử lại nhé!',
          });
        }

        return res.status(502).json({
          success: false,
          message: 'Trợ lý AI TechGear hiện đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau giây lát!',
        });
      } catch (networkErr: any) {
        console.error(`[Gemini Network Error] Model ${currentModel}:`, networkErr?.message || networkErr);
        if (hasNextFallback) {
          console.log(`[Gemini Fallback] Switching from ${currentModel} to ${candidateModels[i + 1]} due to network error...`);
          continue;
        }
        return res.status(500).json({
          success: false,
          message: 'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại kết nối mạng!',
        });
      }
    }

    if (rawText === null) {
      if (lastStatusCode === 429) {
        return res.status(429).json({
          success: false,
          message: 'Hệ thống AI đang tiếp nhận quá nhiều yêu cầu tư vấn cùng lúc. Quý khách vui lòng đợi vài giây và thử lại nhé!',
        });
      }
      return res.status(502).json({
        success: false,
        message: 'Trợ lý AI TechGear hiện đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau giây lát!',
      });
    }

    if (!rawText.trim()) {
      reply = 'Xin lỗi, TechGear AI chưa thể xử lý yêu cầu lúc này. Bạn vui lòng gửi lại câu hỏi hoặc liên hệ hotline nhé!';
    } else {
      let cleanJson = rawText.trim();
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      // Extract JSON object boundary if surrounded by markdown commentary
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
      }

      let parsedSuccessfully = false;
      try {
        const parsed = JSON.parse(cleanJson);
        if (typeof parsed.reply === 'string' && parsed.reply.trim()) {
          reply = parsed.reply.trim();
          parsedSuccessfully = true;
        }
        if (Array.isArray(parsed.recommendedProductSlugs)) {
          recommendedSlugs = parsed.recommendedProductSlugs.filter(
            (s: any): s is string => typeof s === 'string' && s.trim().length > 0
          );
        }
      } catch (parseErr) {
        console.warn('[Gemini Parse JSON Warning]', parseErr);
      }

      // Robust fallback extraction if JSON.parse failed (e.g. unescaped quotes inside reply string)
      if (!parsedSuccessfully) {
        // 1. Extract slugs
        const slugsMatch = cleanJson.match(/"recommendedProductSlugs"\s*:\s*\[([\s\S]*?)\]/i);
        if (slugsMatch && slugsMatch[1]) {
          const matches = slugsMatch[1].match(/"([^"]+)"/g);
          if (matches) {
            recommendedSlugs = matches.map((m: string) => m.replace(/"/g, '').trim());
          }
        }

        // 2. Extract reply without truncating on unescaped internal quotes
        const matchBefore = cleanJson.match(/"reply"\s*:\s*"([\s\S]*?)"\s*,\s*"recommendedProductSlugs"/i);
        const matchAfter = cleanJson.match(/"reply"\s*:\s*"([\s\S]*?)"\s*\}\s*$/i);
        const matchSingle = cleanJson.match(/"reply"\s*:\s*"([\s\S]*?)"\s*$/i);

        let rawReply = '';
        if (matchBefore && matchBefore[1]) {
          rawReply = matchBefore[1];
        } else if (matchAfter && matchAfter[1]) {
          rawReply = matchAfter[1];
        } else if (matchSingle && matchSingle[1]) {
          rawReply = matchSingle[1];
        } else {
          rawReply = cleanJson
            .replace(/^[{\s]*"reply"\s*:\s*"?/i, '')
            .replace(/"?\s*,\s*"recommendedProductSlugs"[\s\S]*$/i, '')
            .replace(/"?\s*\}?\s*$/i, '')
            .trim();
        }

        reply = rawReply
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .trim();
      }
    }

    // 4. Retrieve matching product details with Slug Normalization & Deduplication
    const productMap = new Map(products.map((p) => [p.slug.toLowerCase().trim(), p]));
    const recommendedProducts: Array<{
      name: string;
      slug: string;
      brand: string;
      category: string;
      price: number;
      discountPrice: number;
      image: string;
      stock: number;
    }> = [];

    const seenSlugs = new Set<string>();

    for (const rawSlug of recommendedSlugs) {
      if (typeof rawSlug !== 'string') continue;
      const normalizedSlug = rawSlug.trim().toLowerCase();
      if (!normalizedSlug || seenSlugs.has(normalizedSlug)) continue;
      seenSlugs.add(normalizedSlug);

      const matched = productMap.get(normalizedSlug);
      if (matched) {
        recommendedProducts.push({
          name: matched.name,
          slug: matched.slug,
          brand: matched.brand,
          category: matched.category,
          price: matched.price || 0,
          discountPrice: matched.discountPrice || 0,
          image: matched.images?.[0] || '',
          stock: typeof matched.stock === 'number' ? matched.stock : 0,
        });
      }

      // Max 4 recommended products
      if (recommendedProducts.length >= 4) break;
    }

    return res.json({
      success: true,
      data: {
        reply,
        recommendedProducts,
      },
    });
  } catch (error: any) {
    console.error('[handleChat Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra trong quá trình xử lý tin nhắn.',
    });
  }
}
