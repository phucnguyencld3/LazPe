using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingLoyaltyPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PendingPoints",
                table: "LoyaltyProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsUnlocked",
                table: "LoyaltyPointHistories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UnlockAt",
                table: "LoyaltyPointHistories",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingPoints",
                table: "LoyaltyProfiles");

            migrationBuilder.DropColumn(
                name: "IsUnlocked",
                table: "LoyaltyPointHistories");

            migrationBuilder.DropColumn(
                name: "UnlockAt",
                table: "LoyaltyPointHistories");
        }
    }
}
