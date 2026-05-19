using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class CartService : ICartService
    {
        private readonly ApplicationDbContext _context;
        private readonly IVoucherService _voucherService;

        public CartService(ApplicationDbContext context, IVoucherService voucherService)
        {
            _context = context;
            _voucherService = voucherService;
        }

        public async Task<Cart> GetCartByUserIdAsync(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                        .ThenInclude(v => v.Product)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                        .ThenInclude(v => v.VariantOptionValues) // ✅ THÊM: Include VariantOptionValues
                            .ThenInclude(vov => vov.ProductOptionValue)
                                .ThenInclude(pov => pov.ProductOption)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Bundle)
                .Include(c => c.Voucher)
                .FirstOrDefaultAsync(c => c.UserID == userId && c.Status == true);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserID = userId,
                    CreatedDate = DateTime.Now,
                    Status = true,
                    TotalAmount = 0
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            // Recalculate anytime we get cart to ensure consistency
            await CalculateCartTotalAsync(cart.CartID);

            return cart;
        }



        public async Task<Cart> GetCartByIdAsync(int cartId)
        {
            return await _context.Carts
                .Include(c => c.CartDetails)
                .Include(c => c.Voucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);
        }

        public async Task AddToCartAsync(string userId, int? variantId, int? bundleId, int quantity)
        {
            if (quantity <= 0)
            {
                throw new ArgumentException("Số lượng phải lớn hơn 0");
            }

            var cart = await GetCartByUserIdAsync(userId);
            
            CartDetail existingDetail = null;

            if (variantId.HasValue)
            {
                existingDetail = cart.CartDetails.FirstOrDefault(cd => cd.VariantID == variantId.Value);
            }
            else if (bundleId.HasValue)
            {
                existingDetail = cart.CartDetails.FirstOrDefault(cd => cd.BundleID == bundleId.Value);
            }

            if (existingDetail != null)
            {
                if (existingDetail.VariantID.HasValue)
                {
                    var currentQuantityInCart = existingDetail.Quantity;
                    var variant = await _context.Variants
                        .AsNoTracking()
                        .Include(v => v.Product)
                        .FirstOrDefaultAsync(v => v.VariantID == existingDetail.VariantID.Value);

                    if (variant != null)
                    {
                        var targetQuantity = currentQuantityInCart + quantity;
                        if (targetQuantity > variant.Stock)
                        {
                            var maxCanAdd = Math.Max(variant.Stock - currentQuantityInCart, 0);
                            if (maxCanAdd == 0)
                            {
                                throw new ArgumentException($"Bạn đã có {currentQuantityInCart} trong giỏ. Sản phẩm đã đạt giới hạn tồn kho ({variant.Stock}).");
                            }

                            throw new ArgumentException($"Bạn đã có {currentQuantityInCart} trong giỏ. Tồn kho tối đa là {variant.Stock}, bạn chỉ có thể thêm tối đa {maxCanAdd} sản phẩm nữa.");
                        }

                        existingDetail.Quantity = targetQuantity;
                        existingDetail.UnitPrice = CalculateEffectiveVariantPrice(variant);
                    }
                }
                else if (existingDetail.BundleID.HasValue)
                {
                    var bundle = await _context.Bundles
                        .AsNoTracking()
                        .FirstOrDefaultAsync(b => b.BundleID == existingDetail.BundleID.Value);

                    if (bundle != null)
                    {
                        var targetQuantity = existingDetail.Quantity + quantity;
                        existingDetail.Quantity = targetQuantity;
                        existingDetail.UnitPrice = bundle.Price ?? 0;
                    }
                }

                existingDetail.TotalPrice = existingDetail.UnitPrice * existingDetail.Quantity;
            }
            else
            {
                var newDetail = new CartDetail
                {
                    CartID = cart.CartID,
                    VariantID = variantId,
                    BundleID = bundleId,
                    Quantity = quantity
                };

                // Lấy giá
                if (variantId.HasValue)
                {
                    var variant = await _context.Variants
                        .AsNoTracking()
                        .Include(v => v.Product)
                        .FirstOrDefaultAsync(v => v.VariantID == variantId.Value);

                    if (variant == null)
                    {
                        throw new ArgumentException("Biến thể không tồn tại");
                    }

                    if (quantity > variant.Stock)
                    {
                        throw new ArgumentException($"Số lượng yêu cầu vượt tồn kho. Hiện chỉ còn {variant.Stock} sản phẩm.");
                    }

                    newDetail.UnitPrice = variant != null ? CalculateEffectiveVariantPrice(variant) : 0;
                }
                else if (bundleId.HasValue)
                {
                    var bundle = await _context.Bundles.FindAsync(bundleId.Value);

                    if (bundle == null)
                    {
                        throw new ArgumentException("Combo không tồn tại");
                    }

                    newDetail.UnitPrice = bundle?.Price ?? 0;
                }
                
                newDetail.TotalPrice = newDetail.UnitPrice * newDetail.Quantity;
                _context.CartDetails.Add(newDetail);
            }

            await _context.SaveChangesAsync();
            await CalculateCartTotalAsync(cart.CartID);
        }

        public async Task RemoveFromCartAsync(int cartDetailId)
        {
            var detail = await _context.CartDetails.FindAsync(cartDetailId);
            if (detail != null)
            {
                _context.CartDetails.Remove(detail);
                await _context.SaveChangesAsync();
                await CalculateCartTotalAsync(detail.CartID);
            }
        }

        public async Task UpdateQuantityAsync(int cartDetailId, int quantity)
        {
            var detail = await _context.CartDetails
                .Include(cd => cd.Variant)
                    .ThenInclude(v => v.Product)
                .Include(cd => cd.Bundle)
                .FirstOrDefaultAsync(cd => cd.CartDetailID == cartDetailId);
            if (detail != null)
            {
                if (quantity <= 0)
                {
                    _context.CartDetails.Remove(detail);
                }
                else
                {
                    var currentQuantityInCart = detail.Quantity;
                    if (detail.Variant != null && quantity > detail.Variant.Stock)
                    {
                        throw new ArgumentException($"Bạn đang có {currentQuantityInCart} trong giỏ. Tồn kho tối đa cho sản phẩm này là {detail.Variant.Stock}.");
                    }

                    detail.Quantity = quantity;

                    if (detail.Variant != null)
                    {
                        detail.UnitPrice = CalculateEffectiveVariantPrice(detail.Variant);
                    }
                    else if (detail.Bundle != null)
                    {
                        detail.UnitPrice = detail.Bundle.Price ?? 0;
                    }

                    detail.TotalPrice = detail.UnitPrice * quantity;
                }
                await _context.SaveChangesAsync();
                await CalculateCartTotalAsync(detail.CartID);
            }
        }

        public async Task ClearCartAsync(int cartId)
        {
            var details = _context.CartDetails.Where(cd => cd.CartID == cartId);
            _context.CartDetails.RemoveRange(details);
            
            var cart = await _context.Carts.FindAsync(cartId);
            if (cart != null)
            {
                cart.Voucher = null; // Clear voucher too
            }

            await _context.SaveChangesAsync();
            await CalculateCartTotalAsync(cartId);
        }

        public async Task<(bool Success, string Message)> ApplyVoucherAsync(int cartId, string voucherCode)
        {
            var cart = await GetCartByIdAsync(cartId);
            if (cart == null) return (false, "Giỏ hàng không tồn tại");

            voucherCode = voucherCode?.Trim().ToUpper() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(voucherCode))
            {
                return (false, "Vui lòng nhập mã voucher");
            }

            // Tính tạm tính trước khi giảm giá
            decimal subTotal = cart.CartDetails.Sum(cd => cd.Quantity * cd.UnitPrice);

            // Validate voucher
            var validation = await _voucherService.ValidateVoucherAsync(voucherCode, subTotal, cart.UserID);
            if (!validation.IsValid)
            {
                return (false, validation.Message);
            }

            var voucher = await _voucherService.GetVoucherByCodeAsync(voucherCode);
            if (voucher == null)
            {
                return (false, "Mã giảm giá không tồn tại");
            }

            var walletVoucher = await _context.UserVouchers
                .Include(uv => uv.Voucher)
                .Where(uv => uv.UserID == cart.UserID
                    && uv.VoucherID == voucher.VoucherID
                    && uv.Status == UserVoucherStatus.Unused)
                .FirstOrDefaultAsync();

            if (walletVoucher == null)
            {
                return (false, "Voucher chưa có trong ví của bạn.");
            }
            
            // Lưu voucher vào cart
            cart.Voucher = voucher;
            
            await _context.SaveChangesAsync();
            await CalculateCartTotalAsync(cartId);

            return (true, "Áp dụng mã giảm giá thành công!");
        }

        public async Task RemoveVoucherAsync(int cartId)
        {
            var cart = await _context.Carts.Include(c => c.Voucher).FirstOrDefaultAsync(c => c.CartID == cartId);
            if (cart != null)
            {
                // Để gỡ relation, ta cần set null.
                // Nếu model Cart không có VoucherID (FK explicit) mà chỉ có navigation prop
                // thì ta cần load nó vào context.
                
                // Hack: Nếu EF Core dùng Shadow Property cho FK VoucherID
                // Cách an toàn là dùng .Reference().CurrentValue = null hoặc set navigation = null.
                cart.Voucher = null; 
                
                await _context.SaveChangesAsync();
                await CalculateCartTotalAsync(cartId);
            }
        }

        public async Task CalculateCartTotalAsync(int cartId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                        .ThenInclude(v => v.Product)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Bundle)
                .Include(c => c.Voucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);

            if (cart == null) return;

            foreach (var detail in cart.CartDetails)
            {
                if (detail.Variant != null)
                {
                    detail.UnitPrice = CalculateEffectiveVariantPrice(detail.Variant);
                }
                else if (detail.Bundle != null)
                {
                    detail.UnitPrice = detail.Bundle.Price ?? 0;
                }

                detail.TotalPrice = detail.UnitPrice * detail.Quantity;
            }

            decimal subTotal = cart.CartDetails.Sum(cd => cd.Quantity * cd.UnitPrice);
            decimal discount = 0;

            if (cart.Voucher != null)
            {
                // Re-validate to make sure it's still valid
                var validCheck = await _voucherService.ValidateVoucherAsync(cart.Voucher.Code, subTotal, cart.UserID);
                if (validCheck.IsValid)
                {
                    discount = _voucherService.CalculateDiscount(cart.Voucher, subTotal);
                }
                else
                {
                    // Nếu không còn valid (vd tổng tiền giảm xuống dưới mức tối thiểu), thì remove voucher
                    cart.Voucher = null;
                }
            }

            // Cart TotalAmount stores the final amount to pay? Or just subtotal? 
            // Usually TotalAmount in Cart model implies the final value.
            // Let's assume TotalAmount = SubTotal - Discount
            
            cart.TotalAmount = subTotal - discount;
            if (cart.TotalAmount < 0) cart.TotalAmount = 0;

            await _context.SaveChangesAsync();
        }

        private static decimal CalculateEffectiveVariantPrice(Variant variant)
        {
            var productDiscount = variant.Product?.ProductDiscountPercent ?? 0;
            var effectiveDiscount = variant.VariantDiscountPercent > 0
                ? variant.VariantDiscountPercent
                : productDiscount;

            if (effectiveDiscount <= 0) return variant.UnitPrice;

            var finalPrice = variant.UnitPrice * (1 - (effectiveDiscount / 100m));
            return finalPrice < 0 ? 0 : finalPrice;
        }
    }
}
