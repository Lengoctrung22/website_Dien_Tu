import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { InventoryLog } from '../models/InventoryLog';
import { Banner } from '../models/Banner';
import { connectDB, disconnectDB } from '../config/db';

export const DEFAULT_USER_EMAILS = [
  'admin@techgear.vn',
  'warehouse@techgear.vn',
  'orders@techgear.vn',
  'trunglengoc220324@gmail.com',
  'test.buyer@techgear.vn',
];

// Default user data for seeding
export const getUserData = async (forceGenerate = false) => {
  if (!forceGenerate) {
    const existingCount = await User.countDocuments({ email: { $in: DEFAULT_USER_EMAILS } });
    if (existingCount === DEFAULT_USER_EMAILS.length) {
      return []; // All default accounts exist, bypass bcrypt computation
    }
  }

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const staffPassword = await bcrypt.hash('staff123', salt);
  const customerPassword = await bcrypt.hash('123456', salt);

  return [
    {
      fullName: 'Trần Văn Quản',
      email: 'admin@techgear.vn',
      phone: '0901234567',
      passwordHash: adminPassword,
      role: 'admin',
      permissions: ['all'],
      isActive: true,
    },
    {
      fullName: 'Nguyễn Tuấn Kiên',
      email: 'warehouse@techgear.vn',
      phone: '0912345678',
      passwordHash: staffPassword,
      role: 'staff',
      permissions: ['inventory'],
      isActive: true,
    },
    {
      fullName: 'Lê Minh Đức',
      email: 'orders@techgear.vn',
      phone: '0923456789',
      passwordHash: staffPassword,
      role: 'staff',
      permissions: ['orders'],
      isActive: true,
    },
    {
      fullName: 'Lê Ngọc Trung',
      email: 'trunglengoc220324@gmail.com',
      phone: '0987654321',
      passwordHash: customerPassword,
      role: 'customer',
      permissions: [],
      isActive: true,
    },
    {
      fullName: 'Auto Tester',
      email: 'test.buyer@techgear.vn',
      phone: '0999999999',
      passwordHash: customerPassword,
      role: 'customer',
      permissions: [],
      isActive: true,
    },
  ];
};

