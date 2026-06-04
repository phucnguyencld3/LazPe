using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicLoyaltyTiersAndPolicies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CurrentTier",
                table: "LoyaltyProfiles",
                newName: "CurrentTierID");

            migrationBuilder.CreateTable(
                name: "LoyaltyAuditLogs",
                columns: table => new
                {
                    LogID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ActorID = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ActorEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    EntityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityID = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    OldValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyAuditLogs", x => x.LogID);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyEarnPolicies",
                columns: table => new
                {
                    PolicyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    VndAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PointsEarned = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsCampaign = table.Column<bool>(type: "bit", nullable: false),
                    Multiplier = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyEarnPolicies", x => x.PolicyID);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyManualRevocations",
                columns: table => new
                {
                    RevocationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    AuditorID = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyManualRevocations", x => x.RevocationID);
                    table.ForeignKey(
                        name: "FK_LoyaltyManualRevocations_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyTiers",
                columns: table => new
                {
                    TierID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TierName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MinPoints = table.Column<int>(type: "int", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BadgeIcon = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyTiers", x => x.TierID);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyMonthlyVouchers",
                columns: table => new
                {
                    VoucherConfigID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TierID = table.Column<int>(type: "int", nullable: false),
                    VoucherCount = table.Column<int>(type: "int", nullable: false),
                    DiscountType = table.Column<int>(type: "int", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MinOrderValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MaxDiscount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ValidityDays = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyMonthlyVouchers", x => x.VoucherConfigID);
                    table.ForeignKey(
                        name: "FK_LoyaltyMonthlyVouchers_LoyaltyTiers_TierID",
                        column: x => x.TierID,
                        principalTable: "LoyaltyTiers",
                        principalColumn: "TierID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyRedeemPolicies",
                columns: table => new
                {
                    PolicyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PointsToRedeem = table.Column<int>(type: "int", nullable: false),
                    DiscountVnd = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TierID = table.Column<int>(type: "int", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyRedeemPolicies", x => x.PolicyID);
                    table.ForeignKey(
                        name: "FK_LoyaltyRedeemPolicies_LoyaltyTiers_TierID",
                        column: x => x.TierID,
                        principalTable: "LoyaltyTiers",
                        principalColumn: "TierID");
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyTierPrivileges",
                columns: table => new
                {
                    PrivilegeID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TierID = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PrivilegeType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyTierPrivileges", x => x.PrivilegeID);
                    table.ForeignKey(
                        name: "FK_LoyaltyTierPrivileges_LoyaltyTiers_TierID",
                        column: x => x.TierID,
                        principalTable: "LoyaltyTiers",
                        principalColumn: "TierID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyProfiles_CurrentTierID",
                table: "LoyaltyProfiles",
                column: "CurrentTierID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyManualRevocations_UserID",
                table: "LoyaltyManualRevocations",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyMonthlyVouchers_TierID",
                table: "LoyaltyMonthlyVouchers",
                column: "TierID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyRedeemPolicies_TierID",
                table: "LoyaltyRedeemPolicies",
                column: "TierID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyTierPrivileges_TierID",
                table: "LoyaltyTierPrivileges",
                column: "TierID");

            // Seed default loyalty tiers
            migrationBuilder.Sql("SET IDENTITY_INSERT [dbo].[LoyaltyTiers] ON;");
            migrationBuilder.Sql("INSERT INTO [dbo].[LoyaltyTiers] ([TierID], [TierName], [MinPoints], [ColorHex], [BadgeIcon], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (1, N'Standard', 0, '#64748b', 'standard-badge', 1, GETDATE(), GETDATE());");
            migrationBuilder.Sql("INSERT INTO [dbo].[LoyaltyTiers] ([TierID], [TierName], [MinPoints], [ColorHex], [BadgeIcon], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (2, N'Silver', 30000, '#cbd5e1', 'silver-badge', 1, GETDATE(), GETDATE());");
            migrationBuilder.Sql("INSERT INTO [dbo].[LoyaltyTiers] ([TierID], [TierName], [MinPoints], [ColorHex], [BadgeIcon], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (3, N'Gold', 60000, '#fbbf24', 'gold-badge', 1, GETDATE(), GETDATE());");
            migrationBuilder.Sql("INSERT INTO [dbo].[LoyaltyTiers] ([TierID], [TierName], [MinPoints], [ColorHex], [BadgeIcon], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (4, N'Diamond', 100000, '#4f46e5', 'diamond-badge', 1, GETDATE(), GETDATE());");
            migrationBuilder.Sql("SET IDENTITY_INSERT [dbo].[LoyaltyTiers] OFF;");

            // Seed default Earning Policy (1000 VND = 10 Points)
            migrationBuilder.Sql("INSERT INTO [dbo].[LoyaltyEarnPolicies] ([Name], [VndAmount], [PointsEarned], [IsActive], [IsCampaign], [Multiplier], [CreatedBy], [CreatedAt]) VALUES (N'Chính sách tích điểm mặc định', 1000.00, 10, 1, 0, 1.00, 'System', GETDATE());");

            // Seed default Redemption Policy (1 Point = 1 VND)
            migrationBuilder.Sql("INSERT INTO [dbo].[LoyaltyRedeemPolicies] ([Name], [PointsToRedeem], [DiscountVnd], [TierID], [IsActive], [CreatedBy], [CreatedAt]) VALUES (N'Chính sách đổi điểm mặc định', 1, 1.00, NULL, 1, 'System', GETDATE());");

            migrationBuilder.AddForeignKey(
                name: "FK_LoyaltyProfiles_LoyaltyTiers_CurrentTierID",
                table: "LoyaltyProfiles",
                column: "CurrentTierID",
                principalTable: "LoyaltyTiers",
                principalColumn: "TierID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoyaltyProfiles_LoyaltyTiers_CurrentTierID",
                table: "LoyaltyProfiles");

            migrationBuilder.DropTable(
                name: "LoyaltyAuditLogs");

            migrationBuilder.DropTable(
                name: "LoyaltyEarnPolicies");

            migrationBuilder.DropTable(
                name: "LoyaltyManualRevocations");

            migrationBuilder.DropTable(
                name: "LoyaltyMonthlyVouchers");

            migrationBuilder.DropTable(
                name: "LoyaltyRedeemPolicies");

            migrationBuilder.DropTable(
                name: "LoyaltyTierPrivileges");

            migrationBuilder.DropTable(
                name: "LoyaltyTiers");

            migrationBuilder.DropIndex(
                name: "IX_LoyaltyProfiles_CurrentTierID",
                table: "LoyaltyProfiles");

            migrationBuilder.RenameColumn(
                name: "CurrentTierID",
                table: "LoyaltyProfiles",
                newName: "CurrentTier");
        }
    }
}
