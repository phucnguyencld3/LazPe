# Kế hoạch triển khai: Thanh toán nhiều nguồn và hoàn tiền

## 1. Mục tiêu

Cho phép user thanh toán một đơn hàng bằng nhiều nguồn:

- Voucher sản phẩm
- Voucher freeship
- Điểm Loyalty
- Xu LazPe
- Ví hệ thống
- VNPay cho phần tiền còn lại

Khi hủy đơn, hệ thống phải hoàn lại đúng nguồn đã dùng và không được hoàn tiền lặp.

## 2. Nguyên tắc bắt buộc

- Backend là nơi tính tiền cuối cùng, không tin số tiền frontend gửi lên.
- Frontend chỉ gửi mong muốn dùng điểm/xu/ví.
- Mọi thao tác cộng/trừ ví, xu, điểm phải có lịch sử giao dịch.
- Checkout, trừ tiền, trừ kho, hoàn tiền phải chạy trong database transaction.
- Hoàn tiền phải chống chạy lặp bằng `IdempotencyKey`.
- User chỉ được thao tác với cart, address, invoice của chính mình.
- Admin/Employee mới được xem tất cả đơn, duyệt hủy, duyệt hoàn.

## 3. Bảo mật cần làm trước

Bật lại `[Authorize]` cho các API đơn hàng:

- Tạo đơn từ giỏ hàng
- Xem đơn của tôi
- Xem chi tiết đơn
- Hủy đơn
- Thanh toán lại VNPay
- Admin xem danh sách đơn
- Admin cập nhật trạng thái
- Admin duyệt/từ chối hủy
- Admin duyệt hoàn hàng

Kiểm tra quyền sở hữu:

```text
Cart.UserID == currentUser.Id
CartDetail.CartID == cartId
Address.UserID == currentUser.Id
Invoice.UserID == currentUser.Id
```

## 4. Database cần bổ sung

### ApplicationUser

```csharp
[Column(TypeName = "decimal(18,2)")]
public decimal CoinsBalance { get; set; } = 0;
```

### Invoice

Thêm các field tách tiền:

```csharp
public decimal VoucherDiscountAmount { get; set; } = 0;
public decimal PointsDiscountAmount { get; set; } = 0;
public decimal CoinsDiscountAmount { get; set; } = 0;
public decimal WalletDiscountAmount { get; set; } = 0;
public decimal AmountToPay { get; set; } = 0;
public RefundMethod? CancelRefundMethod { get; set; }
public bool IsRefunded { get; set; } = false;
public DateTime? RefundedAt { get; set; }
```

Giữ `ShippingDiscountAmount` cho voucher freeship.

### OrderStatus

Thêm:

```csharp
CancelledRefunded = 8
```

Ý nghĩa: đơn đã hủy và đã hoàn tiền xong.

### BalanceTransaction

Thêm bảng lịch sử cộng/trừ ví, xu, điểm.

Field chính:

```text
Id
UserID
InvoiceID
SourceType: Wallet / Coins / LoyaltyPoints / VnPayRefund
Direction: Debit / Credit
Amount
Reason
IdempotencyKey
CreatedAt
CreatedBy
Note
```

Tạo unique index cho `IdempotencyKey`.

Ví dụ:

```text
checkout-wallet-1001
checkout-coins-1001
cancel-refund-wallet-1001
cancel-refund-vnpay-1001
```

### PaymentTransaction

Thêm:

```csharp
public decimal Amount { get; set; }
public string Provider { get; set; } = "VNPay";
public DateTime? CompletedAt { get; set; }
public DateTime? FailedAt { get; set; }
public string? FailureReason { get; set; }
```

VNPay chỉ thu `AmountToPay`, không thu tổng đơn gốc.

## 5. API request

### Checkout

```http
POST /api/invoice/create-from-cart/{cartId}
```

```json
{
  "selectedCartDetailIds": [1, 2, 3],
  "usePoints": true,
  "pointsToUse": 100,
  "useCoins": true,
  "coinsToUse": 50000,
  "useWallet": true,
  "walletToUse": 100000
}
```

Backend tự giới hạn số điểm/xu/ví được dùng theo số dư thật và tổng tiền còn lại.

### Hủy đơn

```http
POST /api/invoice/{id}/request-cancel
```

```json
{
  "reason": "Tôi muốn hủy đơn",
  "cancelRefundMethod": "SystemWallet"
}
```

`cancelRefundMethod` chỉ áp dụng cho phần tiền đã thanh toán qua VNPay.

## 6. Logic tính tiền checkout

Thứ tự tính:

```text
SubTotal
- VoucherDiscountAmount
- TierDiscountAmount
- PointsDiscountAmount
- CoinsDiscountAmount
- WalletDiscountAmount
= ProductNet

ProductNet + ShippingFee - ShippingDiscountAmount
= AmountToPay
```

Luôn đảm bảo:

```text
ProductNet >= 0
AmountToPay >= 0
ShippingDiscountAmount <= ShippingFee
```

Nếu `AmountToPay = 0`:

- Không tạo URL VNPay
- Không tạo giao dịch VNPay pending
- Đơn được xem là đã thanh toán đủ bằng nguồn nội bộ

Nếu `AmountToPay > 0` và user chọn VNPay:

- Tạo `PaymentTransaction`
- Lưu `PaymentTransaction.Amount = AmountToPay`
- Trả về payment URL

## 7. Logic tạo đơn

Toàn bộ chạy trong transaction:

