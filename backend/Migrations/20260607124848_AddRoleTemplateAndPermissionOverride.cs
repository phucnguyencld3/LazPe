using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleTemplateAndPermissionOverride : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsGranted",
                table: "UserPermissions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RoleTemplateId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RoleTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TemplatePermissions",
                columns: table => new
                {
                    TemplateId = table.Column<int>(type: "int", nullable: false),
                    PermissionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplatePermissions", x => new { x.TemplateId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_TemplatePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TemplatePermissions_RoleTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "RoleTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "RoleTemplates",
                columns: new[] { "Id", "CreatedAt", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Quản trị viên toàn quyền", true, "Admin" },
                    { 2, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Nhân viên bán hàng", true, "Staff" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_RoleTemplateId",
                table: "AspNetUsers",
                column: "RoleTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleTemplates_Name",
                table: "RoleTemplates",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TemplatePermissions_PermissionId",
                table: "TemplatePermissions",
                column: "PermissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_RoleTemplates_RoleTemplateId",
                table: "AspNetUsers",
                column: "RoleTemplateId",
                principalTable: "RoleTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_RoleTemplates_RoleTemplateId",
                table: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "TemplatePermissions");

            migrationBuilder.DropTable(
                name: "RoleTemplates");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_RoleTemplateId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsGranted",
                table: "UserPermissions");

            migrationBuilder.DropColumn(
                name: "RoleTemplateId",
                table: "AspNetUsers");
        }
    }
}
