using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CensorshipReason",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Reviews",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AllowEditReviewTimeLimitMinutes",
                table: "LoyaltySettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxReviewDaysAfterReceipt",
                table: "LoyaltySettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinimumReviewChars",
                table: "LoyaltySettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RequireDeliveryToReview",
                table: "LoyaltySettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ReviewWithImageRewardPoints",
                table: "LoyaltySettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReviewWithVideoRewardPoints",
                table: "LoyaltySettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ReviewCensorshipLogs",
                columns: table => new
                {
                    LogID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReviewID = table.Column<int>(type: "int", nullable: false),
                    ActorID = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewCensorshipLogs", x => x.LogID);
                    table.ForeignKey(
                        name: "FK_ReviewCensorshipLogs_AspNetUsers_ActorID",
                        column: x => x.ActorID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReviewCensorshipLogs_Reviews_ReviewID",
                        column: x => x.ReviewID,
                        principalTable: "Reviews",
                        principalColumn: "ReviewID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReviewMedia",
                columns: table => new
                {
                    MediaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReviewID = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    MediaType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewMedia", x => x.MediaID);
                    table.ForeignKey(
                        name: "FK_ReviewMedia_Reviews_ReviewID",
                        column: x => x.ReviewID,
                        principalTable: "Reviews",
                        principalColumn: "ReviewID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "LoyaltySettings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AllowEditReviewTimeLimitMinutes", "MaxReviewDaysAfterReceipt", "MinimumReviewChars", "RequireDeliveryToReview", "ReviewWithImageRewardPoints", "ReviewWithVideoRewardPoints" },
                values: new object[] { 30, 30, 100, true, 300, 500 });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewCensorshipLogs_ActorID",
                table: "ReviewCensorshipLogs",
                column: "ActorID");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewCensorshipLogs_ReviewID",
                table: "ReviewCensorshipLogs",
                column: "ReviewID");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewMedia_ReviewID",
                table: "ReviewMedia",
                column: "ReviewID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReviewCensorshipLogs");

            migrationBuilder.DropTable(
                name: "ReviewMedia");

            migrationBuilder.DropColumn(
                name: "CensorshipReason",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "AllowEditReviewTimeLimitMinutes",
                table: "LoyaltySettings");

            migrationBuilder.DropColumn(
                name: "MaxReviewDaysAfterReceipt",
                table: "LoyaltySettings");

            migrationBuilder.DropColumn(
                name: "MinimumReviewChars",
                table: "LoyaltySettings");

            migrationBuilder.DropColumn(
                name: "RequireDeliveryToReview",
                table: "LoyaltySettings");

            migrationBuilder.DropColumn(
                name: "ReviewWithImageRewardPoints",
                table: "LoyaltySettings");

            migrationBuilder.DropColumn(
                name: "ReviewWithVideoRewardPoints",
                table: "LoyaltySettings");
        }
    }
}
