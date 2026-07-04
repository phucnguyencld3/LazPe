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
            var cartId = await _context.Carts
                .Where(c => c.UserID == userId && c.Status == true)
                .Select(c => c.CartID)
                .FirstOrDefaultAsync();

            if (cartId == 0)
            {
                var newCart = new Cart
                {
                    UserID = userId,
                    CreatedDate = DateTime.Now,
                    Status = true,
                    TotalAmount = 0
                };
                _context.Carts.Add(newCart);
                await _context.SaveChangesAsync();
                cartId = newCart.CartID;
            }

            // Gọi CalculateCartTotalAsync để tự động lấy lại giá mới nhất (GetEffectivePriceAsync) cho tất cả sản phẩm
            await CalculateCartTotalAsync(cartId);

            // Fetch lại giỏ hàng một lần nữa để đảm bảo DTO trả về chứa giá đã cập nhật và thông tin quà tặng mới nhất
            return await _context.Carts
                .AsSplitQuery()
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.Images)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.Variants)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                        .ThenInclude(v => v.VariantOptionValues)
                            .ThenInclude(vov => vov.ProductOptionValue)
                                .ThenInclude(pov => pov.ProductOption)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Bundle)
                .Include(c => c.Voucher)
                .Include(c => c.ShippingVoucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);
        }
        
        public async Task<Cart> GetCartByIdAsync(int cartId)
        {
            return await _context.Carts
                .Include(c => c.CartDetails)
                .Include(c => c.Voucher)
                .Include(c => c.ShippingVoucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);
        }

        public async Task AddToCartAsync(string userId, int? variantId, int? bundleId, int quantity, int? selectedGiftVariantId = null)
        {
            if (quantity <= 0) throw new ArgumentException("Số lượng phải lớn hơn 0");

            var cartId = await _context.Carts
                .Where(c => c.UserID == userId && c.Status == true)
                .Select(c => c.CartID)
                .FirstOrDefaultAsync();

            if (cartId == 0)
            {
                var newCart = new Cart
                {
                    UserID = userId,
                    CreatedDate = DateTime.Now,
                    Status = true,
                    TotalAmount = 0
                };
                _context.Carts.Add(newCart);
                await _context.SaveChangesAsync();
                cartId = newCart.CartID;
            }

            var now = DateTime.Now;
            int? flashSaleMaxQty = null;
            string flashSaleGiftVariantIds = null;
            int? fsItemId = null;

            if (variantId.HasValue || bundleId.HasValue)
            {
                var activeCampaigns = await _context.FlashSales
                    .Where(f => (int)f.Status == 1 && f.StartTime <= now && f.EndTime >= now)
                    .Select(f => f.Id)
                    .ToListAsync();

                if (activeCampaigns.Any())
                {
                    int productId = 0;
                    if (variantId.HasValue)
                    {
                        productId = await _context.Variants.Where(v => v.VariantID == variantId.Value).Select(v => v.ProductID).FirstOrDefaultAsync();
                    }

                    var fsItem = await _context.FlashSaleItems
                        .Where(fsi => activeCampaigns.Contains(fsi.FlashSaleId) &&
                            ((fsi.ItemType == FlashSaleItemType.Variant && fsi.ReferenceId == variantId) ||
                             (fsi.ItemType == FlashSaleItemType.Bundle && fsi.ReferenceId == bundleId) ||
                             (fsi.ItemType == FlashSaleItemType.Product && productId > 0 && fsi.ReferenceId == productId)))
                        .FirstOrDefaultAsync();

                    if (fsItem != null)
                    {
                        fsItemId = fsItem.Id;
                        if (fsItem.MaxQuantityPerUser > 0)
                        {
                            flashSaleMaxQty = fsItem.MaxQuantityPerUser;
                        }
                        flashSaleGiftVariantIds = fsItem.GiftVariantIds;
                    }
                }
            }

            var existingDetail = await _context.CartDetails
                .FirstOrDefaultAsync(cd => cd.CartID == cartId && cd.IsGift == false &&
                    ((variantId.HasValue && cd.VariantID == variantId.Value) || (bundleId.HasValue && cd.BundleID == bundleId.Value)));

            if (existingDetail != null)
            {
                if (existingDetail.VariantID.HasValue)
                {
                    var currentQuantityInCart = existingDetail.Quantity;
                    var stock = await _context.Variants
                        .Where(v => v.VariantID == existingDetail.VariantID.Value)
                        .Select(v => v.Stock)
                        .FirstOrDefaultAsync();

                    var targetQuantity = currentQuantityInCart + quantity;
                    if (targetQuantity > stock)
                    {
                        var maxCanAdd = Math.Max(stock - currentQuantityInCart, 0);
                        if (maxCanAdd == 0) throw new ArgumentException($"Bạn đã có {currentQuantityInCart} trong giỏ. Sản phẩm đã đạt giới hạn tồn kho ({stock}).");
                        throw new ArgumentException($"Bạn đã có {currentQuantityInCart} trong giỏ. Tồn kho tối đa là {stock}, bạn chỉ có thể thêm tối đa {maxCanAdd} sản phẩm nữa.");
                    }

                    existingDetail.Quantity = targetQuantity;
                    existingDetail.UnitPrice = await GetEffectivePriceAsync(userId, existingDetail.VariantID, existingDetail.BundleID, targetQuantity);
                }
                else if (existingDetail.BundleID.HasValue)
                {
                    var targetQuantity = existingDetail.Quantity + quantity;
                    existingDetail.Quantity = targetQuantity;
                    existingDetail.UnitPrice = await GetEffectivePriceAsync(userId, existingDetail.VariantID, existingDetail.BundleID, existingDetail.Quantity);
                }

                existingDetail.TotalPrice = existingDetail.UnitPrice * existingDetail.Quantity;
            }
            else
            {
                var newDetail = new CartDetail
                {
                    CartID = cartId,
                    VariantID = variantId,
                    BundleID = bundleId,
                    Quantity = quantity,
                    IsGift = false
                };

                if (variantId.HasValue)
                {
                    var stock = await _context.Variants
                        .Where(v => v.VariantID == variantId.Value)
                        .Select(v => v.Stock)
                        .FirstOrDefaultAsync();

                    if (newDetail.Quantity > stock) throw new ArgumentException($"Số lượng yêu cầu vượt tồn kho. Hiện chỉ còn {stock} sản phẩm.");
                }
                else if (bundleId.HasValue)
                {
                    bool exists = await _context.Bundles.AnyAsync(b => b.BundleID == bundleId.Value);
                    if (!exists) throw new ArgumentException("Combo không tồn tại");
                }

                newDetail.UnitPrice = await GetEffectivePriceAsync(userId, variantId, bundleId, newDetail.Quantity);
                newDetail.TotalPrice = newDetail.UnitPrice * newDetail.Quantity;
                _context.CartDetails.Add(newDetail);
            }

            await _context.SaveChangesAsync();

            if (selectedGiftVariantId.HasValue)
            {
                if (!string.IsNullOrEmpty(flashSaleGiftVariantIds))
                {
                    var availableGifts = flashSaleGiftVariantIds.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList();
                    var oldGifts = await _context.CartDetails
                        .Where(cd => cd.CartID == cartId && cd.IsGift && cd.VariantID.HasValue && availableGifts.Contains(cd.VariantID.Value))
                        .ToListAsync();

                    if (oldGifts.Any())
                    {
                        _context.CartDetails.RemoveRange(oldGifts);
                        await _context.SaveChangesAsync();
                    }
                }

                var existingGiftDummy = await _context.CartDetails.FirstOrDefaultAsync(cd => cd.CartID == cartId && cd.VariantID == selectedGiftVariantId.Value && cd.IsGift);
                if (existingGiftDummy == null)
                {
                    _context.CartDetails.Add(new CartDetail
                    {
                        CartID = cartId,
                        VariantID = selectedGiftVariantId.Value,
                        Quantity = 0,
                        UnitPrice = 0,
                        TotalPrice = 0,
                        IsGift = true
                    });
                    await _context.SaveChangesAsync();
                }
            }

            await CalculateCartTotalAsync(cartId);

            if (variantId.HasValue)
            {
                var productId = await _context.Variants.Where(v => v.VariantID == variantId.Value).Select(v => v.ProductID).FirstOrDefaultAsync();
                if (productId > 0)
                {
                    await _recommendationService.LogInteractionAsync(userId, productId, PolyBabyAPI.Models.Mongo.InteractionType.Cart);
                }
            }
        }

        public async Task RemoveFromCartAsync(int cartDetailId)
        {
            var cartId = await _context.CartDetails
                .Where(cd => cd.CartDetailID == cartDetailId)
                .Select(cd => cd.CartID)
                .FirstOrDefaultAsync();

            if (cartId > 0)
            {
                await _context.CartDetails.Where(cd => cd.CartDetailID == cartDetailId).ExecuteDeleteAsync();
                await CalculateCartTotalAsync(cartId);
            }
        }

        public async Task UpdateQuantityAsync(int cartDetailId, int quantity)
        {
            var detail = await _context.CartDetails.FirstOrDefaultAsync(cd => cd.CartDetailID == cartDetailId);
            if (detail != null)
            {
                if (quantity <= 0)
                {
                    await _context.CartDetails.Where(cd => cd.CartDetailID == cartDetailId).ExecuteDeleteAsync();
                }
                else
                {
                    var now = DateTime.Now;

                    if (detail.VariantID.HasValue)
                    {
                        var stock = await _context.Variants.Where(v => v.VariantID == detail.VariantID.Value).Select(v => v.Stock).FirstOrDefaultAsync();
                        if (quantity > stock)
                        {
                            throw new ArgumentException($"Tồn kho tối đa cho sản phẩm này là {stock}.");
                        }
                    }

                    var cart = await _context.Carts.FindAsync(detail.CartID);
                    if (cart != null)
                    {
                        detail.Quantity = quantity;
                        detail.UnitPrice = await GetEffectivePriceAsync(cart.UserID, detail.VariantID, detail.BundleID, quantity);
                        detail.TotalPrice = detail.UnitPrice * quantity;
                        await _context.SaveChangesAsync();
                    }
                }
                await CalculateCartTotalAsync(detail.CartID);
            }
        }

        public async Task ClearCartAsync(int cartId)
        {
            await _context.CartDetails.Where(cd => cd.CartID == cartId).ExecuteDeleteAsync();
            
            var cart = await _context.Carts.FindAsync(cartId);
            if (cart != null)
            {
                cart.VoucherID = null;
                cart.ShippingVoucherID = null;
                await _context.SaveChangesAsync();
                await CalculateCartTotalAsync(cartId);
            }
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
                if (voucher.VisibilityType == VoucherVisibilityType.Public)
                {
                    walletVoucher = new UserVoucher
                    {
                        UserID = cart.UserID,
                        VoucherID = voucher.VoucherID,
                        Status = UserVoucherStatus.Unused,
                        CollectedAt = DateTime.Now
                    };
                    _context.UserVouchers.Add(walletVoucher);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    return (false, "Voucher chưa có trong ví của bạn.");
                }
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

        public async Task<(bool Success, string Message, string AppliedCodes)> AutoApplyBestVouchersAsync(int cartId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartDetails)
                .Include(c => c.Voucher)
                .Include(c => c.ShippingVoucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);

            if (cart == null) return (false, "Giỏ hàng không tồn tại", "");

            decimal subTotal = cart.CartDetails.Sum(cd => cd.Quantity * cd.UnitPrice);

            var now = DateTime.Now;

            // 1. Lấy tất cả voucher chưa sử dụng trong ví
            var walletVoucherIds = await _context.UserVouchers
                .Where(uv => uv.UserID == cart.UserID && uv.Status == UserVoucherStatus.Unused && uv.Voucher != null && uv.Voucher.EndDate >= now)
                .Select(uv => uv.VoucherID)
                .ToListAsync();

            var walletVouchersQuery = _context.Vouchers
                .Where(v => walletVoucherIds.Contains(v.VoucherID) && v.Status && v.UsedQuantity < v.TotalQuantity);

            // 2. Lấy tất cả public vouchers chưa lưu
            var publicVouchersQuery = _context.Vouchers
                .Where(v => v.Status
                    && v.VisibilityType == VoucherVisibilityType.Public
                    && v.ExclusiveType != ExclusiveDistributionType.DirectAssign
                    && v.StartDate <= now
                    && v.EndDate >= now
                    && v.UsedQuantity < v.TotalQuantity);

            var combinedVouchers = await publicVouchersQuery.Union(walletVouchersQuery).ToListAsync();

            // Lọc các voucher hợp lệ: đạt giá trị tối thiểu và chưa vượt quá giới hạn
            var userVoucherUsages = await _context.VoucherUsages
                .Where(vu => vu.UserID == cart.UserID)
                .GroupBy(vu => vu.VoucherID)
                .Select(g => new { VoucherID = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.VoucherID, x => x.Count);

            var validVouchers = combinedVouchers
                .Where(v => v.MinOrderValue <= subTotal && v.StartDate <= now && v.EndDate >= now)
                .Where(v => 
                {
                    userVoucherUsages.TryGetValue(v.VoucherID, out int usedCount);
                    return v.UsageLimitPerUser <= 0 || usedCount < v.UsageLimitPerUser;
                })
                .ToList();

            Voucher bestProductVoucher = null;
            decimal maxProductDiscount = 0;

            Voucher bestShippingVoucher = null;
            decimal maxShippingDiscount = 0;

            foreach (var v in validVouchers)
            {
                if (v.VoucherType == VoucherType.ProductDiscount)
                {
                    decimal discount = _voucherService.CalculateDiscount(v, subTotal);
                    if (discount > maxProductDiscount)
                    {
                        maxProductDiscount = discount;
                        bestProductVoucher = v;
                    }
                }
                else if (v.VoucherType == VoucherType.ShippingDiscount)
                {
                    decimal discount = _voucherService.CalculateShippingDiscount(v, 25000); // Giả định phí ship cơ bản
                    if (discount > maxShippingDiscount)
                    {
                        maxShippingDiscount = discount;
                        bestShippingVoucher = v;
                    }
                }
            }

            if (bestProductVoucher == null && bestShippingVoucher == null)
            {
                return (false, "Không tìm thấy mã giảm giá nào phù hợp để áp dụng tự động.", "");
            }

            cart.VoucherID = bestProductVoucher?.VoucherID;
            cart.Voucher = bestProductVoucher;
            
            cart.ShippingVoucherID = bestShippingVoucher?.VoucherID;
            cart.ShippingVoucher = bestShippingVoucher;

            await _context.SaveChangesAsync();
            await CalculateCartTotalAsync(cartId);

            var appliedCodes = new List<string>();
            if (bestProductVoucher != null) appliedCodes.Add(bestProductVoucher.Code);
            if (bestShippingVoucher != null) appliedCodes.Add(bestShippingVoucher.Code);

            return (true, $"Đã tự động áp dụng {appliedCodes.Count} mã giảm giá tốt nhất!", string.Join(", ", appliedCodes));
        }

        public async Task CalculateCartTotalAsync(int cartId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartDetails)
                .Include(c => c.Voucher)
                .Include(c => c.ShippingVoucher)
                .FirstOrDefaultAsync(c => c.CartID == cartId);

            if (cart == null) return;

            // Xóa tất cả các quà tặng hiện tại trong giỏ (nếu có)
            var existingGifts = cart.CartDetails.Where(cd => cd.IsGift).ToList();
            var previousGiftChoices = existingGifts.Select(g => g.VariantID).ToList();

            if (existingGifts.Any())
            {
                _context.CartDetails.RemoveRange(existingGifts);
                cart.CartDetails = cart.CartDetails.Where(cd => !cd.IsGift).ToList();
            }

            var variantIds = cart.CartDetails.Where(cd => cd.VariantID.HasValue).Select(cd => cd.VariantID.Value).ToList();
            var variantProductMap = await _context.Variants
                .Where(v => variantIds.Contains(v.VariantID))
                .ToDictionaryAsync(v => v.VariantID, v => v.ProductID);

            var now = DateTime.Now;
            var activeGiftCampaigns = await _context.FlashSaleItems
                .Include(fsi => fsi.FlashSale)
                .Where(fsi => fsi.FlashSale.IsActive 
                    && fsi.FlashSale.StartTime <= now 
                    && fsi.FlashSale.EndTime >= now
                    && fsi.DiscountType == DiscountType.FreeGift
                    && fsi.RequiredQuantity > 0
                    && fsi.GiftVariantIds != null && fsi.GiftVariantIds != ""
                    && fsi.SoldQuantity < fsi.TotalQuantity)
                .ToListAsync();

            var newGifts = new List<CartDetail>();

            foreach (var detail in cart.CartDetails)
            {
                detail.UnitPrice = await GetEffectivePriceAsync(cart.UserID, detail.VariantID, detail.BundleID, detail.Quantity);
                detail.TotalPrice = detail.UnitPrice * detail.Quantity;

                var matchingCampaigns = activeGiftCampaigns.Where(fsi => 
                    (fsi.ItemType == FlashSaleItemType.Variant && detail.VariantID == fsi.ReferenceId) ||
                    (fsi.ItemType == FlashSaleItemType.Bundle && detail.BundleID == fsi.ReferenceId) ||
                    (fsi.ItemType == FlashSaleItemType.Product && detail.VariantID.HasValue && variantProductMap.ContainsKey(detail.VariantID.Value) && variantProductMap[detail.VariantID.Value] == fsi.ReferenceId)
                ).ToList();

                foreach (var matchingCampaign in matchingCampaigns)
                {
                    int giftMultiplier = detail.Quantity / matchingCampaign.RequiredQuantity;
                    if (giftMultiplier > 0)
                    {
                        int maxGiftAllowed = matchingCampaign.TotalQuantity - matchingCampaign.SoldQuantity;
                        
                        if (matchingCampaign.MaxQuantityPerUser > 0)
                        {
                            var userBought = await GetUserFlashSaleBoughtCountAsync(cart.UserID, matchingCampaign.Id);
                            int remainingAllowed = Math.Max(0, matchingCampaign.MaxQuantityPerUser - userBought);
                            int maxGiftsForRemaining = remainingAllowed / matchingCampaign.RequiredQuantity;
                            maxGiftAllowed = Math.Min(maxGiftAllowed, maxGiftsForRemaining);
                        }

                        int giftsToGive = Math.Min(giftMultiplier, maxGiftAllowed);

                        if (giftsToGive > 0)
                        {
                            var availableGifts = matchingCampaign.GiftVariantIds.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList();
                            if (!availableGifts.Any()) continue;

                            int? chosenGiftId = availableGifts.FirstOrDefault(g => previousGiftChoices.Contains(g));
                            if (chosenGiftId == null || chosenGiftId == 0) chosenGiftId = availableGifts.First();

                            var existingGift = newGifts.FirstOrDefault(g => g.VariantID == chosenGiftId);
                            if (existingGift != null)
                            {
                                existingGift.Quantity += giftsToGive;
                            }
                            else
                            {
                                newGifts.Add(new CartDetail
                                {
                                    CartID = cart.CartID,
                                    VariantID = chosenGiftId,
                                    Quantity = giftsToGive,
                                    UnitPrice = 0,
                                    TotalPrice = 0,
                                    IsGift = true
                                });
                            }
                        }
                    }
                }
            }

            if (newGifts.Any())
            {
                _context.CartDetails.AddRange(newGifts);
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

        public async Task<decimal> GetEffectivePriceAsync(string userId, int? variantId, int? bundleId, int quantity)
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
                        && fsi.SoldQuantity < fsi.TotalQuantity
                        && fsi.RequiredQuantity <= quantity)
                    .OrderByDescending(fsi => fsi.RequiredQuantity)
                    .FirstOrDefaultAsync();

                if (flashSaleItem != null)
                {
                    bool limitExceeded = false;
                    if (flashSaleItem.MaxQuantityPerUser > 0)
                    {
                        var userBought = await GetUserFlashSaleBoughtCountAsync(userId, flashSaleItem.Id);
                        if (userBought + quantity > flashSaleItem.MaxQuantityPerUser)
                        {
                            limitExceeded = true;
                        }
                    }
                    if (!limitExceeded)
                    {
                        return flashSaleItem.DiscountPrice;
                    }
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
                        && fsi.SoldQuantity < fsi.TotalQuantity
                        && fsi.RequiredQuantity <= quantity)
                    .OrderByDescending(fsi => fsi.RequiredQuantity)
                    .FirstOrDefaultAsync();

                if (fsVariant != null)
                {
                    bool limitExceeded = false;
                    if (fsVariant.MaxQuantityPerUser > 0)
                    {
                        var userBought = await GetUserFlashSaleBoughtCountAsync(userId, fsVariant.Id);
                        if (userBought + quantity > fsVariant.MaxQuantityPerUser)
                        {
                            limitExceeded = true;
                        }
                    }
                    if (!limitExceeded)
                    {
                        return fsVariant.DiscountPrice;
                    }
                }

                var fsProduct = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.IsActive 
                        && fsi.FlashSale.StartTime <= now 
                        && fsi.FlashSale.EndTime >= now
                        && fsi.ItemType == FlashSaleItemType.Product 
                        && fsi.ReferenceId == variant.ProductID
                        && fsi.SoldQuantity < fsi.TotalQuantity
                        && fsi.RequiredQuantity <= quantity)
                    .OrderByDescending(fsi => fsi.RequiredQuantity)
                    .FirstOrDefaultAsync();

                if (fsProduct != null)
                {
                    bool limitExceeded = false;
                    if (fsProduct.MaxQuantityPerUser > 0)
                    {
                        var userBought = await GetUserFlashSaleBoughtCountAsync(userId, fsProduct.Id);
                        if (userBought + quantity > fsProduct.MaxQuantityPerUser)
                        {
                            limitExceeded = true;
                        }
                    }
                    if (!limitExceeded)
                    {
                        return fsProduct.DiscountPrice;
                    }
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

        private async Task<int> GetUserFlashSaleBoughtCountAsync(string userId, int flashSaleItemId)
        {
            var fsItem = await _context.FlashSaleItems.FindAsync(flashSaleItemId);
            if (fsItem == null) return 0;

            var invoiceDetails = await _context.InvoiceDetails
                .Include(id => id.Invoice)
                .Where(id => id.Invoice.UserID == userId 
                    && id.Invoice.Status != OrderStatus.Cancelled
                    && !id.Invoice.IsDeleted)
                .ToListAsync();

            int count = 0;
            foreach (var detail in invoiceDetails)
            {
                if (fsItem.ItemType == FlashSaleItemType.Bundle && detail.BundleID == fsItem.ReferenceId)
                {
                    count += detail.Quantity;
                }
                else if (fsItem.ItemType == FlashSaleItemType.Variant && detail.VariantID == fsItem.ReferenceId)
                {
                    count += detail.Quantity;
                }
                else if (fsItem.ItemType == FlashSaleItemType.Product && detail.VariantID.HasValue)
                {
                    var variant = await _context.Variants.FindAsync(detail.VariantID.Value);
                    if (variant != null && variant.ProductID == fsItem.ReferenceId)
                    {
                        count += detail.Quantity;
                    }
                }
            }

            return count;
        }
    }
}
