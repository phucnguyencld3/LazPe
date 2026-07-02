using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddReferralSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WelcomeVoucherID",
                table: "LoyaltySettings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferralCode",
                table: "AspNetUsers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReferralRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReferrerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ReferredUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsPermanentlyActive = table.Column<bool>(type: "bit", nullable: false),
                    HasCompletedFirstOrder = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralRecords_AspNetUsers_ReferredUserId",
                        column: x => x.ReferredUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReferralRecords_AspNetUsers_ReferrerId",
                        column: x => x.ReferrerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "LoyaltySettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "WelcomeVoucherID",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralRecords_ReferredUserId",
                table: "ReferralRecords",
                column: "ReferredUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralRecords_ReferrerId",
                table: "ReferralRecords",
                column: "ReferrerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferralRecords");

            migrationBuilder.DropColumn(
                name: "WelcomeVoucherID",
                table: "LoyaltySettings");

            migrationBuilder.DropColumn(
                name: "ReferralCode",
                table: "AspNetUsers");
        }
    }
}