1. Lấy user hiện tại.
2. Lấy cart theo `cartId` và `user.Id`.
3. Kiểm tra selected cart detail thuộc cart.
4. Kiểm tra địa chỉ thuộc user.
5. Kiểm tra tồn kho.
6. Tính lại toàn bộ tiền từ database.
7. Tạo invoice và invoice detail.
8. Lưu từng khoản giảm vào invoice.
9. Trừ kho.
10. Trừ điểm/xu/ví nếu có dùng.
11. Ghi `BalanceTransaction`.
12. Đánh dấu voucher đã dùng.
13. Tạo VNPay transaction nếu cần.
14. Xóa cart detail đã checkout.
15. Commit transaction.

Nếu lỗi ở bất kỳ bước nào thì rollback.

## 8. Logic hủy và hoàn tiền

### Đơn Pending

User hủy thì xử lý ngay:

1. Kiểm tra invoice thuộc user.
2. Hoàn kho.
3. Hoàn voucher.
4. Hoàn điểm đã dùng.
5. Hoàn xu đã dùng.
6. Hoàn ví đã dùng.
7. Nếu có VNPay thành công, hoàn phần VNPay vào ví hoặc xu.
8. Đánh dấu pending VNPay là failed nếu chưa thanh toán.
9. Set `IsRefunded = true`.
10. Set `RefundedAt = now`.
11. Set status `CancelledRefunded`.

### Đơn Confirmed

User gửi yêu cầu hủy:

1. Set status `CancelRequested`.
2. Lưu lý do hủy.
3. Lưu `CancelRefundMethod`.
4. Nếu cần undo, tạo Hangfire job chạy sau 1 phút.
5. Job chỉ xử lý nếu đơn vẫn là `CancelRequested`.
6. Khi xử lý, hoàn tiền giống đơn `Pending`.

### Đơn Shipped / Completed

- `Shipped`: không cho hủy thường.
- `Completed`: dùng flow trả hàng/hoàn hàng, không dùng flow hủy.

## 9. Quy tắc hoàn tiền

| Khoản đã dùng | Hoàn về |
| --- | --- |
| Điểm Loyalty | Điểm Loyalty |
| Xu LazPe | `CoinsBalance` |
| Ví hệ thống | `WalletBalance` |
| VNPay | Ví hoặc xu theo `CancelRefundMethod` |
| Voucher sản phẩm | Không hoàn thành tiền |
| Voucher freeship | Không hoàn thành tiền |

## 10. Chống hoàn tiền lặp

Trước khi hoàn tiền kiểm tra:

```text
Invoice.IsRefunded == false
Invoice.RefundedAt == null
Chưa có BalanceTransaction cùng IdempotencyKey
```

Sau khi hoàn:

```text
Invoice.IsRefunded = true
Invoice.RefundedAt = now
Invoice.Status = CancelledRefunded
```

Không được để các thao tác sau chạy lặp:

- Cộng ví
- Cộng xu
- Hoàn điểm
- Hoàn kho
- Hoàn voucher

## 11. VNPay

Khi tạo payment URL:

```text
VNPay amount = Invoice.AmountToPay
```

Khi VNPay callback:

1. Tìm `PaymentTransaction`.
2. Kiểm tra transaction đang pending.
3. Kiểm tra invoice chưa bị hủy.
4. Kiểm tra số tiền callback khớp `PaymentTransaction.Amount`.
5. Nếu đúng, set transaction thành success.
6. Nếu callback về sau khi đơn đã hủy, không xác nhận đơn và ghi log.

## 12. Frontend cần cập nhật

Trang checkout:

- Hiển thị điểm, xu, ví hiện có.
- Cho user bật/tắt dùng điểm, xu, ví.
- Cho nhập số điểm/xu/ví muốn dùng.
- Hiển thị breakdown:

```text
Tạm tính
- Voucher sản phẩm
- Điểm
- Xu
- Ví
+ Phí ship
- Freeship
= Cần thanh toán
```

Popup hủy đơn:

- Nhập lý do hủy.
- Nếu đơn có VNPay đã thanh toán, cho chọn hoàn vào ví hoặc xu.

## 13. Thứ tự triển khai

1. Bật bảo mật API và kiểm tra quyền sở hữu dữ liệu.
2. Thêm migration cho `CoinsBalance`, invoice breakdown, refund fields.
3. Thêm bảng `BalanceTransaction`.
4. Thêm `Amount` cho `PaymentTransaction`.
5. Refactor logic tính tiền checkout.
6. Cập nhật `CreateFromCartAsync`.
7. Cập nhật VNPay dùng `AmountToPay`.
8. Viết helper hoàn tiền có idempotency.
9. Cập nhật logic hủy đơn.
10. Cập nhật frontend checkout và popup hủy.
11. Test các case tài chính quan trọng.

## 14. Test bắt buộc

- Checkout dùng voucher, điểm, xu, ví và VNPay cùng lúc.
- Checkout làm `AmountToPay = 0`.
- User dùng xu/ví/điểm vượt số dư phải bị giới hạn.
- User checkout cart của người khác phải bị chặn.
- User dùng address của người khác phải bị chặn.
- Hủy đơn hoàn đúng điểm/xu/ví.
- Hủy đơn VNPay hoàn vào ví.
- Hủy đơn VNPay hoàn vào xu.
- Hangfire chạy lại không hoàn tiền lần hai.
- Admin duyệt hủy hai lần không hoàn tiền lần hai.
- VNPay callback sai tiền hoặc callback sau khi hủy phải bị xử lý an toàn.

## 15. Kết luận

Không nên code migration trước khi siết bảo mật và kiểm tra quyền sở hữu dữ liệu.

Thứ tự an toàn:

```text
Bảo mật API
-> Ownership validation
-> Schema tài chính
-> Ledger
-> Checkout
-> Refund
-> Frontend
-> Test
```
