import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Product, ProductCategory } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { escapeRegex, sanitizeString } from '../utils/sanitize';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      switchType,
      refreshRate,
      connection,
      isHot,
      sortBy = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const filter: Record<string, any> = { isActive: true };

    const cleanCategory = sanitizeString(category);
    if (cleanCategory) {
      filter.category = cleanCategory;
    }
    const cleanBrand = sanitizeString(brand);
    if (cleanBrand) {
      filter.brand = cleanBrand;
    }
    if (isHot !== undefined) {
      filter.isHot = isHot === 'true' || String(isHot) === 'true';
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const cleanSearch = sanitizeString(search);
    if (cleanSearch) {
      const searchRegex = new RegExp(escapeRegex(cleanSearch), 'i');
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
      ];
    }
    const cleanSwitchType = sanitizeString(switchType);
    if (cleanSwitchType) {
      filter['specs.switch'] = new RegExp(escapeRegex(cleanSwitchType), 'i');
    }
    const cleanRefreshRate = sanitizeString(refreshRate);
    if (cleanRefreshRate) {
      filter['specs.refreshRate'] = new RegExp(escapeRegex(cleanRefreshRate), 'i');
    }
    const cleanConnection = sanitizeString(connection);
    if (cleanConnection) {
      filter['specs.connection'] = new RegExp(escapeRegex(cleanConnection), 'i');
    }

    // Sorting
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'price_asc') {
      sortObj = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sortObj = { price: -1 };
    } else if (sortBy === 'best_seller') {
      sortObj = { soldCount: -1 };
    } else if (sortBy === 'hot_order') {
      sortObj = { hotOrder: 1, createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductBySlugOrId = async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    let product = null;

    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slugOrId);
    }
    if (!product) {
      product = await Product.findOne({ slug: slugOrId });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Also get 4 related products in the same category
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(4);

    res.json({
      success: true,
      data: {
        product,
        related,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, category, brand, price, discountPrice, stock, images, specs, description, isHot, hotOrder } = req.body;

    if (!name || !category || !brand || price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc của sản phẩm' });
    }

    const numPrice = Number(price);
    const numDiscountPrice = discountPrice !== undefined && discountPrice !== '' ? Number(discountPrice) : 0;
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Giá sản phẩm không hợp lệ' });
    }
    if (!Number.isFinite(numDiscountPrice) || numDiscountPrice < 0 || (numDiscountPrice > 0 && numDiscountPrice >= numPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Giá khuyến mãi phải lớn hơn hoặc bằng 0 và nhỏ hơn giá gốc',
      });
    }

    // Generate slug
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const product = await Product.create({
      name,
      slug,
      category,
      brand,
      price: numPrice,
      discountPrice: numDiscountPrice,
      stock,
      soldCount: 0,
      images: images || [],
      specs: specs || {},
      description: description || '',
      isHot: Boolean(isHot),
      hotOrder: hotOrder || 0,
      isActive: true,
    });

    // Record inventory log
    await InventoryLog.create({
      productId: product._id,
      productName: product.name,
      changeAmount: stock,
      previousStock: 0,
      newStock: stock,
      reason: 'restock',
      note: 'Khởi tạo sản phẩm mới',
      updatedBy: req.user?.email || 'Admin',
    });

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Mã định danh sản phẩm không hợp lệ' });
    }

    const ALLOWED_UPDATE_FIELDS = [
      'name',
      'category',
      'brand',
      'price',
      'discountPrice',
      'images',
      'specs',
      'description',
      'isHot',
      'hotOrder',
      'isActive',
    ];

    const canUpdateStock =
      !req.user?.role ||
      req.user.role === 'admin' ||
      req.user.permissions?.includes('all') ||
      req.user.permissions?.includes('inventory');

    const updateData: Record<string, any> = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (req.body && req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }
    if (canUpdateStock && req.body && req.body.stock !== undefined) {
      updateData.stock = req.body.stock;
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    if (updateData.price !== undefined || updateData.discountPrice !== undefined) {
      const effectivePrice = updateData.price !== undefined ? Number(updateData.price) : Number(product.price);
      const effectiveDiscount =
        updateData.discountPrice !== undefined ? Number(updateData.discountPrice) : Number(product.discountPrice || 0);

      if (!Number.isFinite(effectivePrice) || effectivePrice < 0) {
        return res.status(400).json({ success: false, message: 'Giá sản phẩm không hợp lệ' });
      }
      if (
        !Number.isFinite(effectiveDiscount) ||
        effectiveDiscount < 0 ||
        (effectiveDiscount > 0 && effectiveDiscount >= effectivePrice)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Giá khuyến mãi phải lớn hơn hoặc bằng 0 và nhỏ hơn giá gốc',
        });
      }
    }

    const stockChanged = updateData.stock !== undefined && updateData.stock !== product.stock;
    const prevStock = product.stock;
    const nextStock = Number(updateData.stock);

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Record inventory log only after Product update succeeds
    if (stockChanged && !isNaN(nextStock)) {
      await InventoryLog.create({
        productId: updated._id,
        productName: updated.name,
        changeAmount: nextStock - prevStock,
        previousStock: prevStock,
        newStock: nextStock,
        reason: 'manual_adjustment',
        note: 'Điều chỉnh tồn kho từ cập nhật sản phẩm',
        updatedBy: req.user?.email || 'Admin',
      });
    }

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Mã định danh sản phẩm không hợp lệ' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Soft delete or hard delete; soft delete by default
    product.isActive = false;
    await product.save();

    res.json({ success: true, message: 'Đã xóa sản phẩm thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleHotStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isHot, hotOrder } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Mã định danh sản phẩm không hợp lệ' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    if (isHot !== undefined) product.isHot = Boolean(isHot);
    if (hotOrder !== undefined) product.hotOrder = Number(hotOrder);

    await product.save();
    res.json({ success: true, message: 'Cập nhật trạng thái HOT thành công', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reorderHotProducts = async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { id: string, hotOrder: number }

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu danh sách thứ tự không hợp lệ' });
    }

    const updateOps = items.map((item) =>
      Product.findByIdAndUpdate(item.id, { hotOrder: Number(item.hotOrder) })
    );
    await Promise.all(updateOps);

    const updatedProducts = await Product.find({ isHot: true, isActive: true }).sort({ hotOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      message: 'Cập nhật thứ tự hiển thị sản phẩm HOT thành công',
      data: updatedProducts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Mã định danh sản phẩm không hợp lệ' });
    }

    const { changeAmount, reason = 'manual_adjustment', note = '' } = req.body;

    const ALLOWED_STOCK_REASONS = ['restock', 'manual_adjustment', 'order_deduction', 'order_cancellation'];
    if (!ALLOWED_STOCK_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Lý do điều chỉnh tồn kho (reason) không hợp lệ',
      });
    }

    const change = Number(changeAmount);
    if (isNaN(change) || !Number.isInteger(change)) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng thay đổi tồn kho không hợp lệ',
      });
    }

    if (change === 0) {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
      }
      return res.json({
        success: true,
        message: 'Cập nhật tồn kho thành công',
        data: { product, previousStock: product.stock, newStock: product.stock },
      });
    }

    const query: Record<string, any> = change < 0
      ? { _id: id, stock: { $gte: Math.abs(change) } }
      : { _id: id };

    const updatedProduct = await Product.findOneAndUpdate(
      query,
      { $inc: { stock: change } },
      { new: true }
    );

    if (!updatedProduct) {
      const exists = await Product.findById(id);
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
      }
      return res.status(400).json({
        success: false,
        message: `Số lượng tồn kho không đủ để giảm (${exists.stock} < ${Math.abs(change)})`,
      });
    }

    const previousStock = updatedProduct.stock - change;
    const newStock = updatedProduct.stock;

    await InventoryLog.create({
      productId: updatedProduct._id,
      productName: updatedProduct.name,
      changeAmount: change,
      previousStock,
      newStock,
      reason,
      note,
      updatedBy: req.user?.email || 'Staff',
    });

    res.json({
      success: true,
      message: 'Cập nhật tồn kho thành công',
      data: { product: updatedProduct, previousStock, newStock },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFilterMetadata = async (req: Request, res: Response) => {
  try {
    const [brands, categoriesCount] = await Promise.all([
      Product.distinct('brand', { isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const counts: Record<string, number> = {};
    categoriesCount.forEach((item) => {
      counts[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        brands,
        categoriesCount: counts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
