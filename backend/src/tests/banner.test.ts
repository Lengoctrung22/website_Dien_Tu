import assert from 'assert';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Banner } from '../models/Banner';
import { Product } from '../models/Product';
import { seedInitialBanners } from '../scripts/seed';
import {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from '../controllers/bannerController';

async function runBannerTests() {
  console.log('🧪 Starting Banner & Slideshow Feature Tests...\n');

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  try {
    // 1. Safe Seeding Test (Anti-Resurrection Bug)
    console.log('1. Testing Safe Initial Banner Seeding...');
    assert.strictEqual(await Banner.countDocuments(), 0, 'Should start with 0 banners');
    await seedInitialBanners();
    assert.strictEqual(await Banner.countDocuments(), 3, 'Should seed exactly 3 banners');

    // Attempt second seed - must not duplicate
    await seedInitialBanners();
    assert.strictEqual(await Banner.countDocuments(), 3, 'Second seed must skip and not create duplicates');

    // Check seed themes
    const seeded = await Banner.find().sort({ displayOrder: 1 });
    assert.strictEqual(seeded[0].theme, 'blue');
    assert.strictEqual(seeded[0].removeWhiteBg, true, 'Seeded Asus OLED banner must have removeWhiteBg enabled');
    assert.strictEqual(seeded[1].theme, 'purple'); // Bàn phím cơ Hall Effect & Magnetic Switch
    assert.strictEqual(seeded[1].removeWhiteBg, false, 'Seeded keyboard banner should have removeWhiteBg false');
    assert.strictEqual(seeded[2].theme, 'cyan');
    assert.strictEqual(seeded[2].removeWhiteBg, false);
    console.log('   ✅ PASS: Safe initial banner seeding works without Data Resurrection Bug');

    // 2. Public getActiveBanners Test
    console.log('2. Testing getActiveBanners...');
    // Create an inactive banner
    await Banner.create({
      title: 'Inactive Banner',
      image: 'https://example.com/inactive.jpg',
      isActive: false,
      displayOrder: 99,
    });

    let mockResJson: any = null;
    let mockResStatus = 200;
    const mockRes: any = {
      status(code: number) {
        mockResStatus = code;
        return this;
      },
      json(data: any) {
        mockResJson = data;
        return this;
      },
    };

    await getActiveBanners({} as any, mockRes);
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.success, true);
    assert.strictEqual(mockResJson.data.length, 3, 'Public route should only return active banners');
    assert.ok(mockResJson.data.every((b: any) => b.isActive === true));
    console.log('   ✅ PASS: Public getActiveBanners returns only active items');

    // 3. Admin getAllBannersAdmin Test
    console.log('3. Testing getAllBannersAdmin...');
    await getAllBannersAdmin({} as any, mockRes);
    assert.strictEqual(mockResJson.data.length, 4, 'Admin route should return all banners including inactive');
    console.log('   ✅ PASS: Admin getAllBannersAdmin returns all items');

    // 4. Create Banner Test & Make Primary Hero
    console.log('4. Testing createBanner with makePrimary...');
    const createReq: any = {
      body: {
        title: 'New Razer Viper V4 Pro',
        subtitle: 'Cảm biến 42K DPI • Polling 8000Hz',
        desc: 'Đỉnh cao chuột esports thế hệ mới',
        badge: 'SẢN PHẨM MỚI 2026',
        tag: 'New Arrival',
        image: 'https://example.com/viper-v4.jpg',
        theme: 'rose',
        cta: 'Đặt Trước Ngay',
        link: '/products/razer-viper-v4-pro',
        showSecondaryBtn: true,
        secondaryCta: 'Xem tất cả chuột',
        secondaryLink: '/products?category=mouse',
        makePrimary: true,
      },
    };

    await createBanner(createReq, mockRes);
    assert.strictEqual(mockResStatus, 201);
    assert.strictEqual(mockResJson.success, true);
    assert.strictEqual(mockResJson.data.title, 'New Razer Viper V4 Pro');
    assert.strictEqual(mockResJson.data.theme, 'rose');
    assert.strictEqual(mockResJson.data.imageFit, 'contain', 'Default imageFit must be contain');
    assert.ok(mockResJson.data.displayOrder < seeded[0].displayOrder, 'makePrimary banner should have displayOrder < first banner');
    console.log('   ✅ PASS: createBanner creates banner and sets primary order correctly');

    const createdId = mockResJson.data._id;

    // 5. Update Banner Test
    console.log('5. Testing updateBanner...');
    const updateReq: any = {
      params: { id: createdId },
      body: {
        title: 'New Razer Viper V4 Pro (Official)',
        theme: 'emerald',
        imageFit: 'cover',
      },
    };
    await updateBanner(updateReq, mockRes);
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.data.title, 'New Razer Viper V4 Pro (Official)');
    assert.strictEqual(mockResJson.data.theme, 'emerald');
    assert.strictEqual(mockResJson.data.imageFit, 'cover', 'imageFit should update to cover');
    console.log('   ✅ PASS: updateBanner updates fields accurately');

    // 6. Reorder Banners (Move Up / Down & bulk ids)
    console.log('6. Testing reorderBanners (PATCH /api/banners/reorder)...');
    // Move down
    const reorderReq1: any = {
      body: {
        bannerId: createdId,
        direction: 'down',
      },
    };
    await reorderBanners(reorderReq1, mockRes);
    assert.strictEqual(mockResStatus, 200);
    const afterDown = await Banner.find().sort({ displayOrder: 1 });
    assert.strictEqual(afterDown[1]._id.toString(), createdId.toString(), 'Should have swapped to index 1');

    // Make Primary action
    const reorderReq2: any = {
      body: {
        bannerId: createdId,
        action: 'make_primary',
      },
    };
    await reorderBanners(reorderReq2, mockRes);
    assert.strictEqual(mockResStatus, 200);
    const afterPrimary = await Banner.find().sort({ displayOrder: 1 });
    assert.strictEqual(afterPrimary[0]._id.toString(), createdId.toString(), 'Should be at index 0 after make_primary');

    // Bulk IDs reorder
    const allIds = afterPrimary.map((b) => b._id.toString()).reverse();
    const reorderReq3: any = {
      body: {
        bannerIds: allIds,
      },
    };
    await reorderBanners(reorderReq3, mockRes);
    assert.strictEqual(mockResStatus, 200);
    const afterBulk = await Banner.find().sort({ displayOrder: 1 });
    assert.strictEqual(afterBulk[0]._id.toString(), allIds[0]);
    console.log('   ✅ PASS: reorderBanners handles move, make_primary, and bulk array reordering');

    // 7. Delete Banner Test
    console.log('7. Testing deleteBanner...');
    const deleteReq: any = {
      params: { id: createdId },
    };
    await deleteBanner(deleteReq, mockRes);
    assert.strictEqual(mockResStatus, 200);
    const foundDeleted = await Banner.findById(createdId);
    assert.strictEqual(foundDeleted, null, 'Deleted banner must no longer exist');
    console.log('   ✅ PASS: deleteBanner deletes banner successfully');

    // 8. Robustness: Invalid ObjectId and Blank CTA Fallback Test
    console.log('8. Testing Robustness: Invalid ObjectId & Blank CTA Fallback...');
    const invalidReq: any = {
      body: {
        title: 'Safe Fallback Banner',
        image: 'https://example.com/fallback.jpg',
        productId: 'non-existent-or-invalid-object-id',
        cta: '   ',
        link: '   ',
      },
    };
    await createBanner(invalidReq, mockRes);
    assert.strictEqual(mockResStatus, 201);
    assert.strictEqual(mockResJson.data.productId, null, 'Invalid productId should safely resolve to null');
    assert.strictEqual(mockResJson.data.cta, 'Khám Phá Ngay', 'Blank cta should fallback to default');
    assert.strictEqual(mockResJson.data.link, '/products', 'Blank link should fallback to default');
    console.log('   ✅ PASS: Invalid productId and blank CTA properly sanitized');

    // 9. Boundary: Reorder top up and bottom down boundary safety
    console.log('9. Testing Reorder Boundaries (Top Up & Bottom Down)...');
    const bannersBeforeBoundary = await Banner.find().sort({ displayOrder: 1 });
    const topId = bannersBeforeBoundary[0]._id.toString();
    const bottomId = bannersBeforeBoundary[bannersBeforeBoundary.length - 1]._id.toString();

    // Move top item up
    await reorderBanners({ body: { bannerId: topId, direction: 'up' } } as any, mockRes);
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.message, 'Banner đã ở vị trí đầu tiên');

    // Move bottom item down
    await reorderBanners({ body: { bannerId: bottomId, direction: 'down' } } as any, mockRes);
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.message, 'Banner đã ở vị trí cuối cùng');
    console.log('   ✅ PASS: Reorder boundaries handled cleanly without throwing errors');

    // 10. imageFit Validation & Contain/Cover Fallback Test
    console.log('10. Testing imageFit Validation & Contain/Cover Fallback...');
    const invalidFitReq: any = {
      body: {
        title: 'Audio-Technica ATH-GDL3 Headphone Showcase',
        image: 'https://images.unsplash.com/photo-1545127398-14699f92334b',
        imageFit: 'invalid_mode_or_stretch',
      },
    };
    await createBanner(invalidFitReq, mockRes);
    assert.strictEqual(mockResStatus, 201);
    assert.strictEqual(mockResJson.data.imageFit, 'contain', 'Invalid imageFit must safely fallback to contain');

    const invalidFitId = mockResJson.data._id;
    await updateBanner(
      { params: { id: invalidFitId }, body: { imageFit: 'another_invalid_mode' } } as any,
      mockRes
    );
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.data.imageFit, 'contain', 'Updating with invalid imageFit must fallback to contain');

    await updateBanner(
      { params: { id: invalidFitId }, body: { imageFit: 'cover' } } as any,
      mockRes
    );
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.data.imageFit, 'cover', 'Updating with valid cover must set cover');
    console.log('   ✅ PASS: imageFit safely validates and defaults to contain mode');

    // 11. removeWhiteBg Studio Blending Feature Test
    console.log('11. Testing removeWhiteBg Studio Blending Validation & Toggle...');
    // Create banner with removeWhiteBg explicitly true
    const whiteBgReq: any = {
      body: {
        title: 'Studio Showcase Product',
        image: 'https://example.com/studio-photo.jpg',
        removeWhiteBg: true,
      },
    };
    await createBanner(whiteBgReq, mockRes);
    assert.strictEqual(mockResStatus, 201);
    assert.strictEqual(mockResJson.data.removeWhiteBg, true, 'removeWhiteBg must be set to true when passed');
    const blendBannerId = mockResJson.data._id;

    // Toggle removeWhiteBg to false via updateBanner
    await updateBanner(
      { params: { id: blendBannerId }, body: { removeWhiteBg: false } } as any,
      mockRes
    );
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.data.removeWhiteBg, false, 'removeWhiteBg should update to false');

    // Toggle removeWhiteBg back to true
    await updateBanner(
      { params: { id: blendBannerId }, body: { removeWhiteBg: true } } as any,
      mockRes
    );
    assert.strictEqual(mockResStatus, 200);
    assert.strictEqual(mockResJson.data.removeWhiteBg, true, 'removeWhiteBg should update to true');

    // Default when omitted should be false
    const defaultWhiteBgReq: any = {
      body: {
        title: 'Normal Cover Banner',
        image: 'https://example.com/cover-bg.jpg',
      },
    };
    await createBanner(defaultWhiteBgReq, mockRes);
    assert.strictEqual(mockResStatus, 201);
    assert.strictEqual(mockResJson.data.removeWhiteBg, false, 'removeWhiteBg should default to false when omitted');
    console.log('   ✅ PASS: removeWhiteBg safely defaults, creates, and toggles cleanly');

  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }

  console.log('\n🎉 ALL BANNER FEATURE TESTS PASSED SUCCESSFULLY!');
}

runBannerTests().catch((err) => {
  console.error('\n❌ BANNER TEST FAILED:', err);
  process.exit(1);
});