// Product seed data
const productData = [
  // --- MONITORS ---
  {
    name: 'Màn hình ASUS ROG Swift OLED PG27AQDM 27" 2K 240Hz 0.03ms',
    slug: 'asus-rog-swift-oled-pg27aqdm-27-2k-240hz',
    category: 'monitor',
    brand: 'ASUS',
    price: 24990000,
    discountPrice: 22990000,
    stock: 12,
    soldCount: 0,
    isHot: true,
    hotOrder: 1,
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      refreshRate: '240Hz',
      resolution: '2560 x 1440 (2K QHD)',
      panelType: 'OLED',
      responseTime: '0.03ms (GTG)',
      connection: 'DisplayPort 1.4, HDMI 2.0, USB 3.2 Hub',
      hdr: 'HDR10, TrueBlack 400',
      sync: 'G-Sync Compatible, FreeSync Premium',
    },
    description: 'Màn hình gaming OLED đỉnh cao của ROG với tấm nền 2K 240Hz phản hồi 0.03ms, hệ thống tản nhiệt buồng hơi custom độc quyền chống burn-in.',
  },
  {
    name: 'Màn hình LG UltraGear 27GR95QE-B 27" QHD OLED 240Hz G-Sync',
    slug: 'lg-ultragear-27gr95qe-b-27-qhd-oled-240hz',
    category: 'monitor',
    brand: 'LG',
    price: 21900000,
    discountPrice: 19990000,
    stock: 8,
    soldCount: 0,
    isHot: true,
    hotOrder: 2,
    images: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      refreshRate: '240Hz',
      resolution: '2560 x 1440 (QHD)',
      panelType: 'OLED',
      responseTime: '0.03ms',
      connection: 'HDMI 2.1 x2, DP 1.4, Optical Out, USB',
      hdr: 'HDR10, 98.5% DCI-P3',
      sync: 'NVIDIA G-Sync, AMD FreeSync Premium',
    },
    description: 'Trải nghiệm màn hình siêu tốc LG UltraGear OLED 240Hz sắc nét đến từng khung hình cho game thủ thi đấu chuyên nghiệp.',
  },
  {
    name: 'Màn hình Samsung Odyssey Neo G9 49" Mini-LED 240Hz 5120x1440',
    slug: 'samsung-odyssey-neo-g9-49-mini-led-240hz',
    category: 'monitor',
    brand: 'Samsung',
    price: 38990000,
    discountPrice: 35500000,
    stock: 4,
    soldCount: 0,
    isHot: true,
    hotOrder: 3,
    images: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      refreshRate: '240Hz',
      resolution: '5120 x 1440 (Dual QHD)',
      panelType: 'Quantum Mini-LED',
      responseTime: '1ms',
      connection: 'DisplayPort 1.4 x1, HDMI 2.1 x2, USB Hub',
      hdr: 'Quantum HDR 2000',
      curvature: '1000R',
    },
    description: 'Siêu phẩm màn hình cong 1000R góc nhìn vô cực với công nghệ Quantum Mini-LED 2048 vùng sáng cục bộ.',
  },
  {
    name: 'Màn hình Dell Alienware AW3423DWF 34" QD-OLED Curved 165Hz',
    slug: 'dell-alienware-aw3423dwf-34-qd-oled-165hz',
    category: 'monitor',
    brand: 'Dell',
    price: 28500000,
    discountPrice: 26900000,
    stock: 6,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      refreshRate: '165Hz',
      resolution: '3440 x 1440 (UWQHD)',
      panelType: 'QD-OLED',
      responseTime: '0.1ms',
      connection: 'DP 1.4 x2, HDMI 2.0 x1, USB 3.2 Gen 1',
      hdr: 'VESA DisplayHDR True Black 400',
    },
    description: 'Màu sắc sống động chân thực tuyệt đối với tấm nền Quantum Dot OLED được cân chỉnh màu sắc chuyên nghiệp từ nhà máy.',
  },
  {
    name: 'Màn hình Gigabyte M27Q X 27" 2K SS IPS 240Hz KVM Switch',
    slug: 'gigabyte-m27q-x-27-2k-ss-ips-240hz',
    category: 'monitor',
    brand: 'Gigabyte',
    price: 11900000,
    discountPrice: 10490000,
    stock: 15,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      refreshRate: '240Hz',
      resolution: '2560 x 1440 (2K)',
      panelType: 'SuperSpeed IPS',
      responseTime: '1ms',
      connection: 'HDMI 2.0 x2, DP 1.4 x1, Type-C x1 (KVM)',
    },
    description: 'Lựa chọn số 1 tầm trung cho game thủ: SuperSpeed IPS 240Hz tích hợp KVM switch điều khiển 2 máy tính trên 1 bộ gear.',
  },
  {
    name: 'Màn hình BenQ ZOWIE XL2546K 24.5" TN 240Hz DyAc+ Chuyên Esports',
    slug: 'benq-zowie-xl2546k-24-5-tn-240hz-dyac-plus',
    category: 'monitor',
    brand: 'BenQ ZOWIE',
    price: 12900000,
    discountPrice: 12200000,
    stock: 9,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      refreshRate: '240Hz',
      resolution: '1920 x 1080 (FHD)',
      panelType: 'Fast TN',
      responseTime: '0.5ms',
      connection: 'HDMI 2.0 x3, DP 1.2 x1',
      technology: 'DyAc+ Dynamic Accuracy, Black eQualizer',
    },
    description: 'Vũ khí tối thượng của các tuyển thủ CS2 và Valorant toàn cầu với công nghệ DyAc+ triệt tiêu bóng mờ khi sấy đạn.',
  },

  // --- MECHANICAL KEYBOARDS ---
  {
    name: 'Bàn phím cơ Keychron Q1 Pro Wireless QMK/VIA Full Nhôm CNC',
    slug: 'keychron-q1-pro-wireless-qmk-via-cnc-aluminum',
    category: 'keyboard',
    brand: 'Keychron',
    price: 4990000,
    discountPrice: 4590000,
    stock: 14,
    soldCount: 0,
    isHot: true,
    hotOrder: 4,
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      switch: 'Gateron Jupiter Brown (Tactile)',
      layout: '75%',
      connection: 'Không dây Bluetooth 5.1 & Type-C có dây',
      case: 'Full CNC Aluminum 6063',
      keycaps: 'KSA Double-shot PBT',
      rgb: 'South-facing RGB',
      battery: '4000mAh (Lên đến 300 giờ)',
    },
    description: 'Bàn phím cơ custom không dây vỏ nhôm nguyên khối, gasket mount êm ái, hỗ trợ tùy biến QMK/VIA không giới hạn.',
  },
  {
    name: 'Bàn phím cơ ASUS ROG Azoth 75% Wireless OLED Screen Snow Switch',
    slug: 'asus-rog-azoth-75-wireless-oled-snow-switch',
    category: 'keyboard',
    brand: 'ASUS',
    price: 6490000,
    discountPrice: 5990000,
    stock: 7,
    soldCount: 0,
    isHot: true,
    hotOrder: 5,
    images: [
      'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      switch: 'ROG NX Snow (Linear Pre-lubed)',
      layout: '75%',
      connection: 'Không dây 2.4GHz SpeedNova, Bluetooth 5.1, Type-C',
      screen: 'Màn hình OLED 2-inch hiển thị thông số & GIF',
      rgb: 'Aura Sync RGB từng phím',
      battery: 'Lên đến 2000 giờ (tắt LED & OLED)',
    },
    description: 'Đẳng cấp bàn phím gaming cao cấp với núm xoay đa năng ba hướng, màn hình OLED trực quan và lót foam 3 lớp cách âm cao cấp.',
  },
  {
    name: 'Bàn phím cơ Akko MOD007B-HE Hall Effect Magnetic Switch Rapid Trigger',
    slug: 'akko-mod007b-he-hall-effect-magnetic-switch',
    category: 'keyboard',
    brand: 'Akko',
    price: 3690000,
    discountPrice: 3290000,
    stock: 3,
    soldCount: 0,
    isHot: true,
    hotOrder: 6,
    images: [
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      switch: 'Akko Cream Yellow Magnetic (Hall Effect)',
      layout: '75%',
      connection: 'Không dây 2.4GHz, Bluetooth 5.0, Type-C',
      features: 'Rapid Trigger 0.1mm - 4.0mm, 8000Hz Polling',
      rgb: 'RGB 16.8 triệu màu',
    },
    description: 'Switch từ tính nam châm Hall Effect hiện đại, kích hoạt phím siêu tốc độ với Rapid Trigger 0.1mm dành riêng cho game thủ FPS.',
  },
  {
    name: 'Bàn phím cơ Corsair K100 RGB Optical-Mechanical Hyper-polling 8000Hz',
    slug: 'corsair-k100-rgb-optical-mechanical-8000hz',
    category: 'keyboard',
    brand: 'Corsair',
    price: 5490000,
    discountPrice: 4890000,
    stock: 10,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      switch: 'Corsair OPX Optical-Mechanical (Linear 1.0mm)',
      layout: 'Fullsize 108 phím',
      connection: 'Có dây Type-A (Bọc dù siêu bền)',
      features: 'Corsair AXON Hyper-Processing 8000Hz, iCUE Control Wheel',
      rgb: 'LightEdge 44 vùng LED RGB vòng cung',
    },
    description: 'Quái vật bàn phím Fullsize với tần số quét tín hiệu 8000Hz nhanh gấp 8 lần phím cơ thông thường.',
  },
  {
    name: 'Bàn phím cơ IQUNIX OG80 Dark Cowboy Wireless Tri-mode TTC Switch',
    slug: 'iqunix-og80-dark-cowboy-wireless-tri-mode',
    category: 'keyboard',
    brand: 'IQUNIX',
    price: 4200000,
    discountPrice: 3850000,
    stock: 8,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      switch: 'TTC Gold Pink (Linear siêu mượt)',
      layout: '80 phím gọn gàng',
      connection: 'Không dây 2.4GHz, Bluetooth 5.1, Type-C',
      keycaps: 'PBT Cherry Profile',
      battery: '4000mAh',
    },
    description: 'Thiết kế bán trong suốt phong cách Cowboy retro, nghiêng công thái học tự nhiên không mỏi tay khi gõ phím lâu.',
  },
  {
    name: 'Bàn phím cơ Wooting 60HE+ Analog Mechanical Lekker Switch',
    slug: 'wooting-60he-plus-analog-mechanical',
    category: 'keyboard',
    brand: 'Wooting',
    price: 5990000,
    discountPrice: 5790000,
    stock: 5,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1626958390898-162d3577f293?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      switch: 'Lekker Linear60 (Analog Magnetic)',
      layout: '60% Compact',
      connection: 'Có dây Type-C Detachable',
      features: 'Analog Input, Rapid Trigger, Tachyon Mode < 1ms',
    },
    description: 'Bàn phím cơ Analog nổi tiếng nhất thế giới game thủ với khả năng nhận diện độ sâu phím như cần điều khiển xe đua.',
  },

  // --- GAMING MICE ---
  {
    name: 'Chuột Logitech G Pro X Superlight 2 Lightspeed White 60g 32K DPI',
    slug: 'logitech-g-pro-x-superlight-2-lightspeed-white',
    category: 'mouse',
    brand: 'Logitech',
    price: 3690000,
    discountPrice: 3390000,
    stock: 20,
    soldCount: 0,
    isHot: true,
    hotOrder: 7,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      sensor: 'HERO 2 (100 - 32,000 DPI, >500 IPS)',
      weight: '60 gram',
      switch: 'LIGHTFORCE Hybrid Optical-Mechanical',
      connection: 'Không dây LIGHTSPEED 2.0 (Hỗ trợ 4000Hz polling)',
      battery: 'Lên đến 95 giờ liên tục, cổng sạc Type-C',
    },
    description: 'Thế hệ tiếp nối của biểu tượng chuột esports: Cảm biến HERO 2 độ phân giải 32K DPI cùng switch quang học lai độ bền siêu hạng.',
  },
  {
    name: 'Chuột Razer Viper V3 Pro Wireless Esports Mouse 54g 8000Hz',
    slug: 'razer-viper-v3-pro-wireless-54g-8000hz',
    category: 'mouse',
    brand: 'Razer',
    price: 4190000,
    discountPrice: 3890000,
    stock: 11,
    soldCount: 0,
    isHot: true,
    hotOrder: 8,
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      sensor: 'Focus Pro 35K Gen-2 Optical Sensor',
      weight: '54 gram',
      switch: 'Razer Optical Gen-3 (90 triệu lần nhấn)',
      connection: 'Không dây Razer HyperSpeed tích hợp 8000Hz Polling Dongle',
      battery: 'Lên đến 95 giờ',
    },
    description: 'Vũ khí thi đấu tối tân hợp tác cùng các pro player: Trọng lượng 54g cân đối hoàn hảo và tần số polling rate thực tế 8000Hz.',
  },
  {
    name: 'Chuột Pulsar X2V2 Wireless Gaming Mouse 53g PAW3395 Size Medium',
    slug: 'pulsar-x2v2-wireless-gaming-mouse-53g',
    category: 'mouse',
    brand: 'Pulsar',
    price: 2490000,
    discountPrice: 2250000,
    stock: 2,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1626218174358-7769486c4b79?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      sensor: 'PixArt PAW3395 (26,000 DPI, 650 IPS)',
      weight: '53 gram',
      switch: 'Optical Switches không bị double click',
      connection: 'Không dây 2.4GHz & Type-C (Hỗ trợ 4K Polling dongle)',
      battery: 'Khoảng 70 giờ',
    },
    description: 'Form cầm đối xứng symmetrical chuẩn mực cho phong cách Claw grip và Fingertip grip, click quang học nảy giòn tan.',
  },
  {
    name: 'Chuột ZOWIE EC2-CW Wireless Ergonomic Esports Mouse',
    slug: 'zowie-ec2-cw-wireless-ergonomic-esports',
    category: 'mouse',
    brand: 'BenQ ZOWIE',
    price: 3990000,
    discountPrice: 3690000,
    stock: 9,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      sensor: 'PixArt 3370 Sensor',
      weight: '77 gram',
      connection: 'Không dây 2.4GHz với Trạm phát Enhanced Receiver chống nhiễu sóng',
      features: 'Plug & Play 100% không cần cài driver hay phần mềm',
    },
    description: 'Chuột công thái học huyền thoại nay đã có bản không dây: Ổn định đường truyền tín hiệu tuyệt đối với trạm phát sóng rời.',
  },
  {
    name: 'Chuột Lamzu Atlantis OG V2 4K Wireless Superlight 55g',
    slug: 'lamzu-atlantis-og-v2-4k-wireless-55g',
    category: 'mouse',
    brand: 'Lamzu',
    price: 2650000,
    discountPrice: 2450000,
    stock: 8,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      sensor: 'PixArt PAW3395',
      weight: '55 gram',
      switch: 'Huano Transparent Blue Shell Pink Dot',
      connection: 'Không dây 4K Dongle kèm sẵn trong hộp',
    },
    description: 'Lưng gồ nhẹ tạo điểm tỳ vững chắc cho lòng bàn tay, kết hợp feet PTFE nguyên chất lướt êm ru trên mọi bề mặt pad chuột.',
  },
  {
    name: 'Chuột Finalmouse UltralightX Lion Carbon Fiber 31g Siêu Nhẹ',
    slug: 'finalmouse-ultralightx-lion-carbon-fiber-31g',
    category: 'mouse',
    brand: 'Finalmouse',
    price: 6800000,
    discountPrice: 6500000,
    stock: 3,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1626218174358-7769486c4b79?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      weight: '31 gram (Siêu vật liệu Carbon Fiber Composite)',
      sensor: 'Finalsensor Custom Pro',
      connection: 'Không dây 2.4G với tần số quét 8000Hz',
    },
    description: 'Kỳ quan công nghệ chuột gaming nhẹ nhất hành tinh chế tác từ sợi carbon composite độ bền cao cấp.',
  },

  // --- HEADPHONES ---
  {
    name: 'Tai nghe SteelSeries Arctis Nova Pro Wireless Multi-System ANC',
    slug: 'steelseries-arctis-nova-pro-wireless-anc',
    category: 'headphone',
    brand: 'SteelSeries',
    price: 9490000,
    discountPrice: 8690000,
    stock: 12,
    soldCount: 0,
    isHot: true,
    hotOrder: 9,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      drivers: 'Premium Hi-Res Neodymium 40mm',
      connection: 'Không dây 2.4GHz Lossless + Bluetooth song song',
      anc: 'Chống ồn chủ động 4 mic Hybrid ANC',
      battery: 'Hệ thống 2 pin Infinity Power System sạc luân phiên',
      features: 'Trạm điều khiển GameDAC Gen 2 màn hình OLED',
    },
    description: 'Tai nghe gaming không dây số 1 toàn cầu: Chống ồn chủ động, âm thanh không gian Sonar Audio vòm 360 độ và pin không bao giờ cạn.',
  },
  {
    name: 'Tai nghe HyperX Cloud III Wireless 120H Battery DTS Spatial',
    slug: 'hyperx-cloud-iii-wireless-120h-battery',
    category: 'headphone',
    brand: 'HyperX',
    price: 3890000,
    discountPrice: 3490000,
    stock: 16,
    soldCount: 0,
    isHot: true,
    hotOrder: 10,
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      drivers: 'Driver vát góc 53mm tái tạo âm bass uy lực',
      connection: 'Không dây 2.4GHz qua USB-C / USB-A dongle',
      battery: 'Thời lượng pin kỷ lục lên đến 120 giờ chỉ 1 lần sạc',
      mic: 'Micro khử ồn lọc tạp âm 10mm có đèn LED báo Mute',
    },
    description: 'Kế thừa sự êm ái huyền thoại của dòng Cloud với thời lượng pin không tưởng lên tới 120 tiếng liên tục.',
  },
  {
    name: 'Tai nghe Razer BlackShark V2 Pro 2023 Wireless TriForce 50mm',
    slug: 'razer-blackshark-v2-pro-2023-wireless',
    category: 'headphone',
    brand: 'Razer',
    price: 4990000,
    discountPrice: 4490000,
    stock: 14,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      drivers: 'Razer TriForce Titanium 50mm',
      connection: 'Không dây Razer HyperSpeed 2.4GHz + Bluetooth 5.2',
      mic: 'Razer HyperClear Super Wideband Mic chuyên nghiệp',
      battery: 'Lên tới 70 giờ chơi game',
    },
    description: 'Microphone thu âm trong trẻo nhất phân khúc cùng các profile âm thanh FPS chuyên dụng do các tuyển thủ quốc tế trực tiếp tinh chỉnh.',
  },
  {
    name: 'Tai nghe Logitech G PRO X 2 LIGHTSPEED Wireless Graphene Driver',
    slug: 'logitech-g-pro-x-2-lightspeed-wireless-graphene',
    category: 'headphone',
    brand: 'Logitech',
    price: 5990000,
    discountPrice: 5490000,
    stock: 10,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      drivers: 'Màng loa Graphene 50mm siêu cứng, giảm méo âm cực thấp',
      connection: 'LIGHTSPEED Wireless, Bluetooth, và Jack 3.5mm',
      battery: 'Thời lượng pin 50 giờ, sạc Type-C',
      cushion: 'Đệm tai giả da và đệm vải nỉ nhung có thể thay thế',
    },
    description: 'Màng loa đột phá làm từ vật liệu Graphene cho độ chi tiết âm thanh không gian chính xác đến từng bước chân đối thủ.',
  },
  {
    name: 'Tai nghe Audio-Technica ATH-GDL3 Open-Back Gaming 220g',
    slug: 'audio-technica-ath-gdl3-open-back-gaming',
    category: 'headphone',
    brand: 'Audio-Technica',
    price: 3300000,
    discountPrice: 2990000,
    stock: 8,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      drivers: 'Driver 45mm tái tạo âm thanh chuẩn Studio',
      weight: '220 gram siêu nhẹ',
      design: 'Thiết kế Open-Back mở thoáng âm trường siêu rộng',
      connection: 'Dây cáp 3.5mm tháo rời',
    },
    description: 'Âm thanh tự nhiên như ở đời thực từ thương hiệu audiophile hàng đầu Nhật Bản, đeo nhẹ như không suốt ngày dài.',
  },
  {
    name: 'Tai nghe Sennheiser EPOS H3PRO Hybrid ANC Wireless Gaming',
    slug: 'sennheiser-epos-h3pro-hybrid-anc-wireless',
    category: 'headphone',
    brand: 'Sennheiser',
    price: 7200000,
    discountPrice: 6490000,
    stock: 6,
    soldCount: 0,
    isHot: false,
    hotOrder: 0,
    images: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80',
    ],
    specs: {
      connection: 'Dongle độ trễ cực thấp, Bluetooth, cáp USB và jack 3.5mm',
      anc: 'Chống ồn ANC chuyên sâu triệt tiếng ồn phòng máy',
      mic: 'Cần mic từ tính tháo rời nam châm tiện lợi',
    },
    description: 'Chất âm trung thực huyền thoại từ Đức kết hợp công nghệ chống ồn tiên tiến mang lại sự tập trung cao độ trong các trận đấu kịch tính.',
  },
];

