using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixMissingProductionColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'AspNetUsers') AND name = 'WalletBalance')
                BEGIN
                    ALTER TABLE AspNetUsers ADD WalletBalance decimal(18,2) NOT NULL DEFAULT 0.0;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'AspNetUsers') AND name = 'WalletBalance')
                BEGIN
                    ALTER TABLE AspNetUsers DROP COLUMN WalletBalance;
                END
            ");
        }
    }
}
