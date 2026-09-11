# 🚀 TECHGEAR PRO - Hệ Thống Thương Mại Điện Tử Thiết Bị & Phụ Kiện Máy Tính Cao Cấp

Hệ thống website thương mại điện tử chuyên nghiệp cung cấp thiết bị và phụ kiện máy tính cao cấp (Màn hình máy tính, Bàn phím cơ, Chuột gaming, Tai nghe). Gồm 2 phân hệ hoàn chỉnh: **Storefront (Khách hàng)** và **Admin Dashboard (Quản trị viên)**.

---

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

- **Kiến trúc Monorepo:**
  - `backend/`: Node.js + Express.js + TypeScript RESTful API, Mongoose ODM.
  - `frontend/`: Next.js 14+ (App Router) + Tailwind CSS + Framer Motion + Lucide React + Recharts + Embla Carousel.
- **Cơ sở dữ liệu:** MongoDB (hỗ trợ MongoDB Local, MongoDB Atlas và **tự động fallback In-Memory MongoDB `mongodb-memory-server`** giúp khởi chạy ngay lập tức mà không cần cài đặt MongoDB daemon).
- **Quản lý trạng thái:** Zustand (persist localStorage) & TanStack React Query.
- **Cổng thanh toán:** VNPAY Sandbox (chữ ký HMAC SHA512) kết hợp COD và **Chế độ Mock Test Payment** giúp kiểm thử luồng thanh toán tức thì.

---

## 🔑 Tài Khoản Mẫu (Demo Credentials)

Hệ thống có sẵn nút **"Bấm Để Điền Nhanh"** tại trang Đăng nhập:

| Vai trò (Role) | Email | Mật khẩu | Quyền hạn (Permissions) |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@techgear.vn` | `admin123` | Toàn quyền quản trị hệ thống (`all`) |
| **Nhân viên Kho (Warehouse)** | `warehouse@techgear.vn` | `staff123` | Quản lý kho, nhập hàng (`inventory`) |
| **Nhân viên Đơn hàng (Orders)** | `orders@techgear.vn` | `staff123` | Xử lý tiến trình đơn hàng (`orders`) |
| **Khách Hàng (Customer)** | `customer@gmail.com` | `customer123` | Mua hàng, tra cứu đơn, quản lý profile |

---

## 🌟 Các Tính Năng Đã Hoàn Thiện Chuẩn SRS

### 1. Phân Hệ Khách Hàng (Storefront / Client-side)
- **Trang chủ (`/`):**
  - **Hero Slider:** Autoplay Carousel (Embla Carousel), hỗ trợ vuốt chạm, pause on hover, chuyển cảnh mượt mà, chuyển động indicator.
  - **Danh mục nổi bật:** Lưới 4 danh mục chính (Màn hình, Bàn phím cơ, Chuột, Tai nghe) với hiệu ứng hover zoom và nâng thẻ (lift).
  - **Sản phẩm HOT:** Danh sách các sản phẩm HOT được ghim từ Admin Dashboard, gắn huy hiệu lửa nổi bật.
  - **Tab New Arrivals / Best Sellers:** Chuyển đổi linh hoạt giữa hàng mới về và bán chạy nhất.
  - **Bộ lọc nhanh (Quick Filter Bar):** Tìm kiếm theo từ khóa, khoảng giá, thương hiệu, switch phím cơ, tần số quét màn hình, kiểu kết nối (có dây / không dây).
- **Trang cửa hàng (`/products`):** Bộ lọc nâng cao đa tiêu chí ở thanh bên (Sidebar), sắp xếp theo giá tăng/giảm, bán chạy, mới nhất, phân trang trực quan.
- **Chi tiết sản phẩm (`/products/[slug]`):** Bộ sưu tập ảnh (Image gallery), thông số kỹ thuật chi tiết, cảnh báo tồn kho thời gian thực, chọn số lượng, nút thêm vào giỏ và mua ngay.
- **Giỏ hàng (`/cart`):** Thêm/sửa số lượng, xóa sản phẩm, tự động kiểm tra giới hạn tồn kho, miễn phí vận chuyển cho đơn hàng từ 1.000.000đ.
- **Thanh toán (`/checkout`):**
  - Nhập thông tin người nhận (Họ tên, SĐT, Địa chỉ, Ghi chú).
  - Tự động điền nếu đã đăng nhập.
  - Lựa chọn phương thức: **COD** hoặc **Thanh toán trực tuyến (VNPAY)**.
- **Kết quả thanh toán (`/payment-result`):**
  - Xử lý phản hồi từ VNPAY Return URL.
  - Tích hợp **Mock Payment Mode** với 2 nút: *Thành công (Test Pass)* và *Thất bại (Test Fail)* cùng hiệu ứng pháo hoa Confetti.
- **Tra cứu đơn hàng (`/order-tracking`):**
  - Tra cứu nhanh bằng **Mã đơn hàng** (`TG...`) + **Số điện thoại**.
  - Hiển thị tiến trình trực quan đầy đủ **5 mốc chuẩn SRS**: `Chờ xác nhận` ➔ `Đang xử lý` ➔ `Đang giao hàng` ➔ `Đã giao` ➔ `Đã hủy`.
- **Tài khoản cá nhân (`/profile`):** Cập nhật thông tin và xem lịch sử các đơn hàng đã đặt.

---

### 2. Phân Hệ Quản Trị (Admin Dashboard - `/admin`)
- **Báo cáo doanh thu & Thống kê (`/admin`):**
  - 4 thẻ chỉ số KPI: Tổng doanh thu, Tổng đơn hàng, Sản phẩm bán trong ngày, Cảnh báo tồn kho thấp.
  - **Biểu đồ doanh thu định kỳ (Recharts):** Xem theo **Tuần** (7 ngày qua), **Tháng** (12 tháng trong năm) hoặc **Năm**.
  - **Doanh thu theo Quý (Q1, Q2, Q3, Q4):** Thống kê doanh thu từng quý, so sánh tỷ lệ phần trăm tăng trưởng so với quý trước.
  - **Thống kê sản phẩm bán trong ngày theo 4 danh mục:** Biểu đồ Donut phân tích số lượng bán ra của Màn hình, Bàn phím cơ, Chuột, Tai nghe.
- **Quản lý kho hàng & Cảnh báo tồn (`/admin/inventory`):**
  - Theo dõi tồn kho thời gian thực của từng sản phẩm.
  - Cảnh báo tự động khi số lượng tồn kho `< 5` chiếc.
  - Nút lọc nhanh các sản phẩm sắp hết hàng.
  - Modal điều chỉnh tồn kho (nhập thêm hàng hoặc kiểm kê) kèm ghi chú.
  - Bảng lịch sử kiểm kê và xuất nhập kho (**Inventory Audit Log**).
- **Quản lý sản phẩm & Ghim HOT (`/admin/products`):**
  - Thêm, sửa, xóa sản phẩm đầy đủ thông số.
  - **Tải ảnh trực tiếp từ thư viện máy tính (File Upload)**: Tích hợp module upload hình ảnh (`POST /api/upload`) bằng `multer`, hỗ trợ kéo thả (drag-and-drop) hoặc mở tệp từ máy tính (PNG, JPG, JPEG, WEBP, GIF tối đa 10MB), tự động preview thumbnail, đổi/xóa ảnh và hỗ trợ cả thư viện ảnh phụ (gallery), song song với nhập URL trực tiếp.
  - **Module chọn và ghim (Pin/Toggle)** sản phẩm hiển thị tại mục "Sản phẩm HOT" ngoài trang chủ.
  - **Sắp xếp thứ tự hiển thị bằng Kéo Thả (Drag-and-Drop Order)** hỗ trợ HTML5 gesture và lưu tự động vào database.
- **Quản lý đơn hàng (`/admin/orders`):**
  - Xem tất cả đơn hàng, tìm kiếm theo mã đơn hoặc số điện thoại.
  - Lọc theo trạng thái đơn hàng và trạng thái thanh toán.
  - Cập nhật trạng thái đơn (khi chọn `Đã hủy`, hệ thống sẽ tự động hoàn lại tồn kho cho sản phẩm).
  - Tích hợp **Rate Limiting** bảo vệ endpoint đặt hàng chống spam, **Atomic Reservation** chống overselling/race conditions khi có nhiều đơn đồng thời.
  - Tích hợp **VNPAY IPN & Payment Webhook** bảo mật bằng chữ ký HMAC SHA256 / SHA512.
  - Modal xem chi tiết sản phẩm và địa chỉ người nhận.
- **Quản lý người dùng & Phân quyền RBAC (`/admin/users`):**
  - Danh sách khách hàng kèm tổng giá trị chi tiêu vòng đời (**Customer LTV**), số lượng đơn hàng đã đặt.
  - Chức năng khóa / mở khóa tài khoản khách hàng.
  - Thêm tài khoản nhân viên mới và **Chỉnh sửa vai trò & phân quyền trực tiếp** theo mẫu: `Super Admin`, `Warehouse Manager`, `Order Processor`, `Sales Support`.

---

## ⚡ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu môi trường
- **Node.js**: >= v18.x (khuyên dùng Node 20 LTS)
- **npm**: >= 9.x

### 2. Khởi chạy Backend (Port 5000)

```powershell
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies (nếu chưa cài)
npm install

