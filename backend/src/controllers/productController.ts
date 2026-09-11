import { Request, Response } from 'express';
import { Product, ProductCategory } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';

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

    if (category) {
      filter.category = category;
    }
    if (brand) {
      filter.brand = brand;
    }
    if (isHot !== undefined) {
      filter.isHot = isHot === 'true' || String(isHot) === 'true';
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
      ];
    }
    if (switchType) {
      filter['specs.switch'] = new RegExp(String(switchType), 'i');
    }
    if (refreshRate) {
      filter['specs.refreshRate'] = new RegExp(String(refreshRate), 'i');
    }
    if (connection) {
      filter['specs.connection'] = new RegExp(String(connection), 'i');
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
    const limitNum = Math.max(1, parseInt(String(limit)) || 12);
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
      price,
      discountPrice: discountPrice || 0,
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
    const updateData = { ...req.body };

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Check if stock is being modified directly
    if (updateData.stock !== undefined && updateData.stock !== product.stock) {
      const prev = product.stock;
      const next = Number(updateData.stock);
      await InventoryLog.create({
        productId: product._id,
        productName: product.name,
        changeAmount: next - prev,
        previousStock: prev,
        newStock: next,
        reason: 'manual_adjustment',
        note: 'Điều chỉnh tồn kho từ cập nhật sản phẩm',
        updatedBy: req.user?.email || 'Admin',
      });
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { changeAmount, reason = 'manual_adjustment', note = '' } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + Number(changeAmount));
    product.stock = newStock;
    await product.save();

    await InventoryLog.create({
      productId: product._id,
      productName: product.name,
      changeAmount: Number(changeAmount),
      previousStock,
      newStock,
      reason,
      note,
      updatedBy: req.user?.email || 'Staff',
    });

    res.json({
      success: true,
      message: 'Cập nhật tồn kho thành công',
      data: { product, previousStock, newStock },
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
