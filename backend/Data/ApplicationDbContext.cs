using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Models;
using System;
using System.Net;
using System.Reflection.Metadata;

namespace PolyBabyAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // ===== DbSet =====
        public DbSet<Province> Provinces { get; set; }
        public DbSet<District> Districts { get; set; }
        public DbSet<Ward> Wards { get; set; }
        public DbSet<UserAddress> UserAddresses { get; set; }

        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Categories> Categories { get; set; }

        public DbSet<Product> Products { get; set; }
        public DbSet<Variant> Variants { get; set; }

        public DbSet<ProductOption> ProductOptions { get; set; }
        public DbSet<ProductOptionValue> ProductOptionValues { get; set; }
        public DbSet<VariantOptionValue> VariantOptionValues { get; set; }

        public DbSet<Bundle> Bundles { get; set; }
        public DbSet<BundleItem> BundleItems { get; set; }

        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<VoucherUsage> VoucherUsages { get; set; }
        public DbSet<UserVoucher> UserVouchers { get; set; }

        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartDetail> CartDetails { get; set; }

        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceDetail> InvoiceDetails { get; set; }

        public DbSet<Review> Reviews { get; set; }
        public DbSet<ReviewLike> ReviewLikes { get; set; }
        public DbSet<ReviewComment> ReviewComments { get; set; }
        public DbSet<ReviewMedia> ReviewMedia { get; set; }
        public DbSet<ReviewCensorshipLog> ReviewCensorshipLogs { get; set; }
        public DbSet<ReviewSensitiveKeyword> ReviewSensitiveKeywords { get; set; }

        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }
        public DbSet<RoleTemplate> RoleTemplates { get; set; }
        public DbSet<TemplatePermission> TemplatePermissions { get; set; }

        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }
        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        // ===== Loyalty Program =====
        public DbSet<LoyaltyProfile> LoyaltyProfiles { get; set; }
        public DbSet<LoyaltyPointHistory> LoyaltyPointHistories { get; set; }
        public DbSet<LoyaltyTier> LoyaltyTiers { get; set; }
        public DbSet<LoyaltyEarnPolicy> LoyaltyEarnPolicies { get; set; }
        public DbSet<LoyaltyRedeemPolicy> LoyaltyRedeemPolicies { get; set; }
        public DbSet<LoyaltyTierPrivilege> LoyaltyTierPrivileges { get; set; }
        public DbSet<LoyaltyMonthlyVoucher> LoyaltyMonthlyVouchers { get; set; }
        public DbSet<LoyaltyAuditLog> LoyaltyAuditLogs { get; set; }
        public DbSet<LoyaltyManualRevocation> LoyaltyManualRevocations { get; set; }
        public DbSet<LoyaltyBirthdayGiftLog> LoyaltyBirthdayGiftLogs { get; set; }

        // ===== Notification Center =====
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<UserNotification> UserNotifications { get; set; }
        public DbSet<NotificationTemplate> NotificationTemplates { get; set; }
        public DbSet<LoyaltySetting> LoyaltySettings { get; set; }

        // ===== Flash Sale & Campaign =====
        public DbSet<FlashSale> FlashSales { get; set; }
        public DbSet<FlashSaleItem> FlashSaleItems { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ===== Flash Sale Relationships =====
            builder.Entity<FlashSaleItem>()
                .HasOne(fsi => fsi.FlashSale)
                .WithMany(fs => fs.FlashSaleItems)
                .HasForeignKey(fsi => fsi.FlashSaleId)
                .OnDelete(DeleteBehavior.Cascade);

            // ===== Province - District - Ward =====
            builder.Entity<District>()
                .HasOne(d => d.Province)
                .WithMany(p => p.Districts)
                .HasForeignKey(d => d.ProvinceID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Ward>()
                .HasOne(w => w.District)
                .WithMany(d => d.Wards)
                .HasForeignKey(w => w.DistrictID)
                .OnDelete(DeleteBehavior.Cascade);

            // ===== UserAddress =====
            builder.Entity<UserAddress>()
                .HasOne(ua => ua.User)
                .WithMany(u => u.UserAddresses)
                .HasForeignKey(ua => ua.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<UserAddress>()
                .HasOne(ua => ua.Province)
                .WithMany(p => p.UserAddresses)
                .HasForeignKey(ua => ua.ProvinceID)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<UserAddress>()
                .HasOne(ua => ua.District)
                .WithMany(d => d.UserAddresses)
                .HasForeignKey(ua => ua.DistrictID)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<UserAddress>()
                .HasOne(ua => ua.Ward)
                .WithMany()
                .HasForeignKey(ua => ua.WardID)
                .OnDelete(DeleteBehavior.NoAction);

            // ===== Product hierarchy =====
            builder.Entity<Variant>()
                .HasOne(v => v.Product)
                .WithMany(p => p.Variants)
                .HasForeignKey(v => v.ProductID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProductOption>()
                .HasOne(po => po.Product)
                .WithMany(p => p.ProductOptions)
                .HasForeignKey(po => po.ProductID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProductOptionValue>()
                .HasOne(pov => pov.ProductOption)
                .WithMany(po => po.ProductOptionValues)
                .HasForeignKey(pov => pov.ProductOptionID)
                .OnDelete(DeleteBehavior.Cascade);

            // ===== VariantOptionValue (BẢNG TRUNG GIAN – QUAN TRỌNG NHẤT) =====
            builder.Entity<VariantOptionValue>()
                .HasKey(x => new { x.VariantID, x.ProductOptionValueID });

            builder.Entity<VariantOptionValue>()
                .HasOne(vov => vov.Variant)
                .WithMany(v => v.VariantOptionValues)
                .HasForeignKey(vov => vov.VariantID)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<VariantOptionValue>()
                .HasOne(vov => vov.ProductOptionValue)
                .WithMany(pov => pov.VariantOptionValues)
                .HasForeignKey(vov => vov.ProductOptionValueID)
                .OnDelete(DeleteBehavior.NoAction);

            // ===== Cart =====
            builder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany(u => u.Carts)
                .HasForeignKey(c => c.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // ===== Review =====
            builder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ReviewLike>()
                .HasOne(rl => rl.User)
                .WithMany(u => u.ReviewLikes)
                .HasForeignKey(rl => rl.UserID)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<ReviewComment>()
                .HasOne(rc => rc.User)
                .WithMany(u => u.ReviewComments)
                .HasForeignKey(rc => rc.UserID)
                .OnDelete(DeleteBehavior.NoAction);

            // ===== Review Media & Censorship Log =====
            builder.Entity<ReviewMedia>(entity =>
            {
                entity.HasKey(m => m.MediaID);
                entity.HasOne(m => m.Review)
                      .WithMany(r => r.ReviewMedia)
                      .HasForeignKey(m => m.ReviewID)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<ReviewCensorshipLog>(entity =>
            {
                entity.HasKey(l => l.LogID);
                entity.HasOne(l => l.Review)
                      .WithMany(r => r.CensorshipLogs)
                      .HasForeignKey(l => l.ReviewID)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(l => l.Actor)
                      .WithMany()
                      .HasForeignKey(l => l.ActorID)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ===== Voucher =====
            builder.Entity<VoucherUsage>()
                .HasKey(x => new { x.VoucherID, x.UserID });

            builder.Entity<VoucherUsage>()
                .HasOne(vu => vu.User)
                .WithMany(u => u.VoucherUsages)
                .HasForeignKey(vu => vu.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<UserVoucher>()
                .HasOne(uv => uv.User)
                .WithMany(u => u.UserVouchers)
                .HasForeignKey(uv => uv.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<UserVoucher>()
                .HasOne(uv => uv.Voucher)
                .WithMany(v => v.UserVouchers)
                .HasForeignKey(uv => uv.VoucherID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<UserVoucher>()
                .HasIndex(uv => new { uv.UserID, uv.VoucherID, uv.Status });

            builder.Entity<Cart>()
                .HasOne(c => c.Voucher)
                .WithMany()
                .HasForeignKey(c => c.VoucherID)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Cart>()
                .HasOne(c => c.ShippingVoucher)
                .WithMany()
                .HasForeignKey(c => c.ShippingVoucherID)
                .OnDelete(DeleteBehavior.NoAction);

            // ===== Invoice =====
            builder.Entity<Invoice>()
                .HasOne(i => i.User)
                .WithMany(u => u.Invoices)
                .HasForeignKey(i => i.UserID)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Invoice>()
                .HasOne(i => i.Voucher)
                .WithMany()
                .HasForeignKey(i => i.VoucherID)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Invoice>()
                .HasOne(i => i.ShippingVoucher)
                .WithMany()
                .HasForeignKey(i => i.ShippingVoucherID)
                .OnDelete(DeleteBehavior.NoAction);


            // ===== Wishlist =====
            builder.Entity<Wishlist>()
                .HasKey(w => new { w.UserID, w.ProductID });

            builder.Entity<Wishlist>()
                .HasOne(w => w.User)
                .WithMany()
                .HasForeignKey(w => w.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Wishlist>()
                .HasOne(w => w.Product)
                .WithMany()
                .HasForeignKey(w => w.ProductID)
                .OnDelete(DeleteBehavior.Cascade);

            // Chat configurations
            builder.Entity<ChatSession>()
                .HasOne(cs => cs.User)
                .WithMany()
                .HasForeignKey(cs => cs.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<ChatSession>()
                .HasOne(cs => cs.Admin)
                .WithMany()
                .HasForeignKey(cs => cs.AdminId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<ChatMessage>()
                .HasOne(cm => cm.ChatSession)
                .WithMany(cs => cs.Messages)
                .HasForeignKey(cm => cm.ChatSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ChatMessage>()
                .HasOne(cm => cm.Sender)
                .WithMany()
                .HasForeignKey(cm => cm.SenderId)
                .OnDelete(DeleteBehavior.SetNull);

            // ===== Loyalty Configurations =====
            builder.Entity<LoyaltyProfile>(entity =>
            {
                entity.HasKey(p => p.UserID);

                entity.HasOne(p => p.User)
                      .WithOne()
                      .HasForeignKey<LoyaltyProfile>(p => p.UserID)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.Tier)
                      .WithMany()
                      .HasForeignKey(p => p.CurrentTierID)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<LoyaltyPointHistory>(entity =>
            {
                entity.HasKey(h => h.HistoryID);

                entity.HasOne(h => h.Profile)
                      .WithMany()
                      .HasForeignKey(h => h.UserID)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(h => h.Invoice)
                      .WithMany()
                      .HasForeignKey(h => h.InvoiceID)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(h => new { h.UserID, h.CreatedAt });
            });

            // ===== Notification Center Configurations =====
            builder.Entity<UserNotification>(entity =>
            {
                entity.HasKey(un => un.Id);

                entity.HasOne(un => un.User)
                      .WithMany()
                      .HasForeignKey(un => un.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(un => un.Notification)
                      .WithMany(n => n.UserNotifications)
                      .HasForeignKey(un => un.NotificationId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(un => new { un.UserId, un.IsRead });
            });

            builder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.Id);
                entity.HasIndex(n => n.Code).IsUnique();
                entity.HasIndex(n => n.Status);
            });

            builder.Entity<NotificationTemplate>(entity =>
            {
                entity.HasKey(nt => nt.Id);
                entity.HasIndex(nt => nt.TemplateCode).IsUnique();
            });

            // ===== Loyalty Settings Seed =====
            builder.Entity<LoyaltySetting>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.HasData(new LoyaltySetting
                {
                    Id = 1,
                    EnableReviewReward = true,
                    ReviewRewardPoints = 200,
                    MinimumReviewWords = 50,
                    RequiredRatingForReward = 5,
                    AllowMultipleRewardsPerProduct = false,
                    ReviewWithImageRewardPoints = 300,
                    ReviewWithVideoRewardPoints = 500,
                    MinimumReviewChars = 100,
                    AllowEditReviewTimeLimitMinutes = 30,
                    MaxReviewDaysAfterReceipt = 30,
                    RequireDeliveryToReview = true,
                    UpdatedAt = new DateTime(2026, 6, 4, 17, 0, 0, DateTimeKind.Utc)
                });
            });

            // ===== Sensitive Keywords Seed =====
            builder.Entity<ReviewSensitiveKeyword>(entity =>
            {
                entity.HasKey(k => k.KeywordID);
                entity.HasData(
                    new ReviewSensitiveKeyword { KeywordID = 1, Word = "ngu", Severity = "Warning", Category = "Abuse", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc) },
                    new ReviewSensitiveKeyword { KeywordID = 2, Word = "lừa đảo", Severity = "Warning", Category = "Scam", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc) },
                    new ReviewSensitiveKeyword { KeywordID = 3, Word = "số điện thoại", Severity = "Medium", Category = "Phone", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc) },
                    new ReviewSensitiveKeyword { KeywordID = 4, Word = "zalo", Severity = "Medium", Category = "Link", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc) },
                    new ReviewSensitiveKeyword { KeywordID = 5, Word = "telegram", Severity = "Medium", Category = "Link", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc) },
                    new ReviewSensitiveKeyword { KeywordID = 6, Word = "tục tĩu", Severity = "Critical", Category = "Vulgarity", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc) },
                    new ReviewSensitiveKeyword { KeywordID = 7, Word = "xúc phạm", Severity = "Critical", Category = "Abuse", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc) }
                );
            });

            // User notification settings default values
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(u => u.ReceiveEmailNotifications).HasDefaultValue(true);
                entity.Property(u => u.ReceiveOrderUpdates).HasDefaultValue(true);
                entity.Property(u => u.ReceivePromotions).HasDefaultValue(true);
            });

            // Permission configurations
            ConfigurePermissionEntities(builder);
        }

        private void ConfigurePermissionEntities(ModelBuilder builder)
        {
            // Permission entity
            builder.Entity<Permission>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.Resource).HasMaxLength(50);
                entity.Property(e => e.Action).HasMaxLength(50);
            });

            // UserPermission entity (Many-to-Many)
            builder.Entity<UserPermission>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.PermissionId });

                entity.HasOne(e => e.User)
                      .WithMany(u => u.UserPermissions)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Permission)
                      .WithMany(p => p.UserPermissions)
                      .HasForeignKey(e => e.PermissionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ApplicationUser - RoleTemplate relationship
            builder.Entity<ApplicationUser>()
                .HasOne(u => u.RoleTemplate)
                .WithMany(rt => rt.Users)
                .HasForeignKey(u => u.RoleTemplateId)
                .OnDelete(DeleteBehavior.SetNull);

            // RoleTemplate entity
            builder.Entity<RoleTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Description).HasMaxLength(255);
                
                entity.HasData(
                    new RoleTemplate { Id = 1, Name = "Admin", Description = "Quản trị viên toàn quyền", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc), IsActive = true },
                    new RoleTemplate { Id = 2, Name = "Staff", Description = "Nhân viên bán hàng", CreatedAt = new DateTime(2026, 6, 6, 0, 0, 0, DateTimeKind.Utc), IsActive = true }
                );
            });

            // TemplatePermission entity (Many-to-Many)
            builder.Entity<TemplatePermission>(entity =>
            {
                entity.HasKey(e => new { e.TemplateId, e.PermissionId });

                entity.HasOne(e => e.RoleTemplate)
                      .WithMany(rt => rt.TemplatePermissions)
                      .HasForeignKey(e => e.TemplateId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Permission)
                      .WithMany() // We can skip the inverse navigation on Permission for simplicity
                      .HasForeignKey(e => e.PermissionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
