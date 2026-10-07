# 🔐 Hướng Dẫn Cấu Hình Đăng Nhập Google Thật (Google OAuth 2.0)

Tài liệu này hướng dẫn chi tiết từng bước để tạo và cấu hình **Google Client ID** cho dự án **TECHGEAR PRO**, giúp khách hàng và nhân viên có thể đăng nhập bằng tài khoản Google thật.

---

## Bước 1: Truy cập Google Cloud Console

1. Mở trình duyệt và truy cập: **[https://console.cloud.google.com](https://console.cloud.google.com)**.
2. Đăng nhập bằng tài khoản Google cá nhân hoặc doanh nghiệp của bạn.
3. Ở thanh điều hướng trên cùng, bấm vào danh sách chọn dự án (Project dropdown) ➔ Chọn **"New Project" (Dự án mới)**:
   - **Project Name (Tên dự án):** `TechGear Pro` (hoặc tên tùy ý).
   - Nhấn **Create (Tạo)** và chờ Google khởi tạo dự án (khoảng 5-10 giây).
   - Chọn dự án vừa tạo từ danh sách dự án.

---

## Bước 2: Cấu hình Màn hình đồng ý OAuth (OAuth Consent Screen)

Trước khi tạo mã khóa Client ID, Google yêu cầu cấu hình màn hình hiển thị khi người dùng bấm đăng nhập:

1. Trong menu bên trái, chọn **APIs & Services (API & Dịch vụ)** ➔ **OAuth consent screen (Màn hình đồng ý OAuth)**.
2. Tại mục **User Type (Loại người dùng)**:
   - Chọn **External (Bên ngoài)** (cho phép bất kỳ ai có tài khoản Google đều có thể đăng nhập).
   - Bấm **Create (Tạo)**.
3. Điền thông tin ứng dụng (**App Information**):
   - **App name (Tên ứng dụng):** `TECHGEAR PRO`
   - **User support email (Email hỗ trợ người dùng):** Chọn email của bạn.
   - **Developer contact information (Thông tin liên hệ lập trình viên):** Nhập email của bạn.
   - Bấm **Save and Continue (Lưu và tiếp tục)**.
4. Bước **Scopes (Phạm vi)**:
   - Bấm **Add or Remove Scopes (Thêm hoặc xóa phạm vi)**.
   - Chọn các quyền cơ bản:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Bấm **Update (Cập nhật)** ➔ Bấm **Save and Continue (Lưu và tiếp tục)**.
5. Bước **Test users (Người dùng thử nghiệm)**:
   - Khi ứng dụng đang ở trạng thái *Testing (Thử nghiệm)*, hãy thêm các email Google của bạn và người thử nghiệm tại mục **Add users** để có quyền đăng nhập.
   - Bấm **Save and Continue (Lưu và tiếp tục)** ➔ Bấm **Back to Dashboard**.

---

## Bước 3: Tạo Khóa OAuth 2.0 Client ID

1. Trong menu bên trái, chọn **Credentials (Thông tin xác thực)**.
2. Nhấn vào nút **+ Create Credentials (+ Tạo thông tin xác thực)** ở trên cùng ➔ Chọn **OAuth client ID**.
3. Điền thông số cấu hình:
   - **Application type (Loại ứng dụng):** Chọn **Web application (Ứng dụng web)**.
   - **Name (Tên):** `TechGear Web Client`
   - **Authorized JavaScript origins (Nguồn gốc JavaScript được ủy quyền):**
     Bấm **+ Add URI** và thêm các địa chỉ sau:
     - `http://localhost:3000` (dành cho frontend chạy môi trường phát triển)
     - `http://localhost:5000` (dành cho backend)
     - `http://127.0.0.1:3000`
     - *(Nếu có domain production sau này, thêm ví dụ: `https://techgear.vn`)*
   - **Authorized redirect URIs (URI chuyển hướng được ủy quyền):**
     Bấm **+ Add URI** và thêm:
     - `http://localhost:3000`
4. Bấm **Create (Tạo)**.
5. Một cửa sổ popup hiện lên chứa:
   - **Your Client ID** (Định dạng mẫu: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`)
   - *Lưu ý: Bạn chỉ cần sao chép Client ID, không cần chia sẻ Client Secret ra frontend.*

---

## Bước 4: Cấu hình Biến Môi Trường (Environment Variables)

Sau khi có `Client ID`, bạn cần dán vào 2 file cấu hình trong dự án:

### 1. Cấu hình Backend: `backend/.env`
Mở file `backend/.env` và điền giá trị vào dòng `GOOGLE_CLIENT_ID`:
```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### 2. Cấu hình Frontend: `frontend/.env.local`
Mở file `frontend/.env.local` và điền giá trị giống hệt vào dòng `NEXT_PUBLIC_GOOGLE_CLIENT_ID`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

> **Lưu ý quan trọng:** Next.js đóng gói các biến có tiền tố `NEXT_PUBLIC_` vào mã JavaScript client trong lúc khởi động. Do đó, mỗi khi bạn thay đổi file `frontend/.env.local`, bạn **phải khởi động lại server frontend (`npm run dev`)** để biến mới có hiệu lực.

---

## Bước 5: Khởi động và Thử nghiệm

1. **Khởi động Backend:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Khởi động Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Kiểm tra luồng hoạt động:**
   - Mở trình duyệt tại **[http://localhost:3000/auth/login](http://localhost:3000/auth/login)**.
   - Nút **"Đăng nhập với Google"** sẽ xuất hiện chuẩn giao diện Google One Tap / Sign In.
   - Bấm vào nút đăng nhập Google ➔ Chọn tài khoản Google đã thêm trong danh sách Test users.
   - Hệ thống tự động xác thực token với backend:
     - Nếu là tài khoản mới: Tự động tạo tài khoản khách hàng, tạo JWT và chuyển hướng về trang chủ `/`.
     - Nếu là tài khoản quản trị (email `@techgear.vn`): Tự động chuyển hướng về trang Admin `/admin`.
   - Vào trang cá nhân **[http://localhost:3000/profile](http://localhost:3000/profile)**: Bạn sẽ thấy huy hiệu **"Google Account"** và trạng thái phương thức xác thực đã liên kết, an toàn không cần mật khẩu riêng.

---

## Các lỗi thường gặp (Troubleshooting)

1. **Nút Google không hiển thị:**
   - Kiểm tra `NEXT_PUBLIC_GOOGLE_CLIENT_ID` trong `frontend/.env.local` có giá trị chưa.
   - Hãy restart lại lệnh `npm run dev` ở frontend.
2. **Lỗi `idpiframe_initialization_failed` hoặc `Not a valid origin for the client`:
   - URL trên trình duyệt (thường là `http://localhost:3000`) chưa được thêm vào mục **Authorized JavaScript origins** trên Google Cloud Console.
   - Google có thể mất từ 2-5 phút để đồng bộ origin mới.
3. **Lỗi `Access blocked: app has not completed the Google verification process`:**
   - Do app đang ở chế độ Testing. Hãy chắc chắn tài khoản Google bạn dùng để đăng nhập đã được thêm vào danh sách **Test users** ở Bước 2.
