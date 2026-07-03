# Bộ Quy Tắc Làm Việc Cho AI (Agent / Cursor / Copilot Rules) - Dự Án LazPe

Chào mừng AI Assistant! Tài liệu này chứa toàn bộ các quy định, tiêu chuẩn kỹ thuật, và phong cách lập trình bắt buộc áp dụng khi tham gia phát triển dự án **LazPe** (Hệ thống thương mại điện tử PolyBaby & Tích hợp cổng thanh toán).

Hãy đọc kỹ hướng dẫn này để đảm bảo code được sinh ra luôn đồng nhất, chất lượng cao, an toàn và dễ bảo trì.

---

## 1. Tổng Quan Kiến Trúc & Công Nghệ (Tech Stack)

Dự án LazPe bao gồm hai phần chính:

### Backend (PolyBabyAPI)
* **Framework:** ASP.NET Core 8.0 (.NET 8.0) Web API + MVC (hỗ trợ Area `Admin`).
* **Cơ sở dữ liệu:**
  * **Chính:** SQL Server kết hợp Entity Framework Core 8 (sử dụng Split Query cho hiệu năng tối ưu).
  * **Phụ trợ:** MongoDB (lưu trữ log, dữ liệu phi cấu trúc, hoặc các cụm dữ liệu phụ).
* **Định danh & Bảo mật:** ASP.NET Core Identity (hỗ trợ Cookie cho MVC Admin & JWT Bearer cho API Client), Rate Limiting chống spam/DDoS.
* **Xử lý nền (Background Jobs):** Hangfire Scheduler chạy các tác vụ định kỳ (Reset VIP, phát Voucher sinh nhật, Re-train AI Model).
* **AI & Machine Learning:** ML.NET Recommender (huấn luyện model gợi ý sản phẩm tự động, chạy định kỳ bằng Hangfire).
* **Bên thứ ba:** VNPay (Thanh toán), Cloudinary (Lưu trữ ảnh), Gemini API (Chatbot hỗ trợ khách hàng).
* **Real-time:** SignalR Hubs (`/chatHub`, `/notificationHub`).

### Frontend (Next.js Application)
* **Framework:** Next.js 16+ (App Router) & React 19.
* **Ngôn ngữ:** TypeScript (yêu cầu strict type).
* **CSS:** Tailwind CSS v4 (sử dụng `@tailwindcss/postcss`).
* **Thư viện chính:** SignalR Client (kết nối real-time), TipTap (Trình soạn thảo rich text), ApexCharts (Biểu đồ thống kê), Sonner (Thông báo dạng toast).

---

## 2. Quy Tắc Ứng Xử & Quy Trình Làm Việc Của AI

1. **Bắt buộc lập Kế hoạch thực hiện (Implementation Plan):** Đối với bất kỳ yêu cầu nào liên quan đến thay đổi code, giới thiệu chức năng mới, sửa lỗi hoặc cải tiến hệ thống, AI **bắt buộc** phải viết tài liệu Kế hoạch thực hiện (`Implementation Plan`) chi tiết trước. Developer phải đọc và phê duyệt kế hoạch này thì AI mới được phép tiến hành lập trình hay chỉnh sửa tệp tin.
2. **Tìm hiểu trước khi Code (Read-First):** Luôn tìm hiểu cấu trúc hiện tại của dự án trước khi viết file mới. Xem kỹ `Program.cs` và các Service/Controller liên quan để tái sử dụng tối đa logic có sẵn.
3. **Ngôn ngữ giao tiếp:** Luôn giao tiếp với Developer bằng tiếng Việt lịch sự, ngắn gọn, súc tích và rõ ràng.
4. **Giữ nguyên Comment & Metadata:** Tuyệt đối không xóa comment, docstrings cũ trong code trừ khi được yêu cầu sửa đổi trực tiếp.
5. **Kiểm tra biên dịch:** Sau khi sửa code, nhắc nhở hoặc thực hiện chạy lệnh build/lint để đảm bảo code không lỗi trước khi báo cáo hoàn thành.

---

## 3. Tiêu Chuẩn Lập Trình Backend (C# .NET 8)

