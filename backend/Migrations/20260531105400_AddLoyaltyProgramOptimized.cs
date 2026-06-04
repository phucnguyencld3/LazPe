using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddLoyaltyProgramOptimized : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoyaltyProfiles",
                columns: table => new
                {
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CurrentTier = table.Column<int>(type: "int", nullable: false),
                    AvailablePoints = table.Column<int>(type: "int", nullable: false),
                    TotalPoints = table.Column<int>(type: "int", nullable: false),
                    PointsToNextTier = table.Column<int>(type: "int", nullable: false),
                    RankAdjustmentOffset = table.Column<int>(type: "int", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyProfiles", x => x.UserID);
                    table.ForeignKey(
                        name: "FK_LoyaltyProfiles_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyPointHistories",
                columns: table => new
                {
                    HistoryID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    InvoiceID = table.Column<int>(type: "int", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyPointHistories", x => x.HistoryID);
                    table.ForeignKey(
                        name: "FK_LoyaltyPointHistories_Invoices_InvoiceID",
                        column: x => x.InvoiceID,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LoyaltyPointHistories_LoyaltyProfiles_UserID",
                        column: x => x.UserID,
                        principalTable: "LoyaltyProfiles",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyPointHistories_InvoiceID",
                table: "LoyaltyPointHistories",
                column: "InvoiceID");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyPointHistories_UserID_CreatedAt",
                table: "LoyaltyPointHistories",
                columns: new[] { "UserID", "CreatedAt" });

            // ===== Create Optimized Stored Procedures =====
            migrationBuilder.Sql(@"
CREATE PROCEDURE [dbo].[sp_EarnLoyaltyPoints]
    @UserID NVARCHAR(450),
    @InvoiceID INT,
    @TotalPrice DECIMAL(18,2),
    @ResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EarnedPoints INT;
    DECLARE @CurrentTotalPoints INT;
    DECLARE @CurrentTier INT;
    DECLARE @NewTier INT;
    DECLARE @Offset INT;
    
    SET @EarnedPoints = FLOOR(@TotalPrice / 1000) * 10;
    
    IF @EarnedPoints <= 0
    BEGIN
        SET @ResultCode = 0;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @CurrentTier = [CurrentTier],
               @CurrentTotalPoints = [TotalPoints],
               @Offset = [RankAdjustmentOffset]
        FROM [dbo].[LoyaltyProfiles] WITH (UPDLOCK, ROWLOCK)
        WHERE [UserID] = @UserID;

        IF @@ROWCOUNT = 0
        BEGIN
            INSERT INTO [dbo].[LoyaltyProfiles] ([UserID], [CurrentTier], [AvailablePoints], [TotalPoints], [PointsToNextTier], [RankAdjustmentOffset], [LastUpdated])
            VALUES (@UserID, 1, 0, 0, 30000, 0, GETDATE());
            
            SET @CurrentTier = 1;
            SET @CurrentTotalPoints = 0;
            SET @Offset = 0;
        END

        SET @CurrentTotalPoints = @CurrentTotalPoints + @EarnedPoints;

        -- 1: Standard (<30k), 2: Silver (>=30k), 3: Gold (>=60k), 4: Diamond (>=100k)
        SET @NewTier = CASE 
            WHEN @CurrentTotalPoints >= (100000 - @Offset) THEN 4
            WHEN @CurrentTotalPoints >= (60000 - @Offset) THEN 3
            WHEN @CurrentTotalPoints >= (30000 - @Offset) THEN 2
            ELSE 1
        END;

        DECLARE @PointsToNext INT;
        SET @PointsToNext = CASE 
            WHEN @NewTier = 1 THEN (30000 - @Offset) - @CurrentTotalPoints
            WHEN @NewTier = 2 THEN (60000 - @Offset) - @CurrentTotalPoints
            WHEN @NewTier = 3 THEN (100000 - @Offset) - @CurrentTotalPoints
            ELSE 0
        END;

        IF @PointsToNext < 0 SET @PointsToNext = 0;

        UPDATE [dbo].[LoyaltyProfiles]
        SET [AvailablePoints] = [AvailablePoints] + @EarnedPoints,
            [TotalPoints] = @CurrentTotalPoints,
            [CurrentTier] = @NewTier,
            [PointsToNextTier] = @PointsToNext,
            [LastUpdated] = GETDATE()
        WHERE [UserID] = @UserID;

        INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
        VALUES (@UserID, 'EARN', @EarnedPoints, @InvoiceID, N'Tích điểm từ đơn hàng #' + CAST(@InvoiceID AS NVARCHAR(20)), GETDATE());

        IF @NewTier > @CurrentTier
        BEGIN
            DECLARE @TierName NVARCHAR(50) = CASE @NewTier WHEN 2 THEN N'Silver' WHEN 3 THEN N'Gold' WHEN 4 THEN N'Diamond' ELSE N'Standard' END;
            
            INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
            VALUES (@UserID, 'BONUS', 0, @InvoiceID, N'Thăng hạng lên thành viên ' + @TierName, GETDATE());
        END

        COMMIT TRANSACTION;
        SET @ResultCode = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ResultCode = 0;
        THROW;
    END CATCH
END
");

            migrationBuilder.Sql(@"
CREATE PROCEDURE [dbo].[sp_RevokeLoyaltyPoints]
    @UserID NVARCHAR(450),
    @InvoiceID INT,
    @ResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PointsToRevoke INT;
    DECLARE @CurrentTotalPoints INT;
    DECLARE @CurrentTier INT;
    DECLARE @NewTier INT;
    DECLARE @Offset INT;

    SELECT @PointsToRevoke = [Amount] 
    FROM [dbo].[LoyaltyPointHistories]
    WHERE [UserID] = @UserID AND [InvoiceID] = @InvoiceID AND [TransactionType] = 'EARN';

    IF @PointsToRevoke IS NULL OR @PointsToRevoke <= 0
    BEGIN
        SET @ResultCode = 0;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @CurrentTier = [CurrentTier],
               @CurrentTotalPoints = [TotalPoints],
               @Offset = [RankAdjustmentOffset]
        FROM [dbo].[LoyaltyProfiles] WITH (UPDLOCK, ROWLOCK)
        WHERE [UserID] = @UserID;

        DECLARE @NewTotalPoints INT = @CurrentTotalPoints - @PointsToRevoke;
        IF @NewTotalPoints < 0 SET @NewTotalPoints = 0;

        SET @NewTier = CASE 
            WHEN @NewTotalPoints >= (100000 - @Offset) THEN 4
            WHEN @NewTotalPoints >= (60000 - @Offset) THEN 3
            WHEN @NewTotalPoints >= (30000 - @Offset) THEN 2
            ELSE 1
        END;

        DECLARE @PointsToNext INT;
        SET @PointsToNext = CASE 
            WHEN @NewTier = 1 THEN (30000 - @Offset) - @NewTotalPoints
            WHEN @NewTier = 2 THEN (60000 - @Offset) - @NewTotalPoints
            WHEN @NewTier = 3 THEN (100000 - @Offset) - @NewTotalPoints
            ELSE 0
        END;
        
        IF @PointsToNext < 0 SET @PointsToNext = 0;

        UPDATE [dbo].[LoyaltyProfiles]
        SET [AvailablePoints] = [AvailablePoints] - @PointsToRevoke,
            [TotalPoints] = @NewTotalPoints,
            [CurrentTier] = @NewTier,
            [PointsToNextTier] = @PointsToNext,
            [LastUpdated] = GETDATE()
        WHERE [UserID] = @UserID;

        INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
        VALUES (@UserID, 'REVOKE', -@PointsToRevoke, @InvoiceID, N'Thu hồi điểm do hủy/hoàn trả đơn hàng #' + CAST(@InvoiceID AS NVARCHAR(20)), GETDATE());

        IF @NewTier < @CurrentTier
        BEGIN
            DECLARE @TierName NVARCHAR(50) = CASE @NewTier WHEN 2 THEN N'Silver' WHEN 3 THEN N'Gold' WHEN 4 THEN N'Diamond' ELSE N'Standard' END;
            
            INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
            VALUES (@UserID, 'REVOKE', 0, @InvoiceID, N'Hạ cấp thành viên xuống hạng ' + @TierName, GETDATE());
        END

        COMMIT TRANSACTION;
        SET @ResultCode = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ResultCode = 0;
        THROW;
    END CATCH
END
");

            migrationBuilder.Sql(@"
CREATE PROCEDURE [dbo].[sp_EndCycleLoyaltyReset]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [Description], [CreatedAt])
        SELECT [UserID], 'RESET', -[TotalPoints], N'Reset điểm xét hạng cuối kỳ đánh giá', GETDATE()
        FROM [dbo].[LoyaltyProfiles]
        WHERE [TotalPoints] > 0;

        UPDATE [dbo].[LoyaltyProfiles]
        SET [CurrentTier] = CASE 
                                WHEN [CurrentTier] > 1 THEN [CurrentTier] - 1 
                                ELSE 1 
                              END,
            [RankAdjustmentOffset] = CASE 
                                        WHEN [CurrentTier] = 4 THEN 60000 
                                        WHEN [CurrentTier] = 3 THEN 30000 
                                        ELSE 0 
                                     END,
            [TotalPoints] = 0,
            [PointsToNextTier] = CASE 
                                    WHEN [CurrentTier] = 4 THEN 40000 
                                    WHEN [CurrentTier] = 3 THEN 30000 
                                    ELSE 30000 
                                 END,
            [LastUpdated] = GETDATE();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS [dbo].[sp_EarnLoyaltyPoints];");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS [dbo].[sp_RevokeLoyaltyPoints];");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS [dbo].[sp_EndCycleLoyaltyReset];");

            migrationBuilder.DropTable(
                name: "LoyaltyPointHistories");

            migrationBuilder.DropTable(
                name: "LoyaltyProfiles");
        }
    }
}