/**
 * NON-DESTRUCTIVE seed: Upserts users by email, products by slug.
 * NEVER deletes Order or InventoryLog collections.
 * Safe to run multiple times without data loss.
 */
export const seedDatabase = async () => {
  console.log('[Seed] Starting NON-DESTRUCTIVE database seeding (upsert mode)...');

  // 1. Upsert Users by email
  const userData = await getUserData();
  let usersInserted = 0;
  let usersSkipped = 0;

  if (userData.length === 0) {
    console.log('[Seed] Users: All default accounts already exist. Skipped hashing and upsert.');
  } else {
    for (const user of userData) {
      const existing = await User.findOneAndUpdate(
        { email: user.email },
        { $setOnInsert: user },
        { upsert: true, new: false }
      );
      if (!existing) {
        usersInserted++;
      } else {
        usersSkipped++;
      }
    }
    console.log(`[Seed] Users: ${usersInserted} inserted, ${usersSkipped} already existed (skipped).`);
  }

  // 2. Upsert Products by slug
  let productsInserted = 0;
  let productsSkipped = 0;
  const newlyCreatedProducts: any[] = [];

  for (const product of productData) {
    const res = await Product.findOneAndUpdate(
      { slug: product.slug },
      { $setOnInsert: product },
      { upsert: true, new: true, includeResultMetadata: true }
    );
    if (!res.lastErrorObject?.updatedExisting) {
      productsInserted++;
      if (res.value) newlyCreatedProducts.push(res.value);
    } else {
      productsSkipped++;
    }
  }
  console.log(`[Seed] Products: ${productsInserted} inserted, ${productsSkipped} already existed (skipped).`);

  // 3. Create inventory logs ONLY for newly inserted products
  if (newlyCreatedProducts.length > 0) {
    const logs = newlyCreatedProducts.map((p) => ({
      productId: p._id,
      productName: p.name,
      changeAmount: p.stock,
      previousStock: 0,
      newStock: p.stock,
      reason: 'restock' as const,
      note: 'Khởi tạo tồn kho ban đầu',
      updatedBy: 'System Seed',
    }));
    await InventoryLog.create(logs);
    console.log(`[Seed] Created ${logs.length} inventory logs for newly inserted products.`);
  }

  // 4. Seed Initial Banners safely (ONLY if collection is empty, avoids Data Resurrection Bug)
  await seedInitialBanners();

  // NEVER touch Order or InventoryLog collections with deleteMany
  console.log('[Seed] NON-DESTRUCTIVE seeding completed. Existing orders, inventory logs, and banners preserved.');
};

