using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddWishlistRegistryAndSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                defaultValue: 1);

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

            migrationBuilder.AddColumn<bool>(
                name: "IsWishlistPublic",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "WishlistShareToken",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "IsWishlistPublic",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "WishlistShareToken",
                table: "AspNetUsers");
        }
    }
}
