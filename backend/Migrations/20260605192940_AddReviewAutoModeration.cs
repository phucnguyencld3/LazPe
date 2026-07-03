using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewAutoModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AutoModerationStatus",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FlaggedReason",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ViolationScore",
                table: "Reviews",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ReviewSensitiveKeywords",
                columns: table => new
                {
                    KeywordID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Word = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewSensitiveKeywords", x => x.KeywordID);
                });

            migrationBuilder.InsertData(
                table: "ReviewSensitiveKeywords",
                columns: new[] { "KeywordID", "Category", "CreatedAt", "Severity", "Word" },
                values: new object[,]
                {
                    { 1, "Abuse", new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Warning", "ngu" },
                    { 2, "Scam", new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Warning", "lừa đảo" },
                    { 3, "Phone", new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Medium", "số điện thoại" },
                    { 4, "Link", new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Medium", "zalo" },
                    { 5, "Link", new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Medium", "telegram" },
                    { 6, "Vulgarity", new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Critical", "tục tĩu" },
                    { 7, "Abuse", new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Critical", "xúc phạm" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReviewSensitiveKeywords");

            migrationBuilder.DropColumn(
                name: "AutoModerationStatus",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "FlaggedReason",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ViolationScore",
                table: "Reviews");
        }
    }
}