export const initialBannerData = [
  {
    title: 'ASUS ROG Swift OLED PG27AQDM',
    badge: 'SIÊU PHẨM MÀN HÌNH OLED 2026',
    subtitle: 'Tần số quét 240Hz • Phản hồi 0.03ms • Tản nhiệt buồng hơi Custom',
    desc: 'Đột phá hiển thị với màu đen vô cực và tốc độ phản hồi cực hạn cho game thủ đỉnh cao.',
    cta: 'Khám Phá Ngay',
    link: '/products/asus-rog-swift-oled-pg27aqdm-27-2k-240hz',
    tag: 'Chính Hãng ROG',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=80',
    imageFit: 'contain' as const,
    removeWhiteBg: true,
    theme: 'blue' as const,
    showSecondaryBtn: true,
    secondaryCta: 'Xem tất cả sản phẩm',
    secondaryLink: '/products',
    displayOrder: 0,
    isActive: true,
  },
  {
    title: 'Bàn Phím Cơ Hall Effect & Magnetic Switch',
    badge: 'CÔNG NGHỆ RAPID TRIGGER MỚI NHẤT',
    subtitle: 'Kích hoạt phím từ 0.1mm • Tần số quét tín hiệu 8000Hz • Vỏ nhôm CNC',
    desc: 'Triệt tiêu hoàn toàn delay gõ phím. Định hình lại trải nghiệm thi đấu Esports CS2 và Valorant.',
    cta: 'Xem Bộ Sưu Tập',
    link: '/products?category=keyboard',
    tag: 'Trending #1',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=80',
    imageFit: 'contain' as const,
    removeWhiteBg: false,
    theme: 'purple' as const,
    showSecondaryBtn: true,
    secondaryCta: 'Xem tất cả sản phẩm',
    secondaryLink: '/products',
    displayOrder: 1,
    isActive: true,
  },
  {
    title: 'Razer Viper V3 Pro & Logitech Superlight 2',
    badge: 'CHUỘT THI ĐẤU SIÊU NHẸ 54G',
    subtitle: 'Cảm biến Focus Pro 35K DPI • 8000Hz HyperPolling không dây',
    desc: 'Chuẩn mực mới của dòng chuột thi đấu chuyên nghiệp. Cầm chắc, lia chuẩn xác đến từng pixel.',
    cta: 'Sở Hữu Ngay',
    link: '/products?category=mouse',
    tag: 'Esports Pro Choice',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1400&q=80',
    imageFit: 'contain' as const,
    removeWhiteBg: false,
    theme: 'cyan' as const,
    showSecondaryBtn: true,
    secondaryCta: 'Xem tất cả sản phẩm',
    secondaryLink: '/products',
    displayOrder: 2,
    isActive: true,
  },
];

