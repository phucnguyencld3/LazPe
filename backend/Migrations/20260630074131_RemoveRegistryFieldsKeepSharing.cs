using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRegistryFieldsKeepSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Note",
                table: "Wishlists");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Wishlists");

            migrationBuilder.DropColumn(
                name: "QuantityNeeded",
                table: "Wishlists");

            migrationBuilder.DropColumn(
                name: "QuantityPurchased",
                table: "Wishlists");

            migrationBuilder.DropColumn(
                name: "FromWishlistUserID",
                table: "InvoiceDetails");

            migrationBuilder.DropColumn(
                name: "FromWishlistUserID",
                table: "CartDetails");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Wishlists",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "Wishlists",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuantityNeeded",
                table: "Wishlists",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "QuantityPurchased",
                table: "Wishlists",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FromWishlistUserID",
                table: "InvoiceDetails",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FromWishlistUserID",
                table: "CartDetails",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
