using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class SupportMultiGiftVariantIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GiftVariantId",
                table: "FlashSaleItems");

            migrationBuilder.AddColumn<string>(
                name: "GiftVariantIds",
                table: "FlashSaleItems",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GiftVariantIds",
                table: "FlashSaleItems");

            migrationBuilder.AddColumn<int>(
                name: "GiftVariantId",
                table: "FlashSaleItems",
                type: "int",
                nullable: true);
        }
    }
}
