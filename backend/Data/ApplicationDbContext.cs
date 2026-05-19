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

        public DbSet<Address> Addresses { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }

        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ===== Province - Ward =====
            builder.Entity<Ward>()
                .HasOne(w => w.Province)
                .WithMany(p => p.Wards)
                .HasForeignKey(w => w.ProvinceID)
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

            // ===== Address =====
            builder.Entity<Address>()
                .HasOne(a => a.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(a => a.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // ===== Invoice =====
            builder.Entity<Invoice>()
                .HasOne(i => i.User)
                .WithMany(u => u.Invoices)
                .HasForeignKey(i => i.UserID)
                .OnDelete(DeleteBehavior.SetNull);

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
        }
    }
}
