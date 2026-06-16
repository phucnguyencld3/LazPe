using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddIssuedCodeAndTierDiscount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IssuedCode",
                table: "UserVouchers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TierDiscountAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TierDiscountAmount",
                table: "Carts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IssuedCode",
                table: "UserVouchers");

            migrationBuilder.DropColumn(
                name: "TierDiscountAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "TierDiscountAmount",
                table: "Carts");
        }
    }
}
