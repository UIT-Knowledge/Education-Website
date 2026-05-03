# Chiến lược Tối ưu Hiệu suất Website (GitHub Pages)

Tài liệu này phác thảo kế hoạch tối ưu hóa hiệu suất cho UIT Knowledge mà không làm giảm đi các hiệu ứng hiện có (Liquid Glass, animations).

## 1. Phân tích hiện tại
- **Công nghệ**: HTML/CSS/JS thuần, Supabase.
- **Tài sản**: CSS lớn (~82KB), JS thủ công (~40KB), nhiều thư viện external (Supabase, html2canvas, liquidGL).
- **Lưu trữ**: GitHub Pages (CDN mặc định tốt nhưng cần tối ưu phía client).

## 2. Các giai đoạn thực hiện

### Giai đoạn 1: Tối ưu hóa Tài nguyên (Build-time)
- **Minification**: Tự động nén `styles.css` và `script.js` để giảm dung lượng (~30-50%).
- **Image Compression**: Nén các ảnh trong thư mục `assets/images` sang định dạng WebP.
- **Resource Hints**: Thêm `dns-prefetch` và `preconnect` cho Supabase và Google Fonts.

### Giai đoạn 2: Tối ưu hóa Hiển thị (LCP & CLS)
- **Critical CSS**: Trích xuất và inline CSS quan trọng của phần Hero vào `<head>` để trang hiện ra ngay lập tức.
- **Font Optimization**: Tối ưu hóa việc tải font Montserrat, sử dụng `font-display: swap`.
- **Lazy Loading**: Áp dụng `loading="lazy"` cho tất cả các ảnh và iframe (YouTube).

### Giai đoạn 3: Tối ưu hóa Runtime & Caching
- **Service Worker**: Nâng cấp `sw.js` để cache các thư viện external và tài sản tĩnh hiệu quả hơn.
- **Supabase Query Optimization**: Đảm bảo chỉ fetch các cột cần thiết từ Supabase.
- **LiquidGL Throttling**: Tối ưu hóa hiệu ứng Liquid Glass để không chiếm quá nhiều tài nguyên CPU khi không cần thiết.

### Giai đoạn 4: Tự động hóa (GitHub Actions)
- Thiết lập GitHub Actions để tự động chạy lệnh `build` (nén, tối ưu) trước khi deploy lên GitHub Pages.

## 3. Danh sách kiểm tra (Verification)
- [ ] Kiểm tra Lighthouse Score (Target: >90 Performance).
- [ ] Đảm bảo các hiệu ứng `liquidGL` vẫn mượt mà.
- [ ] Kiểm tra hiển thị trên mobile (Responsive).
- [ ] Xác minh Service Worker hoạt động chính xác (Offline mode).

---
## Câu hỏi Socratic (Cần xác nhận)
1. Bạn có muốn sử dụng một công cụ build nhẹ (như `esbuild` hoặc `lightningcss`) để tự động hóa việc nén không?
2. Bạn có sẵn lòng chuyển đổi các ảnh hiện có sang định dạng `.webp` để đạt hiệu suất cao nhất không?
3. Bạn đã có file `.github/workflows/deploy.yml` chưa, hay tôi nên tạo mới?