/**
 * NON-DESTRUCTIVE banner seed:
 * Seeds initial banners ONLY when Banner.countDocuments() === 0.
 * NEVER uses upsert by name to prevent Data Resurrection Bug on server restarts.
 */
export const seedInitialBanners = async () => {
  const count = await Banner.countDocuments();
  if (count === 0) {
    console.log('[Seed] Banners collection is empty. Seeding 3 initial hero banners...');
    const oledProduct = await Product.findOne({ slug: 'asus-rog-swift-oled-pg27aqdm-27-2k-240hz' }).select('_id');
    const akkoProduct = await Product.findOne({ slug: 'akko-mod007b-he-hall-effect-magnetic-switch' }).select('_id');
    const logiProduct = await Product.findOne({ slug: 'logitech-g-pro-x-superlight-2-lightspeed-white' }).select('_id');

    const bannersToInsert = [
      { ...initialBannerData[0], productId: oledProduct?._id || null },
      { ...initialBannerData[1], productId: akkoProduct?._id || null },
      { ...initialBannerData[2], productId: logiProduct?._id || null },
    ];

    await Banner.create(bannersToInsert);
    console.log('[Seed] 3 initial hero banners created successfully.');
  } else {
    console.log(`[Seed] Banners collection already contains ${count} items. Skipped seeding to avoid overwriting changes.`);
  }
};

