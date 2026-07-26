using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAutoReplenishment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SupportsSubscription",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    SubscriptionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProductID = table.Column<int>(type: "int", nullable: false),
                    VariantID = table.Column<int>(type: "int", nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    FrequencyType = table.Column<int>(type: "int", nullable: false),
                    FrequencyValue = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NextBillingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MaxOccurrences = table.Column<int>(type: "int", nullable: true),
                    CompletedOccurrences = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ShippingAddressId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.SubscriptionID);
                    table.ForeignKey(
                        name: "FK_Subscriptions_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Products_ProductID",
                        column: x => x.ProductID,
                        principalTable: "Products",
                        principalColumn: "ProductID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Variants_VariantID",
                        column: x => x.VariantID,
                        principalTable: "Variants",
                        principalColumn: "VariantID");
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPaymentHistories",
                columns: table => new
                {
                    HistoryID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubscriptionID = table.Column<int>(type: "int", nullable: false),
                    InvoiceID = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WalletUsed = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CoinUsed = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentStatus = table.Column<int>(type: "int", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPaymentHistories", x => x.HistoryID);
                    table.ForeignKey(
                        name: "FK_SubscriptionPaymentHistories_Invoices_InvoiceID",
                        column: x => x.InvoiceID,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SubscriptionPaymentHistories_Subscriptions_SubscriptionID",
                        column: x => x.SubscriptionID,
                        principalTable: "Subscriptions",
                        principalColumn: "SubscriptionID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPaymentHistories_InvoiceID",
                table: "SubscriptionPaymentHistories",
                column: "InvoiceID");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPaymentHistories_SubscriptionID",
                table: "SubscriptionPaymentHistories",
                column: "SubscriptionID");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_ProductID",
                table: "Subscriptions",
                column: "ProductID");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_UserID",
                table: "Subscriptions",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_VariantID",
                table: "Subscriptions",
                column: "VariantID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubscriptionPaymentHistories");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "SupportsSubscription",
                table: "Products");
        }
    }
}