### Cấu Trúc Thư Mục & Phân Tách Nhiệm Vụ (Separation of Concerns)
* **Controllers:** Chỉ chịu trách nhiệm routing, validation cơ bản, định dạng response và gọi Service. **Tuyệt đối không viết logic nghiệp vụ (business logic) tại Controller.**
* **Services & Interfaces:** Chứa toàn bộ nghiệp vụ. Mỗi service bắt buộc phải kế thừa từ một interface tương ứng (Ví dụ: `IProductService` & `ProductService`) và đăng ký Dependency Injection ở `Program.cs`.
* **DTOs (Data Transfer Objects):** Luôn sử dụng DTO cho dữ liệu đầu vào (Request DTO) và đầu ra (Response DTO). **Không expose trực tiếp Entity Models (như Product, Invoice, User) ra API.**
* **Models / Entities:** Định nghĩa cấu trúc database, hạn chế logic phức tạp.

### Entity Framework Core (EF Core) Best Practices
* **Async/Await:** Luôn viết code bất đồng bộ xuyên suốt từ Controller đến DB (ví dụ: `ToListAsync()`, `FirstOrDefaultAsync()`, `SaveChangesAsync()`).
* **Split Queries:** Đối với các câu truy vấn phức tạp hoặc Include nhiều bảng con, hãy sử dụng `.AsSplitQuery()` (đã cấu hình mặc định trong `Program.cs` cho `ApplicationDbContext`).
* **Tránh N+1 Query:** Luôn nạp dữ liệu liên quan bằng `.Include()` một cách thông minh, tránh lặp vòng lặp gọi database.
* **Migrations:** Không tự ý sửa tay dữ liệu trong file Migration. Khi đổi Model, dùng lệnh `dotnet ef migrations add` để tạo Migration tự động.

