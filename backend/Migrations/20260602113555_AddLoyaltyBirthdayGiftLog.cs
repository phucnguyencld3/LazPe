using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddLoyaltyBirthdayGiftLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoyaltyBirthdayGiftLogs",
                columns: table => new
                {
                    GiftLogID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    GiftType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GiftValue = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IssuedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyBirthdayGiftLogs", x => x.GiftLogID);
                    table.ForeignKey(
                        name: "FK_LoyaltyBirthdayGiftLogs_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyBirthdayGiftLogs_UserID",
                table: "LoyaltyBirthdayGiftLogs",
                column: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoyaltyBirthdayGiftLogs");
        }
    }
}
