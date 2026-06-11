using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddShippingVouchers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFreeShipping",
                table: "Vouchers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "MaxShippingDiscount",
                table: "Vouchers",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VoucherType",
                table: "Vouchers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingDiscountAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ShippingVoucherID",
                table: "Invoices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingDiscountAmount",
                table: "Carts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ShippingVoucherID",
                table: "Carts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ShippingVoucherID",
                table: "Invoices",
                column: "ShippingVoucherID");

            migrationBuilder.CreateIndex(
                name: "IX_Carts_ShippingVoucherID",
                table: "Carts",
                column: "ShippingVoucherID");

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_Vouchers_ShippingVoucherID",
                table: "Carts",
                column: "ShippingVoucherID",
                principalTable: "Vouchers",
                principalColumn: "VoucherID");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Vouchers_ShippingVoucherID",
                table: "Invoices",
                column: "ShippingVoucherID",
                principalTable: "Vouchers",
                principalColumn: "VoucherID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Carts_Vouchers_ShippingVoucherID",
                table: "Carts");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Vouchers_ShippingVoucherID",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ShippingVoucherID",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Carts_ShippingVoucherID",
                table: "Carts");

            migrationBuilder.DropColumn(
                name: "IsFreeShipping",
                table: "Vouchers");

            migrationBuilder.DropColumn(
                name: "MaxShippingDiscount",
                table: "Vouchers");

            migrationBuilder.DropColumn(
                name: "VoucherType",
                table: "Vouchers");

            migrationBuilder.DropColumn(
                name: "ShippingDiscountAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ShippingVoucherID",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ShippingDiscountAmount",
                table: "Carts");

            migrationBuilder.DropColumn(
                name: "ShippingVoucherID",
                table: "Carts");
        }
    }
}