# Khởi chạy server ở chế độ phát triển
npm run dev

# Hoặc khởi chạy bản build production
npm run build
npm start
```
*Ghi chú: Nếu hệ thống chưa cài MongoDB, server sẽ tự động kích hoạt In-Memory MongoDB và tự động gieo dữ liệu mẫu ban đầu (seeding) gồm 24+ sản phẩm cao cấp, tài khoản người dùng và 50+ đơn hàng rải đều 4 quý.*

### 3. Khởi chạy Frontend (Port 3000)

Mở một cửa sổ terminal mới:

```powershell
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies (nếu chưa cài)
npm install

# Khởi chạy Next.js dev server
npm run dev
```

Truy cập website tại: **[http://localhost:3000](http://localhost:3000)**  
Truy cập trang Quản Trị tại: **[http://localhost:3000/admin](http://localhost:3000/admin)**

---

## 🧪 Chạy Bộ Kiểm Thử Tự Động (Verification Tests)

Trong thư mục `backend`, chạy:

```powershell
npx tsx src/tests/verify.ts
```

Bộ kiểm thử sẽ tự động chạy qua 18 kịch bản (Kiểm tra kết nối API, bộ lọc đa danh mục & thông số, đăng nhập Admin/Customer, đặt hàng, trừ tồn kho, chặn đặt quá số lượng kho, tra cứu đơn hàng, giả lập thanh toán VNPAY, hủy đơn hoàn kho, biểu đồ doanh thu Q1-Q4, cảnh báo tồn kho `< 5`, tính toán LTV khách hàng).

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```
website_Dien_Tu/
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình db.ts (In-Memory fallback), env.ts
│   │   ├── controllers/     # auth, product, order, admin analytics
│   │   ├── middlewares/     # auth, role check, error handler
│   │   ├── models/          # User, Product, Order, InventoryLog
│   │   ├── routes/          # API endpoints
│   │   ├── scripts/         # seed.ts (24+ gear, 50+ orders Q1-Q4)
│   │   ├── tests/           # verify.ts (18 automated tests)
│   │   ├── utils/           # vnpay HMAC SHA512
│   │   └── index.ts         # Server entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/       # Dashboard, inventory, products, orders, users
│   │   │   ├── auth/        # Login & Register
│   │   │   ├── cart/        # Giỏ hàng
│   │   │   ├── checkout/    # Thanh toán COD & VNPAY
│   │   │   ├── order-tracking/ # Tra cứu đơn hàng trực quan
│   │   │   ├── payment-result/ # Kết quả & Mock payment mode
│   │   │   ├── products/    # Cửa hàng & Chi tiết sản phẩm [slug]
│   │   │   ├── profile/     # Quản lý cá nhân & Lịch sử
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     # Trang chủ (Hero slider, Hot products, tabs)
│   │   ├── components/      # Header, Footer, ProductCard, HeroSlider, FilterBar...
│   │   ├── lib/             # api.ts, utils.ts
│   │   └── store/           # Zustand cartStore & authStore
│   └── package.json
│
└── README.md
```
