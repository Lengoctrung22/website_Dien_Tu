import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Banner, BannerThemeKey } from '../models/Banner';

const ALLOWED_THEMES: BannerThemeKey[] = ['purple', 'blue', 'cyan', 'rose', 'emerald', 'amber', 'dark'];

// GET /api/banners (Public)
export const getActiveBanners = async (_req: Request, res: Response) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate('productId', 'name slug price discountPrice images');

    return res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    console.error('[BannerController:getActiveBanners]', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách banner trang chủ',
    });
  }
};

// GET /api/banners/admin (Admin / Staff with 'products' permission)
export const getAllBannersAdmin = async (_req: Request, res: Response) => {
  try {
    const banners = await Banner.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate('productId', 'name slug price discountPrice images category brand stock');

    return res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    console.error('[BannerController:getAllBannersAdmin]', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách quản lý banner',
    });
  }
};

// GET /api/banners/:id
export const getBannerById = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findById(req.params.id).populate('productId');
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy banner yêu cầu',
      });
    }

    return res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    console.error('[BannerController:getBannerById]', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin banner',
    });
  }
};

// POST /api/banners
export const createBanner = async (req: Request, res: Response) => {
  try {
    const {
      title,
      subtitle = '',
      desc = '',
      badge = '',
      tag = '',
      image,
      imageFit = 'contain',
      theme = 'purple',
      cta = 'Khám Phá Ngay',
      link = '/products',
      showSecondaryBtn = true,
      secondaryCta = 'Xem tất cả sản phẩm',
      secondaryLink = '/products',
      productId = null,
      removeWhiteBg = false,
      isActive = true,
      makePrimary = false,
      displayOrder,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề banner (title) là bắt buộc',
      });
    }

    if (!image || !image.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Hình ảnh banner (image) là bắt buộc',
      });
    }

    const validatedTheme: BannerThemeKey = ALLOWED_THEMES.includes(theme) ? theme : 'purple';
    const validatedImageFit = imageFit === 'cover' ? 'cover' : 'contain';

    let order = 0;
    if (makePrimary) {
      const firstBanner = await Banner.findOne().sort({ displayOrder: 1 });
      order = firstBanner ? firstBanner.displayOrder - 1 : 0;
    } else if (typeof displayOrder === 'number') {
      order = displayOrder;
    } else {
      const lastBanner = await Banner.findOne().sort({ displayOrder: -1 });
      order = lastBanner ? lastBanner.displayOrder + 1 : 0;
    }

    const banner = await Banner.create({
      title: title.trim(),
      subtitle: subtitle.trim(),
      desc: desc.trim(),
      badge: badge.trim(),
      tag: tag.trim(),
      image: image.trim(),
      imageFit: validatedImageFit,
      theme: validatedTheme,
      cta: cta.trim() || 'Khám Phá Ngay',
      link: link.trim() || '/products',
      showSecondaryBtn: Boolean(showSecondaryBtn),
      secondaryCta: secondaryCta.trim() || 'Xem tất cả sản phẩm',
      secondaryLink: secondaryLink.trim() || '/products',
      productId: productId && isValidObjectId(productId) ? productId : null,
      removeWhiteBg: Boolean(removeWhiteBg),
      displayOrder: order,
      isActive: isActive !== false,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo banner mới thành công',
      data: banner,
    });
  } catch (error: any) {
    console.error('[BannerController:createBanner]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo banner',
    });
  }
};

