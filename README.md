# UIT Knowledge - Platform Documentation

Giao diện học tập và quản lý khóa học/video cho cộng đồng UIT.

## 🛠️ Công nghệ sử dụng
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend**: [Supabase](https://supabase.com/) (Database, Auth, Storage).
- **Design**: Hiện đại, Dark mode, Responsive.

## 🚀 Cách chạy dự án
Dự án là một trang web tĩnh, bạn có thể chạy bằng bất kỳ công cụ local server nào.

### Cách 1: Sử dụng npm (Khuyên dùng)
1. Cài đặt [Node.js](https://nodejs.org/).
2. Chạy lệnh:
   ```bash
   npm run dev
   ```
3. Truy cập: `http://localhost:3000` (hoặc cổng hiển thị trong terminal).

### Cách 2: Sử dụng VS Code Live Server
Nếu bạn dùng VS Code, hãy cài extension **Live Server**, chuột phải vào `index.html` và chọn **Open with Live Server**.

## 🛡️ Trang Quản Trị (Admin)
Truy cập `/helloworld` để quản lý nội dung:
- Thêm/Sửa/Xóa Video YouTube.
- Quản lý Khóa học và Link đăng ký.
- Quản lý Merch (Sản phẩm).

### Đăng nhập Admin
1. Tạo tài khoản trong **Supabase Dashboard** -> **Authentication**.
2. Đăng nhập tại trình duyệt của bạn.

## ⚙️ Cấu hình Supabase
File cấu hình nằm tại `supabase.js`. Các bảng dữ liệu bao gồm:
- `videos`: `title`, `description`, `video_id`, `category`, `duration`.
- `courses`: `title`, `description`, `price`, `registration_link`, `is_hot`.
- `merch`: `name`, `description`, `price`, `placeholder_class`.
