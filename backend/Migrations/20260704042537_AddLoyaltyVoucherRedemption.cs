using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddLoyaltyVoucherRedemption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoyaltyVoucherRedemptionHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VoucherID = table.Column<int>(type: "int", nullable: false),
                    UserVoucherID = table.Column<int>(type: "int", nullable: true),
                    PointCost = table.Column<int>(type: "int", nullable: false),
                    PeriodKey = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RedeemedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyVoucherRedemptionHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoyaltyVoucherRedemptionHistories_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LoyaltyVoucherRedemptionHistories_UserVouchers_UserVoucherID",
                        column: x => x.UserVoucherID,
                        principalTable: "UserVouchers",
                        principalColumn: "UserVoucherID");
                    table.ForeignKey(
                        name: "FK_LoyaltyVoucherRedemptionHistories_Vouchers_VoucherID",
                        column: x => x.VoucherID,
                        principalTable: "Vouchers",
                        principalColumn: "VoucherID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyVoucherRedemptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VoucherID = table.Column<int>(type: "int", nullable: false),
                    PointCost = table.Column<int>(type: "int", nullable: false),
                    TierID = table.Column<int>(type: "int", nullable: true),
                    LimitPerUserPerPeriod = table.Column<int>(type: "int", nullable: true),
                    TotalQuotaPerPeriod = table.Column<int>(type: "int", nullable: true),
                    ResetCycle = table.Column<int>(type: "int", nullable: false),
                    ResetDayOfMonth = table.Column<int>(type: "int", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyVoucherRedemptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoyaltyVoucherRedemptions_LoyaltyTiers_TierID",
                        column: x => x.TierID,
                        principalTable: "LoyaltyTiers",
                        principalColumn: "TierID");
                    table.ForeignKey(
                        name: "FK_LoyaltyVoucherRedemptions_Vouchers_VoucherID",
                        column: x => x.VoucherID,
                        principalTable: "Vouchers",
                        principalColumn: "VoucherID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyVoucherRedemptionHistories_UserID",
                table: "LoyaltyVoucherRedemptionHistories",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyVoucherRedemptionHistories_UserVoucherID",
                table: "LoyaltyVoucherRedemptionHistories",
                column: "UserVoucherID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyVoucherRedemptionHistories_VoucherID",
                table: "LoyaltyVoucherRedemptionHistories",
                column: "VoucherID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyVoucherRedemptions_TierID",
                table: "LoyaltyVoucherRedemptions",
                column: "TierID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyVoucherRedemptions_VoucherID",
                table: "LoyaltyVoucherRedemptions",
                column: "VoucherID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoyaltyVoucherRedemptionHistories");

            migrationBuilder.DropTable(
                name: "LoyaltyVoucherRedemptions");
        }
    }
}
