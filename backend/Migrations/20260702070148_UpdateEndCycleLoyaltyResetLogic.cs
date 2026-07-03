using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolyBabyAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEndCycleLoyaltyResetLogic : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE OR ALTER PROCEDURE [dbo].[sp_EndCycleLoyaltyReset]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @ProfileUserID NVARCHAR(450);
        DECLARE @CurrentTierID INT;
        DECLARE @CurrentTotalPoints INT;

        DECLARE profile_cursor CURSOR FOR 
        SELECT [UserID], [CurrentTierID], [TotalPoints] FROM [dbo].[LoyaltyProfiles];

        OPEN profile_cursor;
        FETCH NEXT FROM profile_cursor INTO @ProfileUserID, @CurrentTierID, @CurrentTotalPoints;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE @NewTierID INT;
            DECLARE @Offset INT = 0;
            DECLARE @NextMinPoints INT = NULL;
            DECLARE @PointsToNext INT = 0;
            DECLARE @NewTotalPoints INT = 0;

            -- Find the tier immediately below the current tier
            SELECT TOP 1 @NewTierID = [TierID]
            FROM [dbo].[LoyaltyTiers]
            WHERE [IsActive] = 1 AND [MinPoints] < (SELECT [MinPoints] FROM [dbo].[LoyaltyTiers] WHERE [TierID] = @CurrentTierID)
            ORDER BY [MinPoints] DESC;

            -- If there is no lower tier, they stay in the lowest tier
            IF @NewTierID IS NULL SET @NewTierID = @CurrentTierID;

            -- Get MinPoints of the newly calculated Tier to set as the retained TotalPoints
            SELECT TOP 1 @NewTotalPoints = [MinPoints]
            FROM [dbo].[LoyaltyTiers]
            WHERE [TierID] = @NewTierID;

            -- We reset Offset to 0 because TotalPoints is retaining the exact MinPoints of the new tier.
            -- This makes sp_EarnLoyaltyPoints correctly calculate progress based on NewTotalPoints >= MinPoints.
            SET @Offset = 0;

            -- Next Min Points
            SELECT TOP 1 @NextMinPoints = [MinPoints]
            FROM [dbo].[LoyaltyTiers]
            WHERE [IsActive] = 1 AND [MinPoints] > @NewTotalPoints
            ORDER BY [MinPoints] ASC;

            IF @NextMinPoints IS NOT NULL
            BEGIN
                SET @PointsToNext = @NextMinPoints - @NewTotalPoints;
            END
            ELSE
            BEGIN
                SET @PointsToNext = 0;
            END

            -- Log the history ONLY IF TotalPoints changed.
            IF @CurrentTotalPoints > @NewTotalPoints
            BEGIN
                INSERT INTO [dbo].[LoyaltyPointHistories] ([UserID], [TransactionType], [Amount], [Description], [CreatedAt])
                VALUES (@ProfileUserID, 'RESET', -(@CurrentTotalPoints - @NewTotalPoints), N'Thu hồi điểm tích lũy xét hạng cuối kỳ (không trừ điểm khả dụng)', GETDATE());
            END

            UPDATE [dbo].[LoyaltyProfiles]
            SET [CurrentTierID] = @NewTierID,
                [RankAdjustmentOffset] = @Offset,
                [TotalPoints] = @NewTotalPoints,
                [PointsToNextTier] = @PointsToNext,
                [LastUpdated] = GETDATE()
            WHERE [UserID] = @ProfileUserID;

            FETCH NEXT FROM profile_cursor INTO @ProfileUserID, @CurrentTierID, @CurrentTotalPoints;
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
            migrationBuilder.Sql(@"
CREATE OR ALTER PROCEDURE [dbo].[sp_EndCycleLoyaltyReset]
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
    }
}
