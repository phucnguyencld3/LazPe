using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class OrderReturnWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Already added in a previous un-tracked migration:
            // migrationBuilder.AddColumn<bool>(name: "IsReturnReceived", table: "Invoices", ...);
            // migrationBuilder.AddColumn<int>(name: "RefundMethod", table: "Invoices", ...);
            // migrationBuilder.AddColumn<string>(name: "ReturnImageUrls", table: "Invoices", ...);
            // migrationBuilder.AddColumn<string>(name: "ReturnReason", table: "Invoices", ...);
            // migrationBuilder.AddColumn<decimal>(name: "WalletBalance", table: "AspNetUsers", ...);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsReturnReceived",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "RefundMethod",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ReturnImageUrls",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ReturnReason",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "WalletBalance",
                table: "AspNetUsers");
        }
    }
}
