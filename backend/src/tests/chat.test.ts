import assert from 'assert';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { handleChat } from '../controllers/chatController';

async function runChatTests() {
  console.log('🧪 Starting TechGear Pro AI Chat Feature Tests...\n');

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  try {
    // 1. Setup sample products in isolated memory database
    console.log('1. Setting up mock products in MongoMemoryServer...');
    await Product.create([
      {
        name: 'Màn hình Gaming ASUS ROG Swift OLED PG27AQDM 27 inch 240Hz 0.03ms',
        slug: 'asus-rog-swift-oled-pg27aqdm-240hz',
        category: 'monitor',
        brand: 'ASUS',
        price: 24990000,
        discountPrice: 22990000,
        stock: 8,
        images: ['https://example.com/asus-oled.jpg'],
        specs: {
          panelType: 'OLED',
          refreshRate: '240Hz',
          resolution: '2K QHD (2560x1440)',
          responseTime: '0.03ms',
        },
        description: 'Màn hình OLED gaming đỉnh cao cho game thủ FPS và Esports.',
        isActive: true,
      },
      {
        name: 'Chuột Gaming Siêu Nhẹ Logitech G Pro X Superlight 2 Wireless 60g',
        slug: 'logitech-g-pro-x-superlight-2',
        category: 'mouse',
        brand: 'Logitech',
        price: 3890000,
        discountPrice: 3490000,
        stock: 15,
        images: ['https://example.com/logitech-superlight-2.jpg'],
        specs: {
          sensor: 'HERO 2 32K DPI',
          weight: '60g',
          pollingRate: '4000Hz',
          connection: 'Lightspeed Wireless',
        },
        description: 'Chuột chơi game không dây huyền thoại của pro players.',
        isActive: true,
      },
      {
        name: 'Bàn phím cơ DrunkDeer A75 Rapid Trigger Hall Effect',
        slug: 'drunkdeer-a75-rapid-trigger',
        category: 'keyboard',
        brand: 'DrunkDeer',
        price: 2590000,
        discountPrice: 2350000,
        stock: 0, // Out of stock to test stock checking
        images: ['https://example.com/drunkdeer-a75.jpg'],
        specs: {
          switch: 'Magnetic Switch Hall Effect',
          rapidTrigger: '0.1mm - 3.6mm',
          layout: '75%',
        },
        description: 'Bàn phím cơ nam châm Rapid Trigger siêu nhạy.',
        isActive: true,
      },
    ]);

    const productCount = await Product.countDocuments();
    assert.strictEqual(productCount, 3, 'Should have created 3 test products');
    console.log('   ✅ Setup complete with 3 mock products.');

    // Helper to simulate express req/res
    function createMockReqRes(body: any) {
      let statusCode = 200;
      let jsonResult: any = null;

      const req: any = { body };
      const res: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          jsonResult = data;
          return this;
        },
      };

      return {
        req,
        res,
        getStatus: () => statusCode,
        getJSON: () => jsonResult,
      };
    }

    // 2. Test Empty / Invalid Message Validation
    console.log('\n2. Testing Validation on Empty / Invalid Messages...');
    {
      const { req, res, getStatus, getJSON } = createMockReqRes({ message: '' });
      await handleChat(req, res);
      assert.strictEqual(getStatus(), 400, 'Empty message should return 400');
      assert.strictEqual(getJSON().success, false);
      assert.ok(getJSON().message.includes('không được để trống'));
      console.log('   ✅ PASS: Empty string rejected with 400');
    }
    {
      const { req, res, getStatus, getJSON } = createMockReqRes({ message: '   ' });
      await handleChat(req, res);
      assert.strictEqual(getStatus(), 400, 'Whitespace message should return 400');
      console.log('   ✅ PASS: Whitespace-only message rejected with 400');
    }
    {
      const { req, res, getStatus, getJSON } = createMockReqRes({});
      await handleChat(req, res);
      assert.strictEqual(getStatus(), 400, 'Missing message should return 400');
      console.log('   ✅ PASS: Missing message rejected with 400');
    }

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // 3. Test Real Gemini API Call with Product Consultation Query
    console.log('\n3. Testing Product Consultation with Gemini (Primary or Fallback)...');
    await delay(2000);
    {
      const { req, res, getStatus, getJSON } = createMockReqRes({
        message: 'Tôi muốn tìm mua một chiếc màn hình gaming OLED tần số quét cao 240Hz để chơi CS2 và Valorant. Shop có mẫu nào tư vấn giúp tôi?',
      });

      await handleChat(req, res);
      const status = getStatus();
      const data = getJSON();

      if (status === 429 || status === 502 || status === 503) {
        console.log(`   ⚠️ API free-tier rate-limited or busy (${status}); friendly response verified.`);
        assert.strictEqual(data.success, false);
        assert.ok(
          data.message.includes('quá nhiều yêu cầu') ||
          data.message.includes('đợi vài giây') ||
          data.message.includes('đang bận') ||
          data.message.includes('gián đoạn kết nối')
        );
        console.log('   ✅ PASS: Rate-limited or busy API handled gracefully with friendly message');
      } else {
        assert.strictEqual(status, 200, `Expected 200 or rate-limit status, got ${status}`);
        assert.strictEqual(data.success, true, 'Chat response success should be true');
        assert.ok(typeof data.data.reply === 'string' && data.data.reply.length > 20, 'Reply should be a detailed string');
        assert.ok(Array.isArray(data.data.recommendedProducts), 'recommendedProducts should be an array');
        
        console.log('   🤖 AI Reply Snippet:\n   ', data.data.reply.slice(0, 150) + '...');
        console.log('   📦 Recommended Products:', data.data.recommendedProducts.map((p: any) => p.name));

        // Check that the OLED monitor was recommended
        const foundOled = data.data.recommendedProducts.some(
          (p: any) => p.slug === 'asus-rog-swift-oled-pg27aqdm-240hz'
        );
        assert.ok(foundOled, 'Gemini should recommend asus-rog-swift-oled-pg27aqdm-240hz for OLED 240Hz query');
        
        // Verify product card structure
        const rec = data.data.recommendedProducts[0];
        assert.ok(rec.name, 'Product must have name');
        assert.ok(rec.slug, 'Product must have slug');
        assert.ok(typeof rec.price === 'number', 'Product must have price number');
        assert.ok(typeof rec.discountPrice === 'number', 'Product must have discountPrice number');
        assert.ok(rec.image !== undefined, 'Product must have image field');
        assert.ok(typeof rec.stock === 'number', 'Product must have stock number');
        assert.ok(rec.brand, 'Product must have brand');
        console.log('   ✅ PASS: Product Consultation returns grounded recommendations');
      }
    }

    // 4. Test Multi-Turn Conversation History
    console.log('\n4. Testing Multi-Turn Conversation History...');
    await delay(2000);
    {
      const { req, res, getStatus, getJSON } = createMockReqRes({
        message: 'Thế còn chuột gaming thì sao, có loại nào siêu nhẹ cho tay vừa không?',
        history: [
          {
            role: 'user',
            text: 'Shop tư vấn màn hình OLED cho tôi.',
          },
          {
            role: 'model',
            text: 'TechGear Pro xin giới thiệu màn hình ASUS ROG Swift OLED PG27AQDM 240Hz đỉnh cao.',
          },
        ],
      });

      await handleChat(req, res);
      const status = getStatus();
      const data = getJSON();

      if (status === 429 || status === 502 || status === 503) {
        console.log(`   ⚠️ API free-tier rate-limited or busy (${status}); friendly response verified.`);
        assert.strictEqual(data.success, false);
        assert.ok(
          data.message.includes('quá nhiều yêu cầu') ||
          data.message.includes('đợi vài giây') ||
          data.message.includes('đang bận') ||
          data.message.includes('gián đoạn kết nối')
        );
        console.log('   ✅ PASS: Rate-limited or busy API handled gracefully with friendly message');
      } else {
        assert.strictEqual(status, 200, `Expected 200 or rate-limit status, got ${status}`);
        assert.strictEqual(data.success, true);
        assert.ok(typeof data.data.reply === 'string');
        console.log('   🤖 AI Reply Snippet:\n   ', data.data.reply.slice(0, 150) + '...');
        console.log('   📦 Recommended Products:', data.data.recommendedProducts.map((p: any) => p.name));

        const foundMouse = data.data.recommendedProducts.some(
          (p: any) => p.slug === 'logitech-g-pro-x-superlight-2'
        );
        assert.ok(foundMouse, 'Gemini should recommend logitech-g-pro-x-superlight-2 for ultralight mouse query');
        console.log('   ✅ PASS: Multi-turn history preserved and context understood');
      }
    }

    // 5. Test Out-of-Stock Handling
    console.log('\n5. Testing Out-of-Stock Product Inquiry...');
    await delay(2000);
    {
      const { req, res, getStatus, getJSON } = createMockReqRes({
        message: 'Bàn phím DrunkDeer A75 còn hàng không shop?',
      });

      await handleChat(req, res);
      const status = getStatus();
      const data = getJSON();

      if (status === 429 || status === 502 || status === 503) {
        console.log(`   ⚠️ API free-tier rate-limited or busy (${status}); friendly response verified.`);
        assert.strictEqual(data.success, false);
        assert.ok(
          data.message.includes('quá nhiều yêu cầu') ||
          data.message.includes('đợi vài giây') ||
          data.message.includes('đang bận') ||
          data.message.includes('gián đoạn kết nối')
        );
        console.log('   ✅ PASS: Rate-limited or busy API handled gracefully with friendly message');
      } else {
        assert.strictEqual(status, 200, `Expected 200 or rate-limit status, got ${status}`);
        assert.strictEqual(data.success, true);
        console.log('   🤖 AI Reply Snippet:\n   ', data.data.reply.slice(0, 150) + '...');
        // The reply should mention out of stock / hết hàng or status
        const replyLower = data.data.reply.toLowerCase();
        const mentionsOutOfStock = replyLower.includes('hết hàng') || replyLower.includes('tạm hết') || replyLower.includes('chưa có sẵn');
        console.log('   Stock warning present in reply:', mentionsOutOfStock);
        assert.ok(mentionsOutOfStock, 'AI should inform customer that DrunkDeer A75 is out of stock');
        console.log('   ✅ PASS: Out-of-stock product clearly recognized and communicated');
      }
    }

    // 6. Test Message Length Limit Validation
    console.log('\n6. Testing Message Length Limit Validation (>2000 chars)...');
    {
      const longMessage = 'A'.repeat(2005);
      const { req, res, getStatus, getJSON } = createMockReqRes({ message: longMessage });
      await handleChat(req, res);
      assert.strictEqual(getStatus(), 400, 'Overlong message should be rejected with 400');
      assert.strictEqual(getJSON().success, false);
      assert.ok(getJSON().message.includes('2000 ký tự'));
      console.log('   ✅ PASS: Overlong message rejected with 400');
    }

    // 7. Test History Sanitization (Leading model turn + duplicated trailing user turn)
    console.log('\n7. Testing History Sanitization with Leading Model and Trailing User Turn...');
    await delay(2000);
    {
      const { req, res, getStatus, getJSON } = createMockReqRes({
        message: 'Shop có chuột không dây nào không?',
        history: [
          { role: 'model', text: 'Xin chào! Tôi là AI TechGear.' }, // leading model turn
          { role: 'user', text: 'Tôi muốn tìm chuột chơi game.' },
          { role: 'model', text: 'TechGear Pro có Logitech Superlight 2.' },
          { role: 'user', text: 'Shop có chuột không dây nào không?' }, // already contains current message
        ],
      });

      await handleChat(req, res);
      const status = getStatus();
      const data = getJSON();

      if (status === 429 || status === 502 || status === 503) {
        console.log(`   ⚠️ API free-tier rate-limited or busy (${status}); friendly response verified.`);
        assert.strictEqual(data.success, false);
        assert.ok(
          data.message.includes('quá nhiều yêu cầu') ||
          data.message.includes('đợi vài giây') ||
          data.message.includes('đang bận') ||
          data.message.includes('gián đoạn kết nối')
        );
        console.log('   ✅ PASS: Rate-limited or busy API handled gracefully with friendly message');
      } else {
        assert.strictEqual(status, 200, `Expected 200 or rate-limit status, got ${status}`);
        assert.strictEqual(data.success, true);
        assert.ok(typeof data.data.reply === 'string');
        assert.ok(Array.isArray(data.data.recommendedProducts));
        console.log('   ✅ PASS: Sanitized history handled smoothly without API failure or duplicate turns');
      }
    }

    // 8. Test Undefined req.body Safety
    console.log('\n8. Testing Undefined req.body Safety...');
    {
      const req: any = { body: undefined };
      let statusCode = 200;
      let jsonResult: any = null;
      const res: any = {
        status(code: number) { statusCode = code; return this; },
        json(data: any) { jsonResult = data; return this; },
      };
      await handleChat(req, res);
      assert.strictEqual(statusCode, 400, 'Undefined body should safely return 400 without crashing');
      assert.strictEqual(jsonResult.success, false);
      console.log('   ✅ PASS: Undefined body rejected with 400 safely');
    }

    // 9. Test Fallback Behavior and 429 Friendly Message (Deterministic Simulation)
    console.log('\n9. Testing Model Fallback, 503 Immediate Failover, and 429 Responses...');
    {
      const originalFetch = global.fetch;
      try {
        const calledUrls: string[] = [];
        // 9.1 Simulate gemini-2.5-flash returning 429, then fallback model succeeding
        global.fetch = (async (url: any) => {
          const urlStr = String(url);
          calledUrls.push(urlStr);
          if (urlStr.includes('gemini-2.5-flash')) {
            return new Response(
              JSON.stringify({
                error: {
                  code: 429,
                  message: 'Quota exceeded for gemini-2.5-flash',
                  status: 'RESOURCE_EXHAUSTED',
                },
              }),
              { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
          }
          if (urlStr.includes('gemini-3.6-flash')) {
            return new Response(
              JSON.stringify({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            reply: 'Chào bạn, TechGear Pro hỗ trợ tư vấn qua model fallback!',
                            recommendedProductSlugs: ['logitech-g-pro-x-superlight-2'],
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return new Response('Not found', { status: 404 });
        }) as any;

        const { req, res, getStatus, getJSON } = createMockReqRes({
          message: 'Tư vấn chuột gaming',
        });
        await handleChat(req, res);
        assert.strictEqual(getStatus(), 200, 'Fallback model should succeed with 200');
        assert.strictEqual(getJSON().success, true);
        assert.ok(getJSON().data.reply.includes('model fallback'));
        assert.ok(calledUrls.some((u) => u.includes('gemini-2.5-flash')), 'Primary model was tried first');
        assert.ok(calledUrls.some((u) => u.includes('gemini-3.6-flash')), 'Fallback model was called on 429');
        console.log('   ✅ PASS: Automatic fallback from primary model to gemini-3.6-flash on 429 succeeded');

        // 9.2 Simulate gemini-2.5-flash returning 503 -> immediate fallback to gemini-3.6-flash
        const calledUrls503: string[] = [];
        global.fetch = (async (url: any) => {
          const urlStr = String(url);
          calledUrls503.push(urlStr);
          if (urlStr.includes('gemini-2.5-flash')) {
            return new Response(
              JSON.stringify({ error: { code: 503, message: 'High demand spike' } }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          }
          if (urlStr.includes('gemini-3.6-flash')) {
            return new Response(
              JSON.stringify({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            reply: 'Tư vấn thành công sau khi 503 được fallback ngay lập tức!',
                            recommendedProductSlugs: ['asus-rog-swift-oled-pg27aqdm-240hz'],
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return new Response('Not found', { status: 404 });
        }) as any;

        const req503 = createMockReqRes({ message: 'Tư vấn màn hình OLED' });
        await handleChat(req503.req, req503.res);
        assert.strictEqual(req503.getStatus(), 200, 'Immediate fallback on 503 should succeed with 200');
        assert.strictEqual(req503.getJSON().success, true);
        assert.ok(calledUrls503.some((u) => u.includes('gemini-2.5-flash')), 'Primary model was tried first');
        assert.ok(calledUrls503.some((u) => u.includes('gemini-3.6-flash')), 'Fallback model was called immediately on 503');
        console.log('   ✅ PASS: Immediate fallback from primary model to gemini-3.6-flash on 503 succeeded');

        // 9.3 Simulate all models returning 429
        global.fetch = (async () => {
          return new Response(
            JSON.stringify({ error: { code: 429, message: 'All models exhausted' } }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }) as any;

        const req2 = createMockReqRes({ message: 'Tư vấn bàn phím' });
        await handleChat(req2.req, req2.res);
        assert.strictEqual(req2.getStatus(), 429, 'Exhausted quota should return 429');
        assert.strictEqual(req2.getJSON().success, false);
        assert.ok(
          req2.getJSON().message.includes('quá nhiều yêu cầu') ||
          req2.getJSON().message.includes('đợi vài giây'),
          'Should return friendly rate limit explanation'
        );
        console.log('   ✅ PASS: Friendly rate limit message returned when all models hit 429');

        // 9.4 Test unescaped quotes inside reply string (verifying zero sentence truncation)
        global.fetch = (async () => {
          const malformedJson = `{
            "reply": "Chào bạn! Màn hình 240Hz để "tryhard" các tựa game bắn súng là lựa chọn tuyệt vời. Tồn kho còn 8 cái.",
            "recommendedProductSlugs": ["asus-rog-swift-oled-pg27aqdm-240hz"]
          }`;
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: malformedJson }],
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }) as any;

        const reqQuotes = createMockReqRes({ message: 'Tư vấn tryhard gaming' });
        await handleChat(reqQuotes.req, reqQuotes.res);
        assert.strictEqual(reqQuotes.getStatus(), 200);
        assert.strictEqual(reqQuotes.getJSON().success, true);
        const unescapedReply = reqQuotes.getJSON().data.reply;
        assert.ok(unescapedReply.includes('"tryhard"'), 'Must preserve unescaped inner quotes');
        assert.ok(unescapedReply.includes('Tồn kho còn 8 cái'), 'Must not truncate reply text on unescaped quotes');
        assert.strictEqual(reqQuotes.getJSON().data.recommendedProducts.length, 1);
        console.log('   ✅ PASS: Robust JSON repair prevents reply truncation when raw text contains unescaped quotes');
      } finally {
        global.fetch = originalFetch;
      }
    }

    console.log('\n🎉 ALL CHAT CONTROLLER & GEMINI TESTS PASSED SUCCESSFULLY!');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runChatTests().catch((err) => {
  console.error('❌ Chat Test Failed:', err);
  process.exit(1);
});
