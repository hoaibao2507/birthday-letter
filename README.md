# 💌 Bức thư sinh nhật

Một trang web tĩnh, chỉ có **một khung** (dùng cho điện thoại): người nhận chạm vào phong thư,
thư mở ra cùng pháo hoa, confetti, bóng bay, bánh sinh nhật thổi nến, nhạc hộp "Happy Birthday",
rồi những lời chúc và lời yêu thương hiện dần trên giấy thư, kết thúc bằng một trái tim lớn lấp lánh.

Không cần cài đặt hay build — chỉ có `index.html`, `style.css`, `app.js`, `config.js`.

## Sửa nội dung

Mở `config.js`:

| Trường | Ý nghĩa |
| --- | --- |
| `to` / `from` | tên bạn gái / cách ký tên |
| `date` | ngày hiện trên dấu bưu điện |
| `since` | ngày bắt đầu yêu `YYYY-MM-DD` → màn cuối hiện "đã bên nhau X ngày" (để `null` để ẩn) |
| `pages` | các trang thư (xem chú thích trong file) |

Trong chữ: `{to}`, `{from}` được thay tên; `*chữ*` được tô bút dạ quang; `♥` thành trái tim đỏ.

Đổi tên nhanh mà không sửa file, bằng link: `https://…/?to=Linh&from=Bảo`

## Chạy thử trên máy

Mở thẳng `index.html` bằng trình duyệt (cần mạng để tải font), hoặc:

```bash
npx serve .
```

## Đưa lên GitHub Pages (để quét QR là xem được)

1. Tạo repo, push code lên nhánh `main`.
2. Vào **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main` / `(root)`.
3. Sau ít phút trang có tại `https://<tên-github>.github.io/<tên-repo>/` — dán link này vào ô "Đường dẫn khi quét" của trang tạo khung ảnh để tạo mã QR.

## Ghi chú

- Nhạc được tạo trực tiếp bằng WebAudio (không dùng file âm thanh nào); bắt đầu phát khi người xem chạm mở thư. Nút ♪ ở góc dưới để tắt/bật.
- Tôn trọng `prefers-reduced-motion`: giảm hiệu ứng nếu máy bật chế độ này.
- Cần mạng để tải font từ Google Fonts; không có mạng vẫn xem được với font dự phòng.
