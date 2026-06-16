using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUserOnboardingPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChildAgeMonths",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChildGender",
                table: "AspNetUsers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ChildWeightKg",
                table: "AspNetUsers",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsOnboarded",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MomFavoriteColors",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChildAgeMonths",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ChildGender",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ChildWeightKg",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsOnboarded",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "MomFavoriteColors",
                table: "AspNetUsers");
        }
    }
}
