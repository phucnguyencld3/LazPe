using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAffiliateSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Removed WelcomeVoucherID as it already exists

            migrationBuilder.AddColumn<int>(
                name: "AffiliateLinkId",
                table: "Invoices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AffiliateUserId",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAffiliateProcessed",
                table: "Invoices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AffiliateCode",
                table: "AspNetUsers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AffiliatePoint",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsAffiliate",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "LifetimeAffiliateRevenue",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyAffiliateRevenue",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            // Removed ReferralCode as it already exists

            migrationBuilder.CreateTable(
                name: "AffiliateLinks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AffiliateLinkCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ClickCount = table.Column<int>(type: "int", nullable: false),
                    ConversionCount = table.Column<int>(type: "int", nullable: false),
                    Revenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastClickedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliateLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AffiliateLinks_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AffiliateLinks_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "ProductID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AffiliateMilestones",
                columns: table => new
                {
                    MilestoneId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequiredRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    VoucherId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliateMilestones", x => x.MilestoneId);
                    table.ForeignKey(
                        name: "FK_AffiliateMilestones_Vouchers_VoucherId",
                        column: x => x.VoucherId,
                        principalTable: "Vouchers",
                        principalColumn: "VoucherID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AffiliateRevenueHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Revenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliateRevenueHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AffiliateRevenueHistories_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Removed ReferralRecords as it already exists

            migrationBuilder.CreateTable(
                name: "UserAffiliateMilestones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    MilestoneId = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    AchievedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAffiliateMilestones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAffiliateMilestones_AffiliateMilestones_MilestoneId",
                        column: x => x.MilestoneId,
                        principalTable: "AffiliateMilestones",
                        principalColumn: "MilestoneId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserAffiliateMilestones_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Removed UpdateData for LoyaltySettings

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateLinks_AffiliateLinkCode",
                table: "AffiliateLinks",
                column: "AffiliateLinkCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateLinks_ProductId",
                table: "AffiliateLinks",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateLinks_UserId_ProductId",
                table: "AffiliateLinks",
                columns: new[] { "UserId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateMilestones_VoucherId",
                table: "AffiliateMilestones",
                column: "VoucherId");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateRevenueHistories_UserId_Month_Year",
                table: "AffiliateRevenueHistories",
                columns: new[] { "UserId", "Month", "Year" },
                unique: true);

            // Removed ReferralRecords indexes

            migrationBuilder.CreateIndex(
                name: "IX_UserAffiliateMilestones_MilestoneId",
                table: "UserAffiliateMilestones",
                column: "MilestoneId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAffiliateMilestones_UserId_MilestoneId_Month_Year",
                table: "UserAffiliateMilestones",
                columns: new[] { "UserId", "MilestoneId", "Month", "Year" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AffiliateLinks");

            migrationBuilder.DropTable(
                name: "AffiliateRevenueHistories");

            // Removed ReferralRecords from Down

            migrationBuilder.DropTable(
                name: "UserAffiliateMilestones");

            migrationBuilder.DropTable(
                name: "AffiliateMilestones");

            // Removed WelcomeVoucherID from Down

            migrationBuilder.DropColumn(
                name: "AffiliateLinkId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "AffiliateUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "IsAffiliateProcessed",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "AffiliateCode",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AffiliatePoint",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsAffiliate",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LifetimeAffiliateRevenue",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "MonthlyAffiliateRevenue",
                table: "AspNetUsers");

            // Removed ReferralCode from Down
        }
    }
}
