using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixVoucherUsagePrimaryKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_VoucherUsages",
                table: "VoucherUsages");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "VoucherUsages",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VoucherUsages",
                table: "VoucherUsages",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_VoucherUsages_VoucherID",
                table: "VoucherUsages",
                column: "VoucherID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_VoucherUsages",
                table: "VoucherUsages");

            migrationBuilder.DropIndex(
                name: "IX_VoucherUsages_VoucherID",
                table: "VoucherUsages");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "VoucherUsages");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VoucherUsages",
                table: "VoucherUsages",
                columns: new[] { "VoucherID", "UserID" });
        }
    }
}
