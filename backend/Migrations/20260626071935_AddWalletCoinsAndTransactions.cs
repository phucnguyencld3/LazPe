using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletCoinsAndTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "PaymentTransactions",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "PaymentTransactions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FailedAt",
                table: "PaymentTransactions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureReason",
                table: "PaymentTransactions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "PaymentTransactions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "AmountToPay",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "CancelRefundMethod",
                table: "Invoices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CoinsDiscountAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsRefunded",
                table: "Invoices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PointsDiscountAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundedAt",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VoucherDiscountAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WalletDiscountAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CoinsBalance",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CoinsSignature",
                table: "AspNetUsers",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WalletSignature",
                table: "AspNetUsers",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BalanceTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    InvoiceID = table.Column<int>(type: "int", nullable: true),
                    SourceType = table.Column<int>(type: "int", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    HashSignature = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BalanceTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BalanceTransactions_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BalanceTransactions_Invoices_InvoiceID",
                        column: x => x.InvoiceID,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceID");
                });

            migrationBuilder.CreateTable(
                name: "WithdrawRequests",
                columns: table => new
                {
                    RequestID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BankAccount = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BankOwnerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AdminNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WithdrawRequests", x => x.RequestID);
                    table.ForeignKey(
                        name: "FK_WithdrawRequests_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BalanceTransactions_InvoiceID",
                table: "BalanceTransactions",
                column: "InvoiceID");

            migrationBuilder.CreateIndex(
                name: "IX_BalanceTransactions_UserID",
                table: "BalanceTransactions",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_WithdrawRequests_UserID",
                table: "WithdrawRequests",
                column: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BalanceTransactions");

            migrationBuilder.DropTable(
                name: "WithdrawRequests");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "FailedAt",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "FailureReason",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "AmountToPay",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CancelRefundMethod",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CoinsDiscountAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "IsRefunded",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PointsDiscountAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "RefundedAt",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "VoucherDiscountAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "WalletDiscountAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CoinsBalance",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CoinsSignature",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "WalletSignature",
                table: "AspNetUsers");
        }
    }
}
