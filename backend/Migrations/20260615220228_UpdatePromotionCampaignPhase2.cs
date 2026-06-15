using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePromotionCampaignPhase2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BannerUrl",
                table: "FlashSales",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "FlashSales",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "FlashSales",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DiscountType",
                table: "FlashSaleItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "GiftVariantId",
                table: "FlashSaleItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RequiredQuantity",
                table: "FlashSaleItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BannerUrl",
                table: "FlashSales");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "FlashSales");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "FlashSales");

            migrationBuilder.DropColumn(
                name: "DiscountType",
                table: "FlashSaleItems");

            migrationBuilder.DropColumn(
                name: "GiftVariantId",
                table: "FlashSaleItems");

            migrationBuilder.DropColumn(
                name: "RequiredQuantity",
                table: "FlashSaleItems");
        }
    }
}
