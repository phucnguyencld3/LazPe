using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLoyaltyStoredProcedures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop existing procedures to avoid conflicts
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS [dbo].[sp_EarnLoyaltyPoints];");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS [dbo].[sp_RevokeLoyaltyPoints];");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS [dbo].[sp_EndCycleLoyaltyReset];");

            // Create new dynamic sp_EarnLoyaltyPoints
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
    DECLARE @CurrentTierID INT;
    DECLARE @NewTierID INT;
    DECLARE @Offset INT;
    
    -- Calculate EarnedPoints dynamically
    DECLARE @VndAmount DECIMAL(18,2);
    DECLARE @PointsEarned INT;
    DECLARE @Multiplier DECIMAL(5,2);

    -- Find active campaign first
    SELECT TOP 1 @VndAmount = [VndAmount], @PointsEarned = [PointsEarned], @Multiplier = [Multiplier]
    FROM [dbo].[LoyaltyEarnPolicies]
    WHERE [IsActive] = 1 AND [IsCampaign] = 1 AND ([StartDate] IS NULL OR [StartDate] <= GETDATE()) AND ([EndDate] IS NULL OR [EndDate] >= GETDATE())
    ORDER BY [CreatedAt] DESC;

    -- Fallback to default active policy
    IF @VndAmount IS NULL
    BEGIN
        SELECT TOP 1 @VndAmount = [VndAmount], @PointsEarned = [PointsEarned], @Multiplier = [Multiplier]
        FROM [dbo].[LoyaltyEarnPolicies]
        WHERE [IsActive] = 1 AND [IsCampaign] = 0
        ORDER BY [CreatedAt] DESC;
    END

    -- Fallback to hardcoded default
    IF @VndAmount IS NULL OR @VndAmount <= 0
    BEGIN
        SET @VndAmount = 1000.00;
        SET @PointsEarned = 10;
        SET @Multiplier = 1.00;
    END

    SET @EarnedPoints = FLOOR(@TotalPrice / @VndAmount) * @PointsEarned * @Multiplier;
    
    IF @EarnedPoints <= 0
    BEGIN
        SET @ResultCode = 0;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @CurrentTierID = [CurrentTierID],
               @CurrentTotalPoints = [TotalPoints],
               @Offset = [RankAdjustmentOffset]
        FROM [dbo].[LoyaltyProfiles] WITH (UPDLOCK, ROWLOCK)
        WHERE [UserID] = @UserID;

        IF @@ROWCOUNT = 0
        BEGIN
            INSERT INTO [dbo].[LoyaltyProfiles] ([UserID], [CurrentTierID], [AvailablePoints], [TotalPoints], [PointsToNextTier], [RankAdjustmentOffset], [LastUpdated])
            VALUES (@UserID, 1, 0, 0, 30000, 0, GETDATE());
            
            SET @CurrentTierID = 1;
            SET @CurrentTotalPoints = 0;
            SET @Offset = 0;
        END

        SET @CurrentTotalPoints = @CurrentTotalPoints + @EarnedPoints;

        -- Determine the highest active tier that satisfies the threshold
        SELECT TOP 1 @NewTierID = [TierID]
        FROM [dbo].[LoyaltyTiers]
        WHERE [IsActive] = 1 AND @CurrentTotalPoints >= ([MinPoints] - @Offset)
        ORDER BY [MinPoints] DESC, [TierID] DESC;

        IF @NewTierID IS NULL SET @NewTierID = 1;

        -- Calculate PointsToNextTier
        DECLARE @PointsToNext INT = 0;
        DECLARE @NextMinPoints INT = NULL;

        SELECT TOP 1 @NextMinPoints = [MinPoints]
        FROM [dbo].[LoyaltyTiers]
        WHERE [IsActive] = 1 AND [MinPoints] > (SELECT [MinPoints] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @NewTierID)
        ORDER BY [MinPoints] ASC;

        IF @NextMinPoints IS NOT NULL
        BEGIN
            SET @PointsToNext = (@NextMinPoints - @Offset) - @CurrentTotalPoints;
            IF @PointsToNext < 0 SET @PointsToNext = 0;
        END

        UPDATE [dbo].[LoyaltyProfiles]
        SET [AvailablePoints] = [AvailablePoints] + @EarnedPoints,
            [TotalPoints] = @CurrentTotalPoints,
            [CurrentTierID] = @NewTierID,
            [PointsToNextTier] = @PointsToNext,
            [LastUpdated] = GETDATE()
        WHERE [UserID] = @UserID;

        INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
        VALUES (@UserID, 'EARN', @EarnedPoints, @InvoiceID, N'Tích điểm từ đơn hàng #' + CAST(@InvoiceID AS NVARCHAR(20)), GETDATE());

        IF @NewTierID > @CurrentTierID
        BEGIN
            DECLARE @NewTierName NVARCHAR(100);
            SELECT @NewTierName = [TierName] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @NewTierID;
            
            INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
            VALUES (@UserID, 'BONUS', 0, @InvoiceID, N'Thăng hạng lên thành viên ' + COALESCE(@NewTierName, N''), GETDATE());
        END

        COMMIT TRANSACTION;
        SET @ResultCode = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ResultCode = 0;
        ;THROW;
    END CATCH