// PUT /api/banners/:id
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy banner cần chỉnh sửa',
      });
    }

    const {
      title,
      subtitle,
      desc,
      badge,
      tag,
      image,
      imageFit,
      theme,
      cta,
      link,
      showSecondaryBtn,
      secondaryCta,
      secondaryLink,
      productId,
      removeWhiteBg,
      isActive,
      makePrimary,
      displayOrder,
    } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tiêu đề banner không được để trống',
        });
      }
      banner.title = title.trim();
    }

    if (image !== undefined) {
      if (!image.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Hình ảnh banner không được để trống',
        });
      }
      banner.image = image.trim();
    }

    if (imageFit !== undefined) {
      banner.imageFit = imageFit === 'cover' ? 'cover' : 'contain';
    }

    if (subtitle !== undefined) banner.subtitle = subtitle.trim();
    if (desc !== undefined) banner.desc = desc.trim();
    if (badge !== undefined) banner.badge = badge.trim();
    if (tag !== undefined) banner.tag = tag.trim();
    if (theme !== undefined) {
      banner.theme = ALLOWED_THEMES.includes(theme) ? theme : 'purple';
    }
    if (cta !== undefined) banner.cta = cta.trim() || 'Khám Phá Ngay';
    if (link !== undefined) banner.link = link.trim() || '/products';
    if (showSecondaryBtn !== undefined) banner.showSecondaryBtn = Boolean(showSecondaryBtn);
    if (secondaryCta !== undefined) banner.secondaryCta = secondaryCta.trim() || 'Xem tất cả sản phẩm';
    if (secondaryLink !== undefined) banner.secondaryLink = secondaryLink.trim() || '/products';
    if (productId !== undefined) {
      banner.productId = productId && isValidObjectId(productId) ? (productId as any) : null;
    }
    if (removeWhiteBg !== undefined) banner.removeWhiteBg = Boolean(removeWhiteBg);
    if (isActive !== undefined) banner.isActive = Boolean(isActive);

    if (makePrimary) {
      const otherFirst = await Banner.findOne({ _id: { $ne: banner._id } }).sort({ displayOrder: 1 });
      banner.displayOrder = otherFirst ? otherFirst.displayOrder - 1 : 0;
    } else if (typeof displayOrder === 'number') {
      banner.displayOrder = displayOrder;
    }

    await banner.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật banner thành công',
      data: banner,
    });
  } catch (error: any) {
    console.error('[BannerController:updateBanner]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật banner',
    });
  }
};

// DELETE /api/banners/:id
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy banner cần xóa',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã xóa banner thành công',
    });
  } catch (error: any) {
    console.error('[BannerController:deleteBanner]', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa banner',
    });
  }
};

// PATCH /api/banners/reorder
// Supports:
// 1. { bannerId: string, direction: 'up' | 'down' }
// 2. { bannerId: string, action: 'make_primary' }
// 3. { bannerIds: string[] }
export const reorderBanners = async (req: Request, res: Response) => {
  try {
    const { bannerId, direction, action, bannerIds } = req.body;

    // Case 1: Array of IDs in desired order
    if (Array.isArray(bannerIds) && bannerIds.length > 0) {
      const updateOps = bannerIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { displayOrder: index } },
        },
      }));

      await Banner.bulkWrite(updateOps);
      const updated = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thứ tự banner thành công',
        data: updated,
      });
    }

    // Case 2: Make Primary Hero action
    if (bannerId && action === 'make_primary') {
      const allBanners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
      const targetIndex = allBanners.findIndex((b) => b._id.toString() === bannerId.toString());

      if (targetIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy banner để đưa lên đầu',
        });
      }

      const [target] = allBanners.splice(targetIndex, 1);
      allBanners.unshift(target);

      const updateOps = allBanners.map((b, index) => ({
        updateOne: {
          filter: { _id: b._id },
          update: { $set: { displayOrder: index } },
        },
      }));

      await Banner.bulkWrite(updateOps);
      const updated = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Đã đưa banner lên vị trí số 1 (Primary Hero)',
        data: updated,
      });
    }

    // Case 3: Move Up / Down
    if (bannerId && (direction === 'up' || direction === 'down')) {
      const allBanners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
      const index = allBanners.findIndex((b) => b._id.toString() === bannerId.toString());

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy banner',
        });
      }

      if (direction === 'up') {
        if (index === 0) {
          return res.status(200).json({
            success: true,
            message: 'Banner đã ở vị trí đầu tiên',
            data: allBanners,
          });
        }
        // Swap with index - 1
        const temp = allBanners[index - 1];
        allBanners[index - 1] = allBanners[index];
        allBanners[index] = temp;
      } else if (direction === 'down') {
        if (index === allBanners.length - 1) {
          return res.status(200).json({
            success: true,
            message: 'Banner đã ở vị trí cuối cùng',
            data: allBanners,
          });
        }
        // Swap with index + 1
        const temp = allBanners[index + 1];
        allBanners[index + 1] = allBanners[index];
        allBanners[index] = temp;
      }

      const updateOps = allBanners.map((b, idx) => ({
        updateOne: {
          filter: { _id: b._id },
          update: { $set: { displayOrder: idx } },
        },
      }));

      await Banner.bulkWrite(updateOps);
      const updated = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: `Đã di chuyển banner ${direction === 'up' ? 'lên' : 'xuống'} thành công`,
        data: updated,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Tham số sắp xếp không hợp lệ. Cần truyền bannerId và direction, hoặc bannerIds array.',
    });
  } catch (error: any) {
    console.error('[BannerController:reorderBanners]', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi sắp xếp thứ tự banner',
    });
  }
};