/**
 * DESTRUCTIVE seed: Clears ALL data and re-seeds from scratch.
 * Only available via `npm run seed -- --force`.
 */
export const seedDatabaseFresh = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Seed:Fresh] 🚨 FATAL: Destructive seeding is strictly blocked in production environment!');
  }

  console.log('[Seed:Fresh] ⚠️  DESTRUCTIVE MODE: Clearing ALL data and re-seeding...');

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    InventoryLog.deleteMany({}),
    Banner.deleteMany({}),
  ]);
  console.log('[Seed:Fresh] Cleared all collections.');

  // Create users (force generate to compute hashes fresh after deleteMany)
  const userData = await getUserData(true);
  const createdUsers = await User.create(userData);
  console.log(`[Seed:Fresh] Created ${createdUsers.length} users.`);

  // Create products
  const createdProducts = await Product.create(productData);
  console.log(`[Seed:Fresh] Created ${createdProducts.length} products.`);

  // Create initial inventory logs
  const logs = createdProducts.map((p) => ({
    productId: p._id,
    productName: p.name,
    changeAmount: p.stock,
    previousStock: 0,
    newStock: p.stock,
    reason: 'restock' as const,
    note: 'Khởi tạo tồn kho ban đầu',
    updatedBy: 'System Seed',
  }));
  await InventoryLog.create(logs);

  // Seed initial banners
  await seedInitialBanners();

  console.log('[Seed:Fresh] DESTRUCTIVE re-seeding completed. All data reset to defaults.');
};

// If run directly via command line
if (require.main === module) {
  const isForce = process.argv.includes('--force') || process.argv.includes('--clean');

  (async () => {
    try {
      await connectDB();

      if (isForce) {
        await seedDatabaseFresh();
      } else {
        await seedDatabase();
      }

      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]:', err);
      process.exit(1);
    }
  })();
}