END
");

            // Create new dynamic sp_RevokeLoyaltyPoints
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
    DECLARE @CurrentTierID INT;
    DECLARE @NewTierID INT;
    DECLARE @Offset INT;

    SELECT @PointsToRevoke = [Amount] 
    FROM [dbo].[LoyaltyPointHistories]
    WHERE [UserID] = @UserID AND [InvoiceID] = @InvoiceID AND [TransactionType] = 'EARN';

    IF @PointsToRevoke IS NULL OR @PointsToRevoke <= 0
    BEGIN
        SET @ResultCode = 0;
        RETURN;
    END

    SET @PointsToRevoke = ABS(@PointsToRevoke);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @CurrentTierID = [CurrentTierID],
               @CurrentTotalPoints = [TotalPoints],
               @Offset = [RankAdjustmentOffset]
        FROM [dbo].[LoyaltyProfiles] WITH (UPDLOCK, ROWLOCK)
        WHERE [UserID] = @UserID;

        DECLARE @NewTotalPoints INT = @CurrentTotalPoints - @PointsToRevoke;
        IF @NewTotalPoints < 0 SET @NewTotalPoints = 0;

        -- Determine the highest active tier that satisfies the threshold
        SELECT TOP 1 @NewTierID = [TierID]
        FROM [dbo].[LoyaltyTiers]
        WHERE [IsActive] = 1 AND @NewTotalPoints >= ([MinPoints] - @Offset)
        ORDER BY [MinPoints] DESC, [TierID] DESC;

        IF @NewTierID IS NULL SET @NewTierID = 1;

        -- Calculate PointsToNextTier
        DECLARE @PointsToNext INT = 0;
        DECLARE @NextMinPoints INT = NULL;

        SELECT TOP 1 @NextMinPoints = [MinPoints]
        FROM [dbo].[LoyaltyTiers]
        WHERE [IsActive] = 1 AND [MinPoints] > (SELECT [MinPoints] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @NewTierID)
        ORDER BY [MinPoints] ASC;

        IF @NextMinPoints IS NOT NULL
        BEGIN
            SET @PointsToNext = (@NextMinPoints - @Offset) - @NewTotalPoints;
            IF @PointsToNext < 0 SET @PointsToNext = 0;
        END

        UPDATE [dbo].[LoyaltyProfiles]
        SET [AvailablePoints] = [AvailablePoints] - @PointsToRevoke,
            [TotalPoints] = @NewTotalPoints,
            [CurrentTierID] = @NewTierID,
            [PointsToNextTier] = @PointsToNext,
            [LastUpdated] = GETDATE()
        WHERE [UserID] = @UserID;

        INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
        VALUES (@UserID, 'REVOKE', -@PointsToRevoke, @InvoiceID, N'Thu hồi điểm do hủy/hoàn trả đơn hàng #' + CAST(@InvoiceID AS NVARCHAR(20)), GETDATE());

        IF @NewTierID < @CurrentTierID
        BEGIN
            DECLARE @NewTierName NVARCHAR(100);
            SELECT @NewTierName = [TierName] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @NewTierID;
            
            INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [InvoiceID], [Description], [CreatedAt])
            VALUES (@UserID, 'REVOKE', 0, @InvoiceID, N'Hạ cấp thành viên xuống hạng ' + COALESCE(@NewTierName, N''), GETDATE());
        END

        COMMIT TRANSACTION;
        SET @ResultCode = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ResultCode = 0;
        ;THROW;
    END CATCH
END
");

            // Create new dynamic sp_EndCycleLoyaltyReset
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

        DECLARE @ProfileUserID NVARCHAR(450);
        DECLARE @CurrentTierID INT;

        DECLARE profile_cursor CURSOR FOR 
        SELECT [UserID], [CurrentTierID] FROM [dbo].[LoyaltyProfiles];

        OPEN profile_cursor;
        FETCH NEXT FROM profile_cursor INTO @ProfileUserID, @CurrentTierID;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE @NewTierID INT;
            DECLARE @Offset INT = 0;
            DECLARE @NextMinPoints INT = NULL;
            DECLARE @PointsToNext INT = 0;

            SELECT TOP 1 @NewTierID = [TierID]
            FROM [dbo].[LoyaltyTiers]
            WHERE [IsActive] = 1 AND [MinPoints] < (SELECT [MinPoints] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @CurrentTierID)
            ORDER BY [MinPoints] DESC;

            IF @NewTierID IS NULL SET @NewTierID = @CurrentTierID;

            SELECT TOP 1 @Offset = [MinPoints]
            FROM [dbo].[LoyaltyTiers]
            WHERE [IsActive] = 1 AND [MinPoints] < (SELECT [MinPoints] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @NewTierID)
            ORDER BY [MinPoints] DESC;

            IF @Offset IS NULL SET @Offset = 0;

            SELECT TOP 1 @NextMinPoints = [MinPoints]
            FROM [dbo].[LoyaltyTiers]
            WHERE [IsActive] = 1 AND [MinPoints] > (SELECT [MinPoints] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @NewTierID)
            ORDER BY [MinPoints] ASC;

            IF @NextMinPoints IS NOT NULL
            BEGIN
                SET @PointsToNext = @NextMinPoints - @Offset;
            END
            ELSE
            BEGIN
                SET @PointsToNext = 0;
            END

            UPDATE [dbo].[LoyaltyProfiles]
            SET [CurrentTierID] = @NewTierID,
                [RankAdjustmentOffset] = @Offset,
                [TotalPoints] = 0,
                [PointsToNextTier] = @PointsToNext,
                [LastUpdated] = GETDATE()
            WHERE [UserID] = @ProfileUserID;

            FETCH NEXT FROM profile_cursor INTO @ProfileUserID, @CurrentTierID;
        END

        CLOSE profile_cursor;
        DEALLOCATE profile_cursor;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF CURSOR_STATUS('global', 'profile_cursor') >= 0
        BEGIN
            CLOSE profile_cursor;
            DEALLOCATE profile_cursor;
        END
        ;THROW;
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
        }
    }
}