### Định Dạng Dữ Liệu & API Response
* **Naming Convention:** API Response tuân thủ `camelCase` (được cấu hình qua JSONOptions trong `Program.cs`).
* **DateTime:** Múi giờ sử dụng là SE Asia Standard Time (UTC+7). Mọi định dạng ngày tháng trả về API sử dụng `CustomDateTimeConverter`.
* **Mã Lỗi & HTTP Status:** Sử dụng chính xác mã lỗi HTTP (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`).

---

## 4. Tiêu Chuẩn Lập Trình Frontend (Next.js 16 + React 19)

### App Router & Components
* **Server Components (RSC) vs Client Components:**
  * Mặc định mọi component là Server Component để tối ưu hóa SEO và tốc độ tải trang.
  * Chỉ dùng `"use client"` cho các component cần tương tác (sử dụng State, Effect, Event Listener hoặc Hook của client như `useRouter`, `usePathname`).
* **Phân tách Component:** Tách nhỏ các component dùng chung vào thư mục `components/ui/` hoặc `components/shared/`. Tránh viết các file page quá dài.

### TypeScript & Typing
* **Strict Mode:** Tuyệt đối không sử dụng kiểu `any`. Hãy tạo các interface hoặc type rõ ràng tại thư mục `types/` hoặc ngay trong file component.
* **Prop Types:** Luôn khai báo kiểu dữ liệu cho `Props` của component.

### Tailwind CSS v4 & Styling
* **Đồng bộ Design System:** Tuân thủ hệ màu sắc và font chữ được cấu hình trong dự án. Tránh sử dụng màu tùy tiện (ví dụ `bg-[#ff0000]`), hãy dùng các palette màu chuẩn của dự án.
* **Responsive Layout:** Thiết kế ưu tiên Mobile First (`md:`, `lg:`).
* **Hiệu ứng:** Sử dụng hiệu ứng hover, transition mượt mà để tăng trải nghiệm người dùng (UX Premium).

### Quản Lý Trạng Thái & Real-time
* **SignalR Connection:** Quản lý kết nối SignalR tập trung qua Context (ví dụ: `context/SignalRContext.tsx` nếu có) để tránh re-connect liên tục khi render lại.
* **Thông Báo:** Sử dụng thư viện `sonner` để hiển thị các toast notification (success, error, warning, info) thay vì `alert()` mặc định.

---

## 5. Quy Tắc Git & Quản Lý Mã Nguồn

### Quy định chung
* **Ngôn ngữ:** Tên chi nhánh (Branch names), Commit Messages và Merge Messages **bắt buộc viết bằng tiếng Anh**.
* **Nội dung:** Phải mô tả ngắn gọn, rõ ràng, đầy đủ thông tin về chức năng mới được thêm hoặc lỗi cụ thể đã được sửa (fix).
* **Định dạng chi nhánh (Branch naming):**
  * `feat/<feature-name>` hoặc `feature/<feature-name>` (Ví dụ: `feat/vnpay-integration`)
  * `fix/<bug-name>` (Ví dụ: `fix/voucher-display-bug`)
* **Định dạng Commit Messages (Conventional Commits):**
  * `feat: <description>` (Thêm tính năng mới)
  * `fix: <description>` (Sửa lỗi)
  * `refactor: <description>` (Tái cấu trúc code)
  * `docs: <description>` (Cập nhật tài liệu)
  * `style: <description>` (Thay đổi định dạng code, CSS)
  * Ví dụ: `feat: integrate VNPay payment API` hoặc `fix: resolve issue displaying category vouchers`

### Phân loại lệnh Git khi chạy trong Terminal của AI

#### 1. Lệnh Đọc (Được chạy ngay không cần hỏi)
AI được phép tự chạy các lệnh kiểm tra trạng thái và xem lịch sử sau mà không cần hỏi ý kiến:
* `git status`
* `git diff`
* `git log`
* `git branch`
* `git fetch`

#### 2. Lệnh thay đổi trạng thái (Bắt buộc hỏi ý kiến và nêu rõ ảnh hưởng)
Trước khi chạy bất kỳ lệnh nào sau đây, AI **bắt buộc** phải giải thích hành động và xin phê duyệt rõ ràng từ Developer:
* `git add`
* `git commit`
* `git push`
* `git pull`
* `git merge` (`sẽ luôn sử dụng git merge --no-ff`)
* `git rebase`
* `git checkout`
* `git switch`
* `git reset`
* `git reset --hard`
* `git clean`
* `git stash`
* `git revert`
* `git tag`
* `git cherry-pick`
* `git restore`
* `git rm`

**Mẫu câu hỏi phê duyệt bắt buộc:**
> **AI:** Tôi muốn chạy lệnh `[Tên lệnh Git]`.
> **Ảnh hưởng:**
> - [Liệt kê ảnh hưởng cụ thể của lệnh, ví dụ: "Commit hiện tại sẽ được đẩy lên remote branch" hoặc "Mọi file chưa commit sẽ bị xóa sạch khỏi thư mục làm việc"]
> - [Liệt kê tác động đến team khác, ví dụ: "Developer khác trong team có thể pull được code mới"]
> 
> Bạn có đồng ý thực hiện không?

#### 3. Các lệnh cực kỳ nguy hiểm (Không bao giờ chạy trừ khi được yêu cầu trực tiếp bằng từ ngữ rõ ràng)
Tuyệt đối không bao giờ đề xuất hoặc tự ý chạy các lệnh này trừ khi Developer yêu cầu đích danh và nhấn mạnh bằng văn bản:
* `git reset --hard` (Đặc biệt khi có thay đổi chưa lưu)
* `git clean -fd`
* `git clean -fdx`
* `git push --force`
* `git push --force-with-lease`
* `git rebase`
* `git filter-branch`
* `git reflog expire`
* `git gc --prune=now`


---

## 6. Check-list Kiểm Tra Trước Khi Hoàn Thành Nhiệm Vụ

Khi AI báo cáo đã hoàn thành một công việc, hãy kiểm tra danh sách sau:
- [ ] Code có biên dịch thành công hay không? (Chạy thử `dotnet build` cho backend và `npm run build` cho frontend).
- [ ] Code đã tuân thủ việc xử lý bất đồng bộ (`async`/`await`) chưa?
- [ ] Các API endpoints mới hoặc thay đổi đã được cập nhật Swagger XML Documentation chưa?
- [ ] Dữ liệu truyền nhận giữa Frontend và Backend đã dùng DTO chưa?
- [ ] Có file cấu hình bí mật nào vô tình bị commit không? (`git status`).
- [ ] UX/UI trên Frontend có responsive và mượt mà không?

---
*Chúc AI Assistant cùng Developer tạo nên một sản phẩm LazPe xuất sắc!*
