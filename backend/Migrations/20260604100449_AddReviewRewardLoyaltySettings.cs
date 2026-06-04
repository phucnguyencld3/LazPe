using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewRewardLoyaltySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasEarnedRewardPoints",
                table: "Reviews",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LoyaltyPointsEarned",
                table: "Reviews",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "LoyaltySettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EnableReviewReward = table.Column<bool>(type: "bit", nullable: false),
                    ReviewRewardPoints = table.Column<int>(type: "int", nullable: false),
                    MinimumReviewWords = table.Column<int>(type: "int", nullable: false),
                    RequiredRatingForReward = table.Column<int>(type: "int", nullable: false),
                    AllowMultipleRewardsPerProduct = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltySettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "LoyaltySettings",
                columns: new[] { "Id", "AllowMultipleRewardsPerProduct", "EnableReviewReward", "MinimumReviewWords", "RequiredRatingForReward", "ReviewRewardPoints", "UpdatedAt" },
                values: new object[] { 1, false, true, 50, 5, 200, new DateTime(2026, 6, 4, 17, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoyaltySettings");

            migrationBuilder.DropColumn(
                name: "HasEarnedRewardPoints",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "LoyaltyPointsEarned",
                table: "Reviews");
        }
    }
}
