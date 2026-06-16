using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUsageLimitPerUserToVoucher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UsageLimitPerUser",
                table: "Vouchers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsageLimitPerUser",
                table: "Vouchers");
        }
    }
}
