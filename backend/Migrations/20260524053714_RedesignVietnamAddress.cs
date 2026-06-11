using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class RedesignVietnamAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Addresses_AspNetUsers_UserID",
                table: "Addresses");

            migrationBuilder.DropForeignKey(
                name: "FK_Wards_Provinces_ProvinceID",
                table: "Wards");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Addresses",
                table: "Addresses");

            migrationBuilder.RenameTable(
                name: "Addresses",
                newName: "Address");

            migrationBuilder.RenameColumn(
                name: "ProvinceID",
                table: "Wards",
                newName: "DistrictID");

            migrationBuilder.RenameIndex(
                name: "IX_Wards_ProvinceID",
                table: "Wards",
                newName: "IX_Wards_DistrictID");

            migrationBuilder.RenameIndex(
                name: "IX_Addresses_UserID",
                table: "Address",
                newName: "IX_Address_UserID");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Wards",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Wards",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Wards",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplacedByCode",
                table: "Wards",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "UserAddresses",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(13)",
                oldMaxLength: 13);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "UserAddresses",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "DistrictID",
                table: "UserAddresses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RecipientName",
                table: "UserAddresses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Provinces",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Provinces",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Provinces",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplacedByCode",
                table: "Provinces",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingDistrict",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingProvince",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingStreetAddress",
                table: "Invoices",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingWard",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Address",
                table: "Address",
                column: "AddressID");

            migrationBuilder.CreateTable(
                name: "Districts",
                columns: table => new
                {
                    DistrictID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProvinceID = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ReplacedByCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Districts", x => x.DistrictID);
                    table.ForeignKey(
                        name: "FK_Districts_Provinces_ProvinceID",
                        column: x => x.ProvinceID,
                        principalTable: "Provinces",
                        principalColumn: "ProvinceID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserAddresses_DistrictID",
                table: "UserAddresses",
                column: "DistrictID");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_ProvinceID",
                table: "Districts",
                column: "ProvinceID");

            migrationBuilder.AddForeignKey(
                name: "FK_Address_AspNetUsers_UserID",
                table: "Address",
                column: "UserID",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserAddresses_Districts_DistrictID",
                table: "UserAddresses",
                column: "DistrictID",
                principalTable: "Districts",
                principalColumn: "DistrictID");

            migrationBuilder.AddForeignKey(
                name: "FK_Wards_Districts_DistrictID",
                table: "Wards",
                column: "DistrictID",
                principalTable: "Districts",
                principalColumn: "DistrictID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Address_AspNetUsers_UserID",
                table: "Address");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAddresses_Districts_DistrictID",
                table: "UserAddresses");

            migrationBuilder.DropForeignKey(
                name: "FK_Wards_Districts_DistrictID",
                table: "Wards");

            migrationBuilder.DropTable(
                name: "Districts");

            migrationBuilder.DropIndex(
                name: "IX_UserAddresses_DistrictID",
                table: "UserAddresses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Address",
                table: "Address");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Wards");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Wards");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "Wards");

            migrationBuilder.DropColumn(
                name: "ReplacedByCode",
                table: "Wards");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "UserAddresses");

            migrationBuilder.DropColumn(
                name: "DistrictID",
                table: "UserAddresses");

            migrationBuilder.DropColumn(
                name: "RecipientName",
                table: "UserAddresses");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Provinces");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Provinces");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "Provinces");

            migrationBuilder.DropColumn(
                name: "ReplacedByCode",
                table: "Provinces");

            migrationBuilder.DropColumn(
                name: "ShippingDistrict",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ShippingProvince",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ShippingStreetAddress",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ShippingWard",
                table: "Invoices");

            migrationBuilder.RenameTable(
                name: "Address",
                newName: "Addresses");

            migrationBuilder.RenameColumn(
                name: "DistrictID",
                table: "Wards",
                newName: "ProvinceID");

            migrationBuilder.RenameIndex(
                name: "IX_Wards_DistrictID",
                table: "Wards",
                newName: "IX_Wards_ProvinceID");

            migrationBuilder.RenameIndex(
                name: "IX_Address_UserID",
                table: "Addresses",
                newName: "IX_Addresses_UserID");

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "UserAddresses",
                type: "nvarchar(13)",
                maxLength: 13,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(15)",
                oldMaxLength: 15);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Addresses",
                table: "Addresses",
                column: "AddressID");

            migrationBuilder.AddForeignKey(
                name: "FK_Addresses_AspNetUsers_UserID",
                table: "Addresses",
                column: "UserID",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wards_Provinces_ProvinceID",
                table: "Wards",
                column: "ProvinceID",
                principalTable: "Provinces",
                principalColumn: "ProvinceID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
