using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOrderStatusEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'IsReturnReceived')
                BEGIN
                    ALTER TABLE Invoices ADD IsReturnReceived bit NOT NULL DEFAULT 0;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'RefundMethod')
                BEGIN
                    ALTER TABLE Invoices ADD RefundMethod int NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'ReturnImageUrls')
                BEGIN
                    ALTER TABLE Invoices ADD ReturnImageUrls nvarchar(max) NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'ReturnReason')
                BEGIN
                    ALTER TABLE Invoices ADD ReturnReason nvarchar(max) NULL;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'IsReturnReceived')
                BEGIN
                    ALTER TABLE Invoices DROP COLUMN IsReturnReceived;
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'RefundMethod')
                BEGIN
                    ALTER TABLE Invoices DROP COLUMN RefundMethod;
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'ReturnImageUrls')
                BEGIN
                    ALTER TABLE Invoices DROP COLUMN ReturnImageUrls;
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Invoices') AND name = 'ReturnReason')
                BEGIN
                    ALTER TABLE Invoices DROP COLUMN ReturnReason;
                END
            ");
        }
    }
}
