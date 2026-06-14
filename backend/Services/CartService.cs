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
        private readonly IRecommendationService _recommendationService;

        public CartService(ApplicationDbContext context, IVoucherService voucherService, IRecommendationService recommendationService)
        {
            _context = context;
            _voucherService = voucherService;
            _recommendationService = recommendationService;
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
                .Include(c => c.ShippingVoucher)
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
                .Include(c => c.ShippingVoucher)
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
                        existingDetail.UnitPrice = await GetEffectivePriceAsync(existingDetail.VariantID, existingDetail.BundleID);
                    }
                }
                else if (existingDetail.BundleID.HasValue)
                {
                    var targetQuantity = existingDetail.Quantity + quantity;
                    existingDetail.Quantity = targetQuantity;
                    existingDetail.UnitPrice = await GetEffectivePriceAsync(existingDetail.VariantID, existingDetail.BundleID);
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
                }
                else if (bundleId.HasValue)
                {
                    var bundle = await _context.Bundles.FindAsync(bundleId.Value);

                    if (bundle == null)
                    {
                        throw new ArgumentException("Combo không tồn tại");
                    }
                }

                newDetail.UnitPrice = await GetEffectivePriceAsync(variantId, bundleId);
                
                newDetail.TotalPrice = newDetail.UnitPrice * newDetail.Quantity;
                _context.CartDetails.Add(newDetail);
            }

            await _context.SaveChangesAsync();
            await CalculateCartTotalAsync(cart.CartID);

            // Log AI
            if (variantId.HasValue)
            {
                var variant = await _context.Variants.FindAsync(variantId.Value);
                if (variant != null)
                {
                    await _recommendationService.LogInteractionAsync(userId, variant.ProductID, PolyBabyAPI.Models.Mongo.InteractionType.Cart);
                }
            }
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

                    detail.UnitPrice = await GetEffectivePriceAsync(detail.VariantID, detail.BundleID);

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
                cart.ShippingVoucher = null;
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
            
            // Lưu voucher vào cart tương ứng loại
            if (voucher.VoucherType == VoucherType.ShippingDiscount)
            {
                // Tính tạm tính & giảm giá sản phẩm để xem đơn hàng đã được freeship tự động chưa
                decimal productDiscount = 0;
                if (cart.Voucher != null)
                {
                    var productVoucherValid = await _voucherService.ValidateVoucherAsync(cart.Voucher.Code, subTotal, cart.UserID);
                    if (productVoucherValid.IsValid)
                    {
                        productDiscount = _voucherService.CalculateDiscount(cart.Voucher, subTotal);
                    }
                }
                decimal netTotal = subTotal - productDiscount;
                if (netTotal < 0) netTotal = 0;

                cart.ShippingVoucher = voucher;
            }
            else
            {
                cart.Voucher = voucher;
            }
            
            await _context.SaveChangesAsync();
            await CalculateCartTotalAsync(cartId);

            return (true, "Áp dụng mã giảm giá thành công!");
        }

        public async Task RemoveVoucherAsync(int cartId, int? type = null)
        {
            var cart = await _context.Carts
                .Include(c => c.Voucher)
                .Include(c => c.ShippingVoucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);

            if (cart != null)
            {
                if (type == null || type == 1)
                {
                    cart.Voucher = null;
                }
                if (type == null || type == 2)
                {
                    cart.ShippingVoucher = null;
                }

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
                .Include(c => c.ShippingVoucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);

            if (cart == null) return;

            foreach (var detail in cart.CartDetails)
            {
                detail.UnitPrice = await GetEffectivePriceAsync(detail.VariantID, detail.BundleID);
                detail.TotalPrice = detail.UnitPrice * detail.Quantity;
            }

            decimal subTotal = cart.CartDetails.Sum(cd => cd.Quantity * cd.UnitPrice);
            decimal discount = 0;
            decimal shippingDiscount = 0;
            decimal tierDiscount = 0;

            // Tính toán Tier Discount
            var loyaltyProfile = await _context.LoyaltyProfiles
                .FirstOrDefaultAsync(lp => lp.UserID == cart.UserID);

            if (loyaltyProfile != null)
            {
                var discountPrivilege = await _context.LoyaltyTierPrivileges
                    .Where(p => p.TierID == loyaltyProfile.CurrentTierID && p.PrivilegeType == "DISCOUNT" && p.IsActive)
                    .FirstOrDefaultAsync();

                if (discountPrivilege != null && decimal.TryParse(discountPrivilege.Value, out decimal discountPercent))
                {
                    tierDiscount = subTotal * (discountPercent / 100);
                    // Mức trần thao túng tối đa 10%
                    decimal maxAllowedDiscount = subTotal * 0.10m;
                    if (tierDiscount > maxAllowedDiscount)
                    {
                        tierDiscount = maxAllowedDiscount;
                    }
                }
            }

            decimal netTotalBeforeVoucher = subTotal - tierDiscount;
            if (netTotalBeforeVoucher < 0) netTotalBeforeVoucher = 0;

            if (cart.Voucher != null)
            {
                // Validate voucher: Vẫn check min order dựa trên subTotal (hoặc netTotal)
                var validCheck = await _voucherService.ValidateVoucherAsync(cart.Voucher.Code, subTotal, cart.UserID);
                if (validCheck.IsValid)
                {
                    discount = _voucherService.CalculateDiscount(cart.Voucher, subTotal);
                    // Discount không được vượt quá netTotalBeforeVoucher
                    if (discount > netTotalBeforeVoucher)
                    {
                        discount = netTotalBeforeVoucher;
                    }
                }
                else
                {
                    // Nếu không còn valid, thì remove voucher
                    cart.Voucher = null;
                }
            }

            // Tính toán Shipping Discount
            if (cart.ShippingVoucher != null)
            {
                var validCheck = await _voucherService.ValidateVoucherAsync(cart.ShippingVoucher.Code, subTotal, cart.UserID);
                if (validCheck.IsValid)
                {
                    // Tính phí ship tạm thời dựa trên tổng tiền sau giảm giá sản phẩm
                    decimal netTotal = subTotal - tierDiscount - discount;
                    if (netTotal < 0) netTotal = 0;

                    decimal originalShippingFee = 25000;
                    
                    shippingDiscount = _voucherService.CalculateShippingDiscount(cart.ShippingVoucher, originalShippingFee);
                }
                else
                {
                    cart.ShippingVoucher = null;
                }
            }

            cart.SubTotal = subTotal;
            cart.TierDiscountAmount = tierDiscount;
            cart.DiscountAmount = discount;
            cart.ShippingDiscountAmount = shippingDiscount;
            cart.TotalAmount = subTotal - tierDiscount - discount;
            if (cart.TotalAmount < 0) cart.TotalAmount = 0;

            await _context.SaveChangesAsync();
        }

        private async Task<decimal> GetEffectivePriceAsync(int? variantId, int? bundleId)
        {
            var now = DateTime.Now;

            if (bundleId.HasValue)
            {
                var flashSaleItem = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.IsActive 
                        && fsi.FlashSale.StartTime <= now 
                        && fsi.FlashSale.EndTime >= now
                        && fsi.ItemType == FlashSaleItemType.Bundle 
                        && fsi.ReferenceId == bundleId.Value
                        && fsi.SoldQuantity < fsi.TotalQuantity)
                    .FirstOrDefaultAsync();

                if (flashSaleItem != null)
                {
                    return flashSaleItem.DiscountPrice;
                }

                var bundle = await _context.Bundles.FindAsync(bundleId.Value);
                return bundle?.Price ?? 0;
            }

            if (variantId.HasValue)
            {
                var variant = await _context.Variants
                    .Include(v => v.Product)
                    .FirstOrDefaultAsync(v => v.VariantID == variantId.Value);
                
                if (variant == null) return 0;

                var fsVariant = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.IsActive 
                        && fsi.FlashSale.StartTime <= now 
                        && fsi.FlashSale.EndTime >= now
                        && fsi.ItemType == FlashSaleItemType.Variant 
                        && fsi.ReferenceId == variantId.Value
                        && fsi.SoldQuantity < fsi.TotalQuantity)
                    .FirstOrDefaultAsync();

                if (fsVariant != null)
                {
                    return fsVariant.DiscountPrice;
                }

                var fsProduct = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.IsActive 
                        && fsi.FlashSale.StartTime <= now 
                        && fsi.FlashSale.EndTime >= now
                        && fsi.ItemType == FlashSaleItemType.Product 
                        && fsi.ReferenceId == variant.ProductID
                        && fsi.SoldQuantity < fsi.TotalQuantity)
                    .FirstOrDefaultAsync();

                if (fsProduct != null)
                {
                    return fsProduct.DiscountPrice;
                }

                return CalculateEffectiveVariantPrice(variant);
            }

            return 0;
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
