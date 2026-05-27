using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSessionAdminFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminId",
                table: "ChatSessions",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdminName",
                table: "ChatSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_AdminId",
                table: "ChatSessions",
                column: "AdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatSessions_AspNetUsers_AdminId",
                table: "ChatSessions",
                column: "AdminId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatSessions_AspNetUsers_AdminId",
                table: "ChatSessions");

            migrationBuilder.DropIndex(
                name: "IX_ChatSessions_AdminId",
                table: "ChatSessions");

            migrationBuilder.DropColumn(
                name: "AdminId",
                table: "ChatSessions");

            migrationBuilder.DropColumn(
                name: "AdminName",
                table: "ChatSessions");
        }
    }
}
