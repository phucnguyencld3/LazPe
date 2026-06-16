using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddIsGiftToCartDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsGift",
                table: "CartDetails",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsGift",
                table: "CartDetails");
        }
    }
}
