# ERD vật lý toàn bộ dự án LazPe

Nguồn sinh sơ đồ: `backend/Data/ApplicationDbContext.cs`, `backend/Migrations/ApplicationDbContextModelSnapshot.cs`, các model trong `backend/Models`, và MongoDB service/model trong `backend/Models/Mongo`.

Ký hiệu thuộc tính trong sơ đồ: `PK` là khóa chính, `FK` là khóa ngoại, `PK/FK` là cột vừa thuộc khóa chính vừa là khóa ngoại, `NULL` là cho phép null, `NOT_NULL` là bắt buộc.

## SQL Server - ERD mức vật lý

```mermaid
erDiagram
    Address {
        int AddressID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 UserID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_500 DetailAddress "NOT_NULL; MAX=500"
        nvarchar_100 District "NOT_NULL; MAX=100"
        bit IsDefault "NOT_NULL"
        nvarchar_15 PhoneNumber "NOT_NULL; MAX=15"
        nvarchar_100 Province "NOT_NULL; MAX=100"
        nvarchar_100 RecipientName "NOT_NULL; MAX=100"
        nvarchar_100 Ward "NOT_NULL; MAX=100"
    }
    AspNetRoleClaims {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 RoleId FK "NOT_NULL"
        nvarchar_max ClaimType "NULL"
        nvarchar_max ClaimValue "NULL"
    }
    AspNetRoles {
        nvarchar_450 Id PK "NOT_NULL"
        nvarchar_max ConcurrencyStamp "NULL; CONCURRENCY"
        nvarchar_256 Name "NULL; MAX=256"
        nvarchar_256 NormalizedName "NULL; MAX=256"
    }
    AspNetUserClaims {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 UserId FK "NOT_NULL"
        nvarchar_max ClaimType "NULL"
        nvarchar_max ClaimValue "NULL"
    }
    AspNetUserLogins {
        nvarchar_450 LoginProvider PK "NOT_NULL"
        nvarchar_450 ProviderKey PK "NOT_NULL"
        nvarchar_450 UserId FK "NOT_NULL"
        nvarchar_max ProviderDisplayName "NULL"
    }
    AspNetUserRoles {
        nvarchar_450 RoleId PK,FK "NOT_NULL"
        nvarchar_450 UserId PK,FK "NOT_NULL"
    }
    AspNetUsers {
        nvarchar_450 Id PK "NOT_NULL"
        int RoleTemplateId FK "NULL"
        int AccessFailedCount "NOT_NULL"
        nvarchar_500 Avatar "NULL; MAX=500"
        decimal_18_2 CoinsBalance "NOT_NULL; CONCURRENCY"
        nvarchar_256 CoinsSignature "NULL; MAX=256"
        nvarchar_max ConcurrencyStamp "NULL; CONCURRENCY"
        datetime2 DateOfBirth "NULL"
        nvarchar_256 Email "NULL; MAX=256"
        bit EmailConfirmed "NOT_NULL"
        nvarchar_100 FullName "NOT_NULL; MAX=100"
        bit IsOnboarded "NOT_NULL"
        bit IsWishlistPublic "NOT_NULL"
        bit LockoutEnabled "NOT_NULL"
        datetimeoffset LockoutEnd "NULL"
        nvarchar_256 NormalizedEmail "NULL; MAX=256"
        nvarchar_256 NormalizedUserName "NULL; MAX=256"
        nvarchar_max PasswordHash "NULL"
        int PaymentPinFailedCount "NOT_NULL"
        nvarchar_256 PaymentPinHash "NULL; MAX=256"
        datetimeoffset PaymentPinLockoutEnd "NULL"
        nvarchar_13 PhoneNumber "NULL; MAX=13"
        bit PhoneNumberConfirmed "NOT_NULL"
        bit ReceiveEmailNotifications "NOT_NULL; IDENTITY/GENERATED"
        bit ReceiveOrderUpdates "NOT_NULL; IDENTITY/GENERATED"
        bit ReceivePromotions "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_20 ReferralCode "NULL; MAX=20"
        nvarchar_max RefreshToken "NULL"
        datetime2 RefreshTokenExpiryTime "NULL"
        datetime2 RegisterDate "NOT_NULL"
        nvarchar_max SecurityStamp "NULL"
        bit Status "NOT_NULL"
        bit TwoFactorEnabled "NOT_NULL"
        nvarchar_256 UserName "NULL; MAX=256"
        decimal_18_2 WalletBalance "NOT_NULL; CONCURRENCY"
        nvarchar_256 WalletSignature "NULL; MAX=256"
        nvarchar_max WishlistShareToken "NULL"
    }
    AspNetUserTokens {
        nvarchar_450 UserId PK,FK "NOT_NULL"
        nvarchar_450 LoginProvider PK "NOT_NULL"
        nvarchar_450 Name PK "NOT_NULL"
        nvarchar_max Value "NULL"
    }
    BabyProfiles {
        int BabyProfileID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 UserID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        datetime2 DateOfBirth "NOT_NULL"
        nvarchar_200 FavoriteColors "NULL; MAX=200"
        nvarchar_20 Gender "NULL; MAX=20"
        float HeightCm "NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
        nvarchar_50 Relationship "NULL; MAX=50"
        float WeightKg "NULL"
        nvarchar_max GrowthRecords "JSON; NULL"
        nvarchar_max VaccinationRecords "JSON; NULL"
    }
    BalanceTransactions {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int InvoiceID FK "NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        decimal_18_2 Amount "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        int Direction "NOT_NULL"
        nvarchar_256 HashSignature "NOT_NULL; MAX=256"
        nvarchar_200 IdempotencyKey "NOT_NULL; MAX=200"
        nvarchar_255 Reason "NOT_NULL; MAX=255"
        int SourceType "NOT_NULL"
    }
    Banners {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_max CreatedBy "NULL"
        bit HasUnpublishedChanges "NOT_NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
        nvarchar_50 Page "NOT_NULL; MAX=50"
        nvarchar_50 Position "NOT_NULL; MAX=50"
        datetime2 PublishedAt "NULL"
        nvarchar_20 Status "NOT_NULL; MAX=20"
        nvarchar_50 Type "NOT_NULL; MAX=50"
        datetime2 UpdatedAt "NOT_NULL"
        nvarchar_50 Version "NOT_NULL; MAX=50"
        nvarchar_max DraftConfig "JSON; NULL"
        nvarchar_max LayoutConfig "JSON; NULL"
    }
    BannerVersions {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int BannerId FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_max CreatedBy "NULL"
        nvarchar_50 Version "NOT_NULL; MAX=50"
        nvarchar_max LayoutConfig "JSON; NULL"
    }
    BundleItems {
        int BundleItemID PK "NOT_NULL; IDENTITY/GENERATED"
        int BundleID FK "NOT_NULL"
        int VariantID FK "NOT_NULL"
        int Quantity "NOT_NULL"
        int SortOrder "NOT_NULL"
    }
    Bundles {
        int BundleID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_10 Code "NULL; MAX=10"
        nvarchar_450 CreatedBy "NULL; MAX=450"
        datetime2 CreatedDate "NOT_NULL"
        nvarchar_500 Description "NOT_NULL; MAX=500"
        decimal_5_2 DiscountPercent "NOT_NULL"
        nvarchar_max ImageUrl "NULL"
        nvarchar_300 Name "NOT_NULL; MAX=300"
        decimal_18_2 OriginalPrice "NULL"
        decimal_18_2 Price "NULL"
        bit Status "NOT_NULL"
        nvarchar_450 UpdatedBy "NULL; MAX=450"
        datetime2 UpdatedDate "NULL"
    }
    CartDetails {
        int CartDetailID PK "NOT_NULL; IDENTITY/GENERATED"
        int BundleID FK "NULL"
        int CartID FK "NOT_NULL"
        int VariantID FK "NULL"
        bit IsGift "NOT_NULL"
        int Quantity "NOT_NULL"
        decimal_18_2 TotalPrice "NOT_NULL"
        decimal_18_2 UnitPrice "NOT_NULL"
    }
    Carts {
        int CartID PK "NOT_NULL; IDENTITY/GENERATED"
        int ShippingVoucherID FK "NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        int VoucherID FK "NULL"
        datetime2 CreatedDate "NOT_NULL"
        decimal_18_2 DiscountAmount "NOT_NULL"
        decimal_18_2 ShippingDiscountAmount "NOT_NULL"
        bit Status "NOT_NULL"
        decimal_18_2 SubTotal "NOT_NULL"
        decimal_18_2 TierDiscountAmount "NOT_NULL"
        decimal_18_2 TotalAmount "NOT_NULL"
    }
    Categories {
        int CategoryID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_100 CategoryName "NOT_NULL; MAX=100"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_100 CreatedBy "NOT_NULL; MAX=100"
        nvarchar_500 Description "NOT_NULL; MAX=500"
        int Level "NOT_NULL"
        int ParentID "NULL"
        nvarchar_50 SortOrder "NOT_NULL; MAX=50"
        bit Status "NOT_NULL"
    }
    ChatMessages {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 ChatSessionId FK "NOT_NULL"
        nvarchar_450 SenderId FK "NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_500 ImageUrl "NULL; MAX=500"
        bit IsFromAdmin "NOT_NULL"
        nvarchar_max MessageText "NULL"
        nvarchar_100 SenderName "NOT_NULL; MAX=100"
    }
    ChatSessions {
        nvarchar_450 Id PK "NOT_NULL"
        nvarchar_450 AdminId FK "NULL"
        nvarchar_450 UserId FK "NULL"
        nvarchar_100 AdminName "NULL; MAX=100"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_100 CustomerName "NOT_NULL; MAX=100"
        bit IsClosed "NOT_NULL"
        bit IsWaitingForSupport "NOT_NULL"
        nvarchar_500 LastMessageText "NULL; MAX=500"
        int UnreadByAdmin "NOT_NULL"
        int UnreadByCustomer "NOT_NULL"
        datetime2 UpdatedAt "NOT_NULL"
    }
    Districts {
        int DistrictID PK "NOT_NULL; IDENTITY/GENERATED"
        int ProvinceID FK "NOT_NULL"
        nvarchar_10 ApiVersion "NOT_NULL; MAX=10"
        nvarchar_20 Code "NOT_NULL; MAX=20"
        bit IsActive "NOT_NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
        nvarchar_max Note "NULL"
        nvarchar_20 ReplacedByCode "NULL; MAX=20"
    }
    FlashSaleItems {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int FlashSaleId FK "NOT_NULL"
        decimal_18_2 DiscountPrice "NOT_NULL"
        int DiscountType "NOT_NULL"
        nvarchar_max GiftVariantIds "NULL"
        int ItemType "NOT_NULL"
        int MaxQuantityPerUser "NOT_NULL"
        int ReferenceId "NOT_NULL"
        int RequiredQuantity "NOT_NULL"
        int SoldQuantity "NOT_NULL"
        int TotalQuantity "NOT_NULL"
    }
    FlashSales {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_1000 BannerUrl "NULL; MAX=1000"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_100 CreatedBy "NULL; MAX=100"
        nvarchar_max Description "NULL"
        datetime2 EndTime "NOT_NULL"
        bit IsActive "NOT_NULL"
        nvarchar_200 Name "NOT_NULL; MAX=200"
        datetime2 StartTime "NOT_NULL"
        int Status "NOT_NULL"
        int Type "NOT_NULL"
    }
    InvoiceDetails {
        int InvoiceDetailID PK "NOT_NULL; IDENTITY/GENERATED"
        int BundleID FK "NULL"
        int InvoiceID FK "NOT_NULL"
        int VariantID FK "NULL"
        int Quantity "NOT_NULL"
        decimal_18_2 TotalPrice "NOT_NULL"
        decimal_18_2 UnitPrice "NOT_NULL"
    }
    Invoices {
        int InvoiceID PK "NOT_NULL; IDENTITY/GENERATED"
        int ShippingVoucherID FK "NULL"
        nvarchar_450 UserID FK "NULL"
        int VoucherID FK "NULL"
        decimal_18_2 AmountToPay "NOT_NULL"
        datetime2 CancelledAt "NULL"
        nvarchar_500 CancelReason "NULL; MAX=500"
        int CancelRefundMethod "NULL"
        decimal_18_2 CoinsDiscountAmount "NOT_NULL"
        datetime2 CompletedAt "NULL"
        datetime2 ConfirmedAt "NULL"
        datetime2 CreatedAt "NULL"
        decimal_18_2 DiscountAmount "NOT_NULL"
        nvarchar_50 InvoiceCode "NULL; MAX=50"
        bit IsDeleted "NOT_NULL"
        bit IsRefunded "NOT_NULL"
        bit IsReturnReceived "NOT_NULL"
        nvarchar_500 Note "NULL; MAX=500"
        int PayMethod "NULL"
        decimal_18_2 PointsDiscountAmount "NOT_NULL"
        nvarchar_max PrintTicketUrl "NULL"
        datetime2 RefundedAt "NULL"
        int RefundMethod "NULL"
        nvarchar_1000 ReturnDescription "NULL; MAX=1000"
        nvarchar_max ReturnImageUrls "NULL"
        nvarchar_max ReturnReason "NULL"
        datetime2 ShippedAt "NULL"
        nvarchar_500 ShippingAddress "NULL; MAX=500"
        decimal_18_2 ShippingDiscountAmount "NOT_NULL"
        nvarchar_100 ShippingDistrict "NULL; MAX=100"
        decimal_18_2 ShippingFee "NOT_NULL"
        nvarchar_15 ShippingPhone "NULL; MAX=15"
        nvarchar_100 ShippingProvince "NULL; MAX=100"
        nvarchar_100 ShippingRecipientName "NULL; MAX=100"
        nvarchar_500 ShippingStreetAddress "NULL; MAX=500"
        nvarchar_100 ShippingWard "NULL; MAX=100"
        int Status "NOT_NULL"
        decimal_18_2 SubTotal "NOT_NULL"
        decimal_18_2 TierDiscountAmount "NOT_NULL"
        decimal_18_2 TotalPrice "NOT_NULL"
        nvarchar_50 TrackingCode "NULL; MAX=50"
        decimal_18_2 VoucherDiscountAmount "NOT_NULL"
        decimal_18_2 WalletDiscountAmount "NOT_NULL"
    }
    LoyaltyAuditLogs {
        bigint LogID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_50 Action "NOT_NULL; MAX=50"
        nvarchar_256 ActorEmail "NOT_NULL; MAX=256"
        nvarchar_450 ActorID "NOT_NULL; MAX=450"
        nvarchar_100 EntityID "NOT_NULL; MAX=100"
        nvarchar_100 EntityName "NOT_NULL; MAX=100"
        nvarchar_max NewValue "NULL"
        nvarchar_1000 Notes "NULL; MAX=1000"
        nvarchar_max OldValue "NULL"
        datetime2 Timestamp "NOT_NULL"
    }
    LoyaltyBirthdayGiftLogs {
        int GiftLogID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 UserID FK "NOT_NULL; MAX=450"
        nvarchar_50 GiftType "NOT_NULL; MAX=50"
        nvarchar_200 GiftValue "NOT_NULL; MAX=200"
        nvarchar_256 IssuedBy "NOT_NULL; MAX=256"
        datetime2 ReceivedAt "NOT_NULL"
        int Year "NOT_NULL"
    }
    LoyaltyEarnPolicies {
        int PolicyID PK "NOT_NULL; IDENTITY/GENERATED"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_256 CreatedBy "NOT_NULL; MAX=256"
        datetime2 EndDate "NULL"
        bit IsActive "NOT_NULL"
        bit IsCampaign "NOT_NULL"
        decimal_5_2 Multiplier "NOT_NULL"
        nvarchar_200 Name "NOT_NULL; MAX=200"
        int PointsEarned "NOT_NULL"
        datetime2 StartDate "NULL"
        decimal_18_2 VndAmount "NOT_NULL"
    }
    LoyaltyManualRevocations {
        int RevocationID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 UserID FK "NOT_NULL"
        int Amount "NOT_NULL"
        nvarchar_450 AuditorID "NOT_NULL; MAX=450"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_500 Reason "NOT_NULL; MAX=500"
    }
    LoyaltyMonthlyVouchers {
        int VoucherConfigID PK "NOT_NULL; IDENTITY/GENERATED"
        int TierID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        int DiscountType "NOT_NULL"
        decimal_18_2 DiscountValue "NOT_NULL"
        bit IsActive "NOT_NULL"
        decimal_18_2 MaxDiscount "NOT_NULL"
        decimal_18_2 MinOrderValue "NOT_NULL"
        int ValidityDays "NOT_NULL"
        int VoucherCount "NOT_NULL"
    }
    LoyaltyPointHistories {
        bigint HistoryID PK "NOT_NULL; IDENTITY/GENERATED"
        int InvoiceID FK "NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        int Amount "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_500 Description "NOT_NULL; MAX=500"
        nvarchar_20 TransactionType "NOT_NULL; MAX=20"
    }
    LoyaltyProfiles {
        nvarchar_450 UserID PK,FK "NOT_NULL"
        int CurrentTierID FK "NOT_NULL"
        int AvailablePoints "NOT_NULL"
        int CurrentCheckInStreak "NOT_NULL"
        datetime2 LastCheckInDate "NULL"
        datetime2 LastUpdated "NOT_NULL"
        int PointsToNextTier "NOT_NULL"
        int RankAdjustmentOffset "NOT_NULL"
        int TotalPoints "NOT_NULL"
    }
    LoyaltyRedeemPolicies {
        int PolicyID PK "NOT_NULL; IDENTITY/GENERATED"
        int TierID FK "NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_256 CreatedBy "NOT_NULL; MAX=256"
        decimal_18_2 DiscountVnd "NOT_NULL"
        datetime2 EndDate "NULL"
        bit IsActive "NOT_NULL"
        nvarchar_200 Name "NOT_NULL; MAX=200"
        int PointsToRedeem "NOT_NULL"
        datetime2 StartDate "NULL"
    }
    LoyaltySettings {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int AllowEditReviewTimeLimitMinutes "NOT_NULL"
        bit AllowMultipleRewardsPerProduct "NOT_NULL"
        bit EnableReviewReward "NOT_NULL"
        int MaxReviewDaysAfterReceipt "NOT_NULL"
        int MinimumReviewChars "NOT_NULL"
        int MinimumReviewWords "NOT_NULL"
        bit RequireDeliveryToReview "NOT_NULL"
        int RequiredRatingForReward "NOT_NULL"
        int ReviewRewardPoints "NOT_NULL"
        int ReviewWithImageRewardPoints "NOT_NULL"
        int ReviewWithVideoRewardPoints "NOT_NULL"
        datetime2 UpdatedAt "NOT_NULL"
        int WelcomeVoucherID "NULL"
    }
    LoyaltyTierPrivileges {
        int PrivilegeID PK "NOT_NULL; IDENTITY/GENERATED"
        int TierID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_256 CreatedBy "NOT_NULL; MAX=256"
        bit IsActive "NOT_NULL"
        nvarchar_200 Name "NOT_NULL; MAX=200"
        nvarchar_50 PrivilegeType "NOT_NULL; MAX=50"
        nvarchar_500 Value "NULL; MAX=500"
    }
    LoyaltyTiers {
        int TierID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_200 BadgeIcon "NOT_NULL; MAX=200"
        nvarchar_50 ColorHex "NOT_NULL; MAX=50"
        datetime2 CreatedAt "NOT_NULL"
        bit IsActive "NOT_NULL"
        int MinPoints "NOT_NULL"
        nvarchar_100 TierName "NOT_NULL; MAX=100"
        datetime2 UpdatedAt "NOT_NULL"
    }
    LoyaltyVoucherRedemptionHistories {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 UserID FK "NOT_NULL"
        int UserVoucherID FK "NULL"
        int VoucherID FK "NOT_NULL"
        nvarchar_20 PeriodKey "NOT_NULL; MAX=20"
        int PointCost "NOT_NULL"
        datetime2 RedeemedAt "NOT_NULL"
    }
    LoyaltyVoucherRedemptions {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int TierID FK "NULL"
        int VoucherID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        datetime2 EndDate "NULL"
        bit IsActive "NOT_NULL"
        int LimitPerUserPerPeriod "NULL"
        int PointCost "NOT_NULL"
        int ResetCycle "NOT_NULL"
        int ResetDayOfMonth "NULL"
        datetime2 StartDate "NULL"
        int TotalQuotaPerPeriod "NULL"
        datetime2 UpdatedAt "NULL"
    }
    Notifications {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int ActionType "NOT_NULL"
        nvarchar_500 ActionUrl "NULL; MAX=500"
        nvarchar_500 BannerImage "NULL; MAX=500"
        nvarchar_50 Code "NOT_NULL; MAX=50"
        nvarchar_max Content "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_100 CreatedBy "NULL; MAX=100"
        nvarchar_100 CustomTypeName "NULL; MAX=100"
        datetime2 ExpiredAt "NULL"
        nvarchar_100 HangfireJobId "NULL; MAX=100"
        bit IsDeleted "NOT_NULL"
        bit IsPinned "NOT_NULL"
        int Priority "NOT_NULL"
        datetime2 PublishedAt "NULL"
        nvarchar_500 ShortDescription "NOT_NULL; MAX=500"
        int Status "NOT_NULL"
        int TargetType "NOT_NULL"
        nvarchar_max TargetValue "NULL"
        nvarchar_500 ThumbnailImage "NULL; MAX=500"
        nvarchar_200 Title "NOT_NULL; MAX=200"
        int Type "NOT_NULL"
        datetime2 UpdatedAt "NULL"
    }
    NotificationTemplates {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        datetime2 CreatedAt "NOT_NULL"
        bit IsActive "NOT_NULL"
        nvarchar_50 TemplateCode "NOT_NULL; MAX=50"
        nvarchar_max TemplateContent "NOT_NULL"
        nvarchar_100 TemplateName "NOT_NULL; MAX=100"
        datetime2 UpdatedAt "NULL"
    }
    PaymentTransactions {
        int PaymentTransactionId PK "NOT_NULL; IDENTITY/GENERATED"
        int InvoiceID FK "NOT_NULL"
        decimal_18_2 Amount "NOT_NULL"
        datetime2 CompletedAt "NULL"
        datetime2 CreatedAt "NOT_NULL"
        datetime2 FailedAt "NULL"
        nvarchar_500 FailureReason "NULL; MAX=500"
        datetime2 PaidAt "NULL"
        nvarchar_50 Provider "NOT_NULL; MAX=50"
        nvarchar_2000 RawQuery "NULL; MAX=2000"
        nvarchar_10 ResponseCode "NULL; MAX=10"
        int Status "NOT_NULL"
        nvarchar_50 TxnRef "NOT_NULL; MAX=50"
        nvarchar_50 VnPayTransactionNo "NULL; MAX=50"
    }
    Permissions {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_50 Action "NOT_NULL; MAX=50"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_255 Description "NOT_NULL; MAX=255"
        bit IsActive "NOT_NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
        nvarchar_50 Resource "NOT_NULL; MAX=50"
    }
    ProductAlerts {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int ProductId FK "NOT_NULL"
        nvarchar_450 UserId FK "NOT_NULL"
        int VariantId FK "NULL"
        int AlertType "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        bit IsActive "NOT_NULL"
        datetime2 LastNotifiedAt "NULL"
        decimal_18_2 TargetPrice "NULL"
    }
    ProductImages {
        int ProductImageID PK "NOT_NULL; IDENTITY/GENERATED"
        int ProductID FK "NOT_NULL"
        int DisplayOrder "NOT_NULL"
        nvarchar_max ImageUrl "NOT_NULL"
    }
    ProductOptions {
        int ProductOptionID PK "NOT_NULL; IDENTITY/GENERATED"
        int ProductID FK "NOT_NULL"
        datetime2 CreatedAt "NULL"
        nvarchar_100 CreatedBy "NOT_NULL; MAX=100"
        int DisplayOrder "NOT_NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
    }
    ProductOptionValues {
        int ProductOptionValueID PK "NOT_NULL; IDENTITY/GENERATED"
        int ProductOptionID FK "NOT_NULL"
        datetime2 CreatedAt "NULL"
        nvarchar_100 CreatedBy "NOT_NULL; MAX=100"
        int DisplayOrder "NOT_NULL"
        bit IsDeleted "NOT_NULL"
        decimal_18_2 Price "NOT_NULL"
        nvarchar_50 Value "NOT_NULL; MAX=50"
    }
    Products {
        int ProductID PK "NOT_NULL; IDENTITY/GENERATED"
        int CategoryID FK "NOT_NULL"
        int SupplierID FK "NOT_NULL"
        float AverageRating "NOT_NULL"
        nvarchar_50 Code "NOT_NULL; MAX=50"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_max CreatedBy "NOT_NULL"
        nvarchar_max Description "NOT_NULL"
        bit IsDeleted "NOT_NULL"
        nvarchar_500 MetaDescription "NULL; MAX=500"
        nvarchar_255 MetaTitle "NULL; MAX=255"
        decimal_18_2 Price "NOT_NULL"
        decimal_5_2 ProductDiscountPercent "NOT_NULL"
        nvarchar_200 ProductName "NOT_NULL; MAX=200"
        int ReviewCount "NOT_NULL"
        nvarchar_255 Slug "NULL; MAX=255"
        nvarchar_max Specifications "NULL"
        bit Status "NOT_NULL"
        int Stock "NOT_NULL"
        bit SupportsSubscription "NOT_NULL"
    }
    Provinces {
        int ProvinceID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_10 ApiVersion "NOT_NULL; MAX=10"
        nvarchar_20 Code "NOT_NULL; MAX=20"
        bit IsActive "NOT_NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
        nvarchar_max Note "NULL"
        nvarchar_20 ReplacedByCode "NULL; MAX=20"
    }
    ReferralRecords {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 ReferredUserId FK "NOT_NULL"
        nvarchar_450 ReferrerId FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        bit HasCompletedFirstOrder "NOT_NULL"
        bit IsPermanentlyActive "NOT_NULL"
    }
    ReviewCensorshipLogs {
        int LogID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 ActorID FK "NOT_NULL; MAX=450"
        int ReviewID FK "NOT_NULL"
        nvarchar_50 Action "NOT_NULL; MAX=50"
        nvarchar_500 Reason "NOT_NULL; MAX=500"
        datetime2 Timestamp "NOT_NULL"
    }
    ReviewComments {
        int CommentID PK "NOT_NULL; IDENTITY/GENERATED"
        int ParentCommentID FK "NULL"
        int ReviewID FK "NOT_NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        nvarchar_500 Content "NOT_NULL; MAX=500"
        datetime2 CreatedAt "NOT_NULL"
        bit IsHidden "NOT_NULL"
    }
    ReviewLikes {
        int LikeID PK "NOT_NULL; IDENTITY/GENERATED"
        int ReviewID FK "NOT_NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
    }
    ReviewMedia {
        int MediaID PK "NOT_NULL; IDENTITY/GENERATED"
        int ReviewID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_50 MediaType "NOT_NULL; MAX=50"
        nvarchar_2048 Url "NOT_NULL; MAX=2048"
    }
    Reviews {
        int ReviewID PK "NOT_NULL; IDENTITY/GENERATED"
        int BundleID FK "NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        int VariantID FK "NOT_NULL"
        nvarchar_max AutoModerationStatus "NULL"
        nvarchar_max CensorshipReason "NULL"
        nvarchar_500 Content "NOT_NULL; MAX=500"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_max FlaggedReason "NULL"
        bit HasEarnedRewardPoints "NOT_NULL"
        bit IsHidden "NOT_NULL"
        int LoyaltyPointsEarned "NOT_NULL"
        int Rating "NOT_NULL"
        datetime2 UpdatedAt "NULL"
        int ViolationScore "NOT_NULL"
    }
    ReviewSensitiveKeywords {
        int KeywordID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_50 Category "NOT_NULL; MAX=50"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_20 Severity "NOT_NULL; MAX=20"
        nvarchar_100 Word "NOT_NULL; MAX=100"
    }
    RoleTemplates {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_255 Description "NOT_NULL; MAX=255"
        bit IsActive "NOT_NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
    }
    SubscriptionPaymentHistories {
        int HistoryID PK "NOT_NULL; IDENTITY/GENERATED"
        int InvoiceID FK "NULL"
        int SubscriptionID FK "NOT_NULL"
        decimal_18_2 Amount "NOT_NULL"
        decimal_18_2 CoinUsed "NOT_NULL"
        nvarchar_max Message "NULL"
        datetime2 PaymentDate "NOT_NULL"
        int PaymentStatus "NOT_NULL"
        decimal_18_2 WalletUsed "NOT_NULL"
    }
    Subscriptions {
        int SubscriptionID PK "NOT_NULL; IDENTITY/GENERATED"
        int ProductID FK "NOT_NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        int VariantID FK "NULL"
        int CompletedOccurrences "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        datetime2 EndDate "NULL"
        int FrequencyType "NOT_NULL"
        int FrequencyValue "NOT_NULL"
        int MaxOccurrences "NULL"
        datetime2 NextBillingDate "NOT_NULL"
        int Quantity "NOT_NULL"
        int ShippingAddressId "NOT_NULL"
        datetime2 StartDate "NOT_NULL"
        int Status "NOT_NULL"
        decimal_18_2 SubscribedPrice "NOT_NULL"
        datetime2 UpdatedAt "NULL"
    }
    Suppliers {
        int SupplierID PK "NOT_NULL; IDENTITY/GENERATED"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_100 CreatedBy "NOT_NULL; MAX=100"
        nvarchar_500 Description "NOT_NULL; MAX=500"
        nvarchar_max Logo "NOT_NULL"
        bit Status "NOT_NULL"
        nvarchar_200 SupplierName "NOT_NULL; MAX=200"
    }
    TemplatePermissions {
        int PermissionId PK,FK "NOT_NULL"
        int TemplateId PK,FK "NOT_NULL"
    }
    UserAddresses {
        int AddressID PK "NOT_NULL; IDENTITY/GENERATED"
        int DistrictID FK "NULL"
        int ProvinceID FK "NOT_NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        int WardID FK "NULL"
        datetime2 CreatedAt "NOT_NULL"
        bit IsDefault "NOT_NULL"
        nvarchar_15 PhoneNumber "NOT_NULL; MAX=15"
        nvarchar_100 RecipientName "NOT_NULL; MAX=100"
        nvarchar_500 StreetAddress "NOT_NULL; MAX=500"
    }
    UserNotifications {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int NotificationId FK "NOT_NULL"
        nvarchar_450 UserId FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        bit IsDeleted "NOT_NULL"
        bit IsRead "NOT_NULL"
        datetime2 ReadAt "NULL"
    }
    UserPermissions {
        int PermissionId PK,FK "NOT_NULL"
        nvarchar_450 UserId PK,FK "NOT_NULL"
        datetime2 GrantedAt "NOT_NULL"
        nvarchar_max GrantedBy "NULL"
        bit IsGranted "NOT_NULL"
    }
    UserVouchers {
        int UserVoucherID PK "NOT_NULL; IDENTITY/GENERATED"
        int InvoiceID FK "NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        int VoucherID FK "NOT_NULL"
        datetime2 CollectedAt "NOT_NULL"
        nvarchar_50 IssuedCode "NULL; MAX=50"
        int SourceType "NOT_NULL"
        int Status "NOT_NULL"
        datetime2 UsedAt "NULL"
    }
    VariantOptionValues {
        int ProductOptionValueID PK,FK "NOT_NULL"
        int VariantID PK,FK "NOT_NULL"
        int VariantOptionValueID "NOT_NULL; IDENTITY/GENERATED"
    }
    Variants {
        int VariantID PK "NOT_NULL; IDENTITY/GENERATED"
        int ProductID FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
        nvarchar_100 CreatedBy "NOT_NULL; MAX=100"
        nvarchar_max Description "NOT_NULL"
        nvarchar_max ImageUrl "NULL"
        bit IsDeleted "NOT_NULL"
        nvarchar_100 SKU "NOT_NULL; MAX=100"
        bit Status "NOT_NULL"
        int Stock "NOT_NULL; CONCURRENCY"
        decimal_18_2 UnitPrice "NOT_NULL"
        decimal_5_2 VariantDiscountPercent "NOT_NULL"
        nvarchar_300 VariantName "NOT_NULL; MAX=300"
    }
    Vouchers {
        int VoucherID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_50 Code "NOT_NULL; MAX=50"
        int DiscountType "NOT_NULL"
        decimal_18_2 DiscountValue "NOT_NULL"
        datetime2 EndDate "NOT_NULL"
        int ExclusiveType "NOT_NULL"
        bit IsFreeShipping "NOT_NULL"
        decimal_18_2 MaxDiscount "NOT_NULL"
        decimal_18_2 MaxShippingDiscount "NULL"
        decimal_18_2 MinOrderValue "NOT_NULL"
        nvarchar_200 Name "NOT_NULL; MAX=200"
        datetime2 StartDate "NOT_NULL"
        bit Status "NOT_NULL"
        int TotalQuantity "NOT_NULL"
        int UsageLimitPerUser "NOT_NULL"
        int UsedQuantity "NOT_NULL"
        int VisibilityType "NOT_NULL"
        int VoucherType "NOT_NULL"
    }
    VoucherUsages {
        int Id PK "NOT_NULL; IDENTITY/GENERATED"
        int CartID FK "NULL"
        int InvoiceID FK "NULL"
        nvarchar_450 UserID FK "NOT_NULL"
        int VoucherID FK "NOT_NULL"
        decimal_18_2 DiscountAmount "NOT_NULL"
        decimal_18_2 OrderValue "NOT_NULL"
        datetime2 UsedAt "NOT_NULL"
    }
    Wards {
        int WardID PK "NOT_NULL; IDENTITY/GENERATED"
        int DistrictID FK "NOT_NULL"
        nvarchar_10 ApiVersion "NOT_NULL; MAX=10"
        nvarchar_20 Code "NOT_NULL; MAX=20"
        bit IsActive "NOT_NULL"
        nvarchar_100 Name "NOT_NULL; MAX=100"
        nvarchar_max Note "NULL"
        nvarchar_20 ReplacedByCode "NULL; MAX=20"
    }
    Wishlists {
        int ProductID PK,FK "NOT_NULL"
        nvarchar_450 UserID PK,FK "NOT_NULL"
        datetime2 CreatedAt "NOT_NULL"
    }
    WithdrawRequests {
        int RequestID PK "NOT_NULL; IDENTITY/GENERATED"
        nvarchar_450 UserID FK "NOT_NULL"
        nvarchar_500 AdminNote "NULL; MAX=500"
        decimal_18_2 Amount "NOT_NULL"
        nvarchar_50 BankAccount "NOT_NULL; MAX=50"
        nvarchar_100 BankName "NOT_NULL; MAX=100"
        nvarchar_100 BankOwnerName "NOT_NULL; MAX=100"
        datetime2 CreatedAt "NOT_NULL"
        datetime2 ProcessedAt "NULL"
        nvarchar_50 Status "NOT_NULL; MAX=50"
    }
    AspNetUsers ||--o{ Address : "UserID"
    AspNetRoles ||--o{ AspNetRoleClaims : "RoleId"
    AspNetUsers ||--o{ AspNetUserClaims : "UserId"
    AspNetUsers ||--o{ AspNetUserLogins : "UserId"
    AspNetRoles ||--o{ AspNetUserRoles : "RoleId"
    AspNetUsers ||--o{ AspNetUserRoles : "UserId"
    RoleTemplates o|--o{ AspNetUsers : "RoleTemplateId"
    AspNetUsers ||--o{ AspNetUserTokens : "UserId"
    AspNetUsers ||--o{ BabyProfiles : "UserID"
    AspNetUsers ||--o{ BalanceTransactions : "UserID"
    Invoices o|--o{ BalanceTransactions : "InvoiceID"
    Banners ||--o{ BannerVersions : "BannerId"
    Bundles ||--o{ BundleItems : "BundleID"
    Variants ||--o{ BundleItems : "VariantID"
    Bundles o|--o{ CartDetails : "BundleID"
    Carts ||--o{ CartDetails : "CartID"
    Variants o|--o{ CartDetails : "VariantID"
    AspNetUsers ||--o{ Carts : "UserID"
    Vouchers o|--o{ Carts : "ShippingVoucherID"
    Vouchers o|--o{ Carts : "VoucherID"
    AspNetUsers o|--o{ ChatMessages : "SenderId"
    ChatSessions ||--o{ ChatMessages : "ChatSessionId"
    AspNetUsers o|--o{ ChatSessions : "AdminId"
    AspNetUsers o|--o{ ChatSessions : "UserId"
    Provinces ||--o{ Districts : "ProvinceID"
    FlashSales ||--o{ FlashSaleItems : "FlashSaleId"
    Bundles o|--o{ InvoiceDetails : "BundleID"
    Invoices ||--o{ InvoiceDetails : "InvoiceID"
    Variants o|--o{ InvoiceDetails : "VariantID"
    AspNetUsers o|--o{ Invoices : "UserID"
    Vouchers o|--o{ Invoices : "ShippingVoucherID"
    Vouchers o|--o{ Invoices : "VoucherID"
    AspNetUsers ||--o{ LoyaltyBirthdayGiftLogs : "UserID"
    AspNetUsers ||--o{ LoyaltyManualRevocations : "UserID"
    LoyaltyTiers ||--o{ LoyaltyMonthlyVouchers : "TierID"
    Invoices o|--o{ LoyaltyPointHistories : "InvoiceID"
    LoyaltyProfiles ||--o{ LoyaltyPointHistories : "UserID"
    AspNetUsers ||--o| LoyaltyProfiles : "UserID"
    LoyaltyTiers ||--o{ LoyaltyProfiles : "CurrentTierID"
    LoyaltyTiers o|--o{ LoyaltyRedeemPolicies : "TierID"
    LoyaltyTiers ||--o{ LoyaltyTierPrivileges : "TierID"
    AspNetUsers ||--o{ LoyaltyVoucherRedemptionHistories : "UserID"
    UserVouchers o|--o{ LoyaltyVoucherRedemptionHistories : "UserVoucherID"
    Vouchers ||--o{ LoyaltyVoucherRedemptionHistories : "VoucherID"
    LoyaltyTiers o|--o{ LoyaltyVoucherRedemptions : "TierID"
    Vouchers ||--o{ LoyaltyVoucherRedemptions : "VoucherID"
    Invoices ||--o{ PaymentTransactions : "InvoiceID"
    AspNetUsers ||--o{ ProductAlerts : "UserId"
    Products ||--o{ ProductAlerts : "ProductId"
    Variants o|--o{ ProductAlerts : "VariantId"
    Products ||--o{ ProductImages : "ProductID"
    Products ||--o{ ProductOptions : "ProductID"
    ProductOptions ||--o{ ProductOptionValues : "ProductOptionID"
    Categories ||--o{ Products : "CategoryID"
    Suppliers ||--o{ Products : "SupplierID"
    AspNetUsers ||--o{ ReferralRecords : "ReferredUserId"
    AspNetUsers ||--o{ ReferralRecords : "ReferrerId"
    AspNetUsers ||--o{ ReviewCensorshipLogs : "ActorID"
    Reviews ||--o{ ReviewCensorshipLogs : "ReviewID"
    AspNetUsers ||--o{ ReviewComments : "UserID"
    ReviewComments o|--o{ ReviewComments : "ParentCommentID"
    Reviews ||--o{ ReviewComments : "ReviewID"
    AspNetUsers ||--o{ ReviewLikes : "UserID"
    Reviews ||--o{ ReviewLikes : "ReviewID"
    Reviews ||--o{ ReviewMedia : "ReviewID"
    AspNetUsers ||--o{ Reviews : "UserID"
    Bundles o|--o{ Reviews : "BundleID"
    Variants ||--o{ Reviews : "VariantID"
    Invoices o|--o{ SubscriptionPaymentHistories : "InvoiceID"
    Subscriptions ||--o{ SubscriptionPaymentHistories : "SubscriptionID"
    AspNetUsers ||--o{ Subscriptions : "UserID"
    Products ||--o{ Subscriptions : "ProductID"
    Variants o|--o{ Subscriptions : "VariantID"
    Permissions ||--o{ TemplatePermissions : "PermissionId"
    RoleTemplates ||--o{ TemplatePermissions : "TemplateId"
    AspNetUsers ||--o{ UserAddresses : "UserID"
    Districts o|--o{ UserAddresses : "DistrictID"
    Provinces ||--o{ UserAddresses : "ProvinceID"
    Wards o|--o{ UserAddresses : "WardID"
    AspNetUsers ||--o{ UserNotifications : "UserId"
    Notifications ||--o{ UserNotifications : "NotificationId"
    AspNetUsers ||--o{ UserPermissions : "UserId"
    Permissions ||--o{ UserPermissions : "PermissionId"
    AspNetUsers ||--o{ UserVouchers : "UserID"
    Invoices o|--o{ UserVouchers : "InvoiceID"
    Vouchers ||--o{ UserVouchers : "VoucherID"
    ProductOptionValues ||--o{ VariantOptionValues : "ProductOptionValueID"
    Variants ||--o{ VariantOptionValues : "VariantID"
    Products ||--o{ Variants : "ProductID"
    AspNetUsers ||--o{ VoucherUsages : "UserID"
    Carts o|--o{ VoucherUsages : "CartID"
    Invoices o|--o{ VoucherUsages : "InvoiceID"
    Vouchers ||--o{ VoucherUsages : "VoucherID"
    Districts ||--o{ Wards : "DistrictID"
    AspNetUsers ||--o{ Wishlists : "UserID"
    Products ||--o{ Wishlists : "ProductID"
    AspNetUsers ||--o{ WithdrawRequests : "UserID"
```

## SQL Server - danh sách bảng và thuộc tính

### `Address`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `AddressID` | `int` | NO | PK | Identity/generated; Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `DetailAddress` | `nvarchar(500)` | NO |  | Max length 500 |
| `District` | `nvarchar(100)` | NO |  | Max length 100 |
| `IsDefault` | `bit` | NO |  | Default False |
| `PhoneNumber` | `nvarchar(15)` | NO |  | Max length 15 |
| `Province` | `nvarchar(100)` | NO |  | Max length 100 |
| `RecipientName` | `nvarchar(100)` | NO |  | Max length 100 |
| `Ward` | `nvarchar(100)` | NO |  | Max length 100 |

Index:
- `UserID` (name `IX_Address_UserID`)

### `AspNetRoleClaims`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `RoleId` | `nvarchar(450)` | NO | FK |  |
| `ClaimType` | `nvarchar(max)` | YES |  |  |
| `ClaimValue` | `nvarchar(max)` | YES |  |  |

Index:
- `RoleId` (name `IX_AspNetRoleClaims_RoleId`)

### `AspNetRoles`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `nvarchar(450)` | NO | PK |  |
| `ConcurrencyStamp` | `nvarchar(max)` | YES |  | Concurrency token |
| `Name` | `nvarchar(256)` | YES |  | Max length 256 |
| `NormalizedName` | `nvarchar(256)` | YES |  | Max length 256 |

Index:
- `NormalizedName` (unique; name `RoleNameIndex`; filter `[NormalizedName] IS NOT NULL`)

### `AspNetUserClaims`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `UserId` | `nvarchar(450)` | NO | FK |  |
| `ClaimType` | `nvarchar(max)` | YES |  |  |
| `ClaimValue` | `nvarchar(max)` | YES |  |  |

Index:
- `UserId` (name `IX_AspNetUserClaims_UserId`)

### `AspNetUserLogins`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `LoginProvider` | `nvarchar(450)` | NO | PK |  |
| `ProviderKey` | `nvarchar(450)` | NO | PK |  |
| `UserId` | `nvarchar(450)` | NO | FK |  |
| `ProviderDisplayName` | `nvarchar(max)` | YES |  |  |

Index:
- `UserId` (name `IX_AspNetUserLogins_UserId`)

### `AspNetUserRoles`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `RoleId` | `nvarchar(450)` | NO | PK, FK |  |
| `UserId` | `nvarchar(450)` | NO | PK, FK |  |

Index:
- `RoleId` (name `IX_AspNetUserRoles_RoleId`)

### `AspNetUsers`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `nvarchar(450)` | NO | PK |  |
| `RoleTemplateId` | `int` | YES | FK |  |
| `AccessFailedCount` | `int` | NO |  | Default 0 |
| `Avatar` | `nvarchar(500)` | YES |  | Max length 500 |
| `CoinsBalance` | `decimal(18,2)` | NO |  | Concurrency token; Default 0 |
| `CoinsSignature` | `nvarchar(256)` | YES |  | Max length 256 |
| `ConcurrencyStamp` | `nvarchar(max)` | YES |  | Concurrency token |
| `DateOfBirth` | `datetime2` | YES |  |  |
| `Email` | `nvarchar(256)` | YES |  | Max length 256 |
| `EmailConfirmed` | `bit` | NO |  | Default False |
| `FullName` | `nvarchar(100)` | NO |  | Max length 100 |
| `IsOnboarded` | `bit` | NO |  | Default False |
| `IsWishlistPublic` | `bit` | NO |  | Default False |
| `LockoutEnabled` | `bit` | NO |  | Default False |
| `LockoutEnd` | `datetimeoffset` | YES |  |  |
| `NormalizedEmail` | `nvarchar(256)` | YES |  | Max length 256 |
| `NormalizedUserName` | `nvarchar(256)` | YES |  | Max length 256 |
| `PasswordHash` | `nvarchar(max)` | YES |  |  |
| `PaymentPinFailedCount` | `int` | NO |  | Default 0 |
| `PaymentPinHash` | `nvarchar(256)` | YES |  | Max length 256 |
| `PaymentPinLockoutEnd` | `datetimeoffset` | YES |  |  |
| `PhoneNumber` | `nvarchar(13)` | YES |  | Max length 13 |
| `PhoneNumberConfirmed` | `bit` | NO |  | Default False |
| `ReceiveEmailNotifications` | `bit` | NO |  | Identity/generated; Default True |
| `ReceiveOrderUpdates` | `bit` | NO |  | Identity/generated; Default True |
| `ReceivePromotions` | `bit` | NO |  | Identity/generated; Default True |
| `ReferralCode` | `nvarchar(20)` | YES |  | Max length 20 |
| `RefreshToken` | `nvarchar(max)` | YES |  |  |
| `RefreshTokenExpiryTime` | `datetime2` | YES |  |  |
| `RegisterDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `SecurityStamp` | `nvarchar(max)` | YES |  |  |
| `Status` | `bit` | NO |  | Default False |
| `TwoFactorEnabled` | `bit` | NO |  | Default False |
| `UserName` | `nvarchar(256)` | YES |  | Max length 256 |
| `WalletBalance` | `decimal(18,2)` | NO |  | Concurrency token; Default 0 |
| `WalletSignature` | `nvarchar(256)` | YES |  | Max length 256 |
| `WishlistShareToken` | `nvarchar(max)` | YES |  |  |

Index:
- `NormalizedEmail` (name `EmailIndex`)
- `NormalizedUserName` (unique; name `UserNameIndex`; filter `[NormalizedUserName] IS NOT NULL`)
- `RoleTemplateId` (name `IX_AspNetUsers_RoleTemplateId`)

### `AspNetUserTokens`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `UserId` | `nvarchar(450)` | NO | PK, FK |  |
| `LoginProvider` | `nvarchar(450)` | NO | PK |  |
| `Name` | `nvarchar(450)` | NO | PK |  |
| `Value` | `nvarchar(max)` | YES |  |  |

### `BabyProfiles`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `BabyProfileID` | `int` | NO | PK | Identity/generated; Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `DateOfBirth` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `FavoriteColors` | `nvarchar(200)` | YES |  | Max length 200 |
| `Gender` | `nvarchar(20)` | YES |  | Max length 20 |
| `HeightCm` | `float` | YES |  |  |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |
| `Relationship` | `nvarchar(50)` | YES |  | Max length 50 |
| `WeightKg` | `float` | YES |  |  |
| `GrowthRecords` | `nvarchar(max)` | YES |  | JSON owned type |
| `VaccinationRecords` | `nvarchar(max)` | YES |  | JSON owned type |

Index:
- `UserID` (name `IX_BabyProfiles_UserID`)

### `BalanceTransactions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `InvoiceID` | `int` | YES | FK |  |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `Amount` | `decimal(18,2)` | NO |  | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Direction` | `int` | NO |  | Default 0 |
| `HashSignature` | `nvarchar(256)` | NO |  | Max length 256 |
| `IdempotencyKey` | `nvarchar(200)` | NO |  | Max length 200 |
| `Reason` | `nvarchar(255)` | NO |  | Max length 255 |
| `SourceType` | `int` | NO |  | Default 0 |

Index:
- `InvoiceID` (name `IX_BalanceTransactions_InvoiceID`)
- `UserID` (name `IX_BalanceTransactions_UserID`)

### `Banners`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(max)` | YES |  |  |
| `HasUnpublishedChanges` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |
| `Page` | `nvarchar(50)` | NO |  | Max length 50 |
| `Position` | `nvarchar(50)` | NO |  | Max length 50 |
| `PublishedAt` | `datetime2` | YES |  |  |
| `Status` | `nvarchar(20)` | NO |  | Max length 20 |
| `Type` | `nvarchar(50)` | NO |  | Max length 50 |
| `UpdatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Version` | `nvarchar(50)` | NO |  | Max length 50 |
| `DraftConfig` | `nvarchar(max)` | YES |  | JSON owned type |
| `LayoutConfig` | `nvarchar(max)` | YES |  | JSON owned type |

Index:
- `Position` (name `IX_Banners_Position`)
- `Status` (name `IX_Banners_Status`)

### `BannerVersions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `BannerId` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(max)` | YES |  |  |
| `Version` | `nvarchar(50)` | NO |  | Max length 50 |
| `LayoutConfig` | `nvarchar(max)` | YES |  | JSON owned type |

Index:
- `BannerId` (name `IX_BannerVersions_BannerId`)

### `BundleItems`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `BundleItemID` | `int` | NO | PK | Identity/generated; Default 0 |
| `BundleID` | `int` | NO | FK | Default 0 |
| `VariantID` | `int` | NO | FK | Default 0 |
| `Quantity` | `int` | NO |  | Default 0 |
| `SortOrder` | `int` | NO |  | Default 0 |

Index:
- `BundleID` (name `IX_BundleItems_BundleID`)
- `VariantID` (name `IX_BundleItems_VariantID`)

### `Bundles`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `BundleID` | `int` | NO | PK | Identity/generated; Default 0 |
| `Code` | `nvarchar(10)` | YES |  | Max length 10 |
| `CreatedBy` | `nvarchar(450)` | YES |  | Max length 450 |
| `CreatedDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Description` | `nvarchar(500)` | NO |  | Max length 500 |
| `DiscountPercent` | `decimal(5,2)` | NO |  | Default 0 |
| `ImageUrl` | `nvarchar(max)` | YES |  |  |
| `Name` | `nvarchar(300)` | NO |  | Max length 300 |
| `OriginalPrice` | `decimal(18,2)` | YES |  |  |
| `Price` | `decimal(18,2)` | YES |  |  |
| `Status` | `bit` | NO |  | Default False |
| `UpdatedBy` | `nvarchar(450)` | YES |  | Max length 450 |
| `UpdatedDate` | `datetime2` | YES |  |  |

### `CartDetails`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `CartDetailID` | `int` | NO | PK | Identity/generated; Default 0 |
| `BundleID` | `int` | YES | FK |  |
| `CartID` | `int` | NO | FK | Default 0 |
| `VariantID` | `int` | YES | FK |  |
| `IsGift` | `bit` | NO |  | Default False |
| `Quantity` | `int` | NO |  | Default 0 |
| `TotalPrice` | `decimal(18,2)` | NO |  | Default 0 |
| `UnitPrice` | `decimal(18,2)` | NO |  | Default 0 |

Index:
- `BundleID` (name `IX_CartDetails_BundleID`)
- `CartID` (name `IX_CartDetails_CartID`)
- `VariantID` (name `IX_CartDetails_VariantID`)

### `Carts`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `CartID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ShippingVoucherID` | `int` | YES | FK |  |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `VoucherID` | `int` | YES | FK |  |
| `CreatedDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `DiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `ShippingDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `Status` | `bit` | NO |  | Default False |
| `SubTotal` | `decimal(18,2)` | NO |  | Default 0 |
| `TierDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `TotalAmount` | `decimal(18,2)` | NO |  | Default 0 |

Index:
- `ShippingVoucherID` (name `IX_Carts_ShippingVoucherID`)
- `UserID` (name `IX_Carts_UserID`)
- `VoucherID` (name `IX_Carts_VoucherID`)

### `Categories`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `CategoryID` | `int` | NO | PK | Identity/generated; Default 0 |
| `CategoryName` | `nvarchar(100)` | NO |  | Max length 100 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(100)` | NO |  | Max length 100 |
| `Description` | `nvarchar(500)` | NO |  | Max length 500 |
| `Level` | `int` | NO |  | Default 0 |
| `ParentID` | `int` | YES |  |  |
| `SortOrder` | `nvarchar(50)` | NO |  | Max length 50 |
| `Status` | `bit` | NO |  | Default False |

### `ChatMessages`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `ChatSessionId` | `nvarchar(450)` | NO | FK |  |
| `SenderId` | `nvarchar(450)` | YES | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `ImageUrl` | `nvarchar(500)` | YES |  | Max length 500 |
| `IsFromAdmin` | `bit` | NO |  | Default False |
| `MessageText` | `nvarchar(max)` | YES |  |  |
| `SenderName` | `nvarchar(100)` | NO |  | Max length 100 |

Index:
- `ChatSessionId` (name `IX_ChatMessages_ChatSessionId`)
- `SenderId` (name `IX_ChatMessages_SenderId`)

### `ChatSessions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `nvarchar(450)` | NO | PK |  |
| `AdminId` | `nvarchar(450)` | YES | FK |  |
| `UserId` | `nvarchar(450)` | YES | FK |  |
| `AdminName` | `nvarchar(100)` | YES |  | Max length 100 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CustomerName` | `nvarchar(100)` | NO |  | Max length 100 |
| `IsClosed` | `bit` | NO |  | Default False |
| `IsWaitingForSupport` | `bit` | NO |  | Default False |
| `LastMessageText` | `nvarchar(500)` | YES |  | Max length 500 |
| `UnreadByAdmin` | `int` | NO |  | Default 0 |
| `UnreadByCustomer` | `int` | NO |  | Default 0 |
| `UpdatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

Index:
- `AdminId` (name `IX_ChatSessions_AdminId`)
- `UserId` (name `IX_ChatSessions_UserId`)

### `Districts`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `DistrictID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ProvinceID` | `int` | NO | FK | Default 0 |
| `ApiVersion` | `nvarchar(10)` | NO |  | Max length 10 |
| `Code` | `nvarchar(20)` | NO |  | Max length 20 |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |
| `Note` | `nvarchar(max)` | YES |  |  |
| `ReplacedByCode` | `nvarchar(20)` | YES |  | Max length 20 |

Index:
- `ProvinceID` (name `IX_Districts_ProvinceID`)

### `FlashSaleItems`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `FlashSaleId` | `int` | NO | FK | Default 0 |
| `DiscountPrice` | `decimal(18,2)` | NO |  | Default 0 |
| `DiscountType` | `int` | NO |  | Default FixedPrice |
| `GiftVariantIds` | `nvarchar(max)` | YES |  |  |
| `ItemType` | `int` | NO |  | Default 0 |
| `MaxQuantityPerUser` | `int` | NO |  | Default 0 |
| `ReferenceId` | `int` | NO |  | Default 0 |
| `RequiredQuantity` | `int` | NO |  | Default 0 |
| `SoldQuantity` | `int` | NO |  | Default 0 |
| `TotalQuantity` | `int` | NO |  | Default 0 |

Index:
- `FlashSaleId` (name `IX_FlashSaleItems_FlashSaleId`)

### `FlashSales`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `BannerUrl` | `nvarchar(1000)` | YES |  | Max length 1000 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(100)` | YES |  | Max length 100 |
| `Description` | `nvarchar(max)` | YES |  |  |
| `EndTime` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(200)` | NO |  | Max length 200 |
| `StartTime` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Status` | `int` | NO |  | Default Upcoming |
| `Type` | `int` | NO |  | Default FlashSale |

### `InvoiceDetails`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `InvoiceDetailID` | `int` | NO | PK | Identity/generated; Default 0 |
| `BundleID` | `int` | YES | FK |  |
| `InvoiceID` | `int` | NO | FK | Default 0 |
| `VariantID` | `int` | YES | FK |  |
| `Quantity` | `int` | NO |  | Default 0 |
| `TotalPrice` | `decimal(18,2)` | NO |  | Default 0 |
| `UnitPrice` | `decimal(18,2)` | NO |  | Default 0 |

Index:
- `BundleID` (name `IX_InvoiceDetails_BundleID`)
- `InvoiceID` (name `IX_InvoiceDetails_InvoiceID`)
- `VariantID` (name `IX_InvoiceDetails_VariantID`)

### `Invoices`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `InvoiceID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ShippingVoucherID` | `int` | YES | FK |  |
| `UserID` | `nvarchar(450)` | YES | FK |  |
| `VoucherID` | `int` | YES | FK |  |
| `AmountToPay` | `decimal(18,2)` | NO |  | Default 0 |
| `CancelledAt` | `datetime2` | YES |  |  |
| `CancelReason` | `nvarchar(500)` | YES |  | Max length 500 |
| `CancelRefundMethod` | `int` | YES |  |  |
| `CoinsDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `CompletedAt` | `datetime2` | YES |  |  |
| `ConfirmedAt` | `datetime2` | YES |  |  |
| `CreatedAt` | `datetime2` | YES |  |  |
| `DiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `InvoiceCode` | `nvarchar(50)` | YES |  | Max length 50 |
| `IsDeleted` | `bit` | NO |  | Default False |
| `IsRefunded` | `bit` | NO |  | Default False |
| `IsReturnReceived` | `bit` | NO |  | Default False |
| `Note` | `nvarchar(500)` | YES |  | Max length 500 |
| `PayMethod` | `int` | YES |  |  |
| `PointsDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `PrintTicketUrl` | `nvarchar(max)` | YES |  |  |
| `RefundedAt` | `datetime2` | YES |  |  |
| `RefundMethod` | `int` | YES |  |  |
| `ReturnDescription` | `nvarchar(1000)` | YES |  | Max length 1000 |
| `ReturnImageUrls` | `nvarchar(max)` | YES |  |  |
| `ReturnReason` | `nvarchar(max)` | YES |  |  |
| `ShippedAt` | `datetime2` | YES |  |  |
| `ShippingAddress` | `nvarchar(500)` | YES |  | Max length 500 |
| `ShippingDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `ShippingDistrict` | `nvarchar(100)` | YES |  | Max length 100 |
| `ShippingFee` | `decimal(18,2)` | NO |  | Default 0 |
| `ShippingPhone` | `nvarchar(15)` | YES |  | Max length 15 |
| `ShippingProvince` | `nvarchar(100)` | YES |  | Max length 100 |
| `ShippingRecipientName` | `nvarchar(100)` | YES |  | Max length 100 |
| `ShippingStreetAddress` | `nvarchar(500)` | YES |  | Max length 500 |
| `ShippingWard` | `nvarchar(100)` | YES |  | Max length 100 |
| `Status` | `int` | NO |  | Default Pending |
| `SubTotal` | `decimal(18,2)` | NO |  | Default 0 |
| `TierDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `TotalPrice` | `decimal(18,2)` | NO |  | Default 0 |
| `TrackingCode` | `nvarchar(50)` | YES |  | Max length 50 |
| `VoucherDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `WalletDiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |

Index:
- `ShippingVoucherID` (name `IX_Invoices_ShippingVoucherID`)
- `UserID` (name `IX_Invoices_UserID`)
- `VoucherID` (name `IX_Invoices_VoucherID`)

### `LoyaltyAuditLogs`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `LogID` | `bigint` | NO | PK | Identity/generated; Default 0 |
| `Action` | `nvarchar(50)` | NO |  | Max length 50 |
| `ActorEmail` | `nvarchar(256)` | NO |  | Max length 256 |
| `ActorID` | `nvarchar(450)` | NO |  | Max length 450 |
| `EntityID` | `nvarchar(100)` | NO |  | Max length 100 |
| `EntityName` | `nvarchar(100)` | NO |  | Max length 100 |
| `NewValue` | `nvarchar(max)` | YES |  |  |
| `Notes` | `nvarchar(1000)` | YES |  | Max length 1000 |
| `OldValue` | `nvarchar(max)` | YES |  |  |
| `Timestamp` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

### `LoyaltyBirthdayGiftLogs`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `GiftLogID` | `int` | NO | PK | Identity/generated; Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK | Max length 450 |
| `GiftType` | `nvarchar(50)` | NO |  | Max length 50 |
| `GiftValue` | `nvarchar(200)` | NO |  | Max length 200 |
| `IssuedBy` | `nvarchar(256)` | NO |  | Max length 256 |
| `ReceivedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Year` | `int` | NO |  | Default 0 |

Index:
- `UserID` (name `IX_LoyaltyBirthdayGiftLogs_UserID`)

### `LoyaltyEarnPolicies`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `PolicyID` | `int` | NO | PK | Identity/generated; Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(256)` | NO |  | Max length 256 |
| `EndDate` | `datetime2` | YES |  |  |
| `IsActive` | `bit` | NO |  | Default False |
| `IsCampaign` | `bit` | NO |  | Default False |
| `Multiplier` | `decimal(5,2)` | NO |  | Default 0 |
| `Name` | `nvarchar(200)` | NO |  | Max length 200 |
| `PointsEarned` | `int` | NO |  | Default 0 |
| `StartDate` | `datetime2` | YES |  |  |
| `VndAmount` | `decimal(18,2)` | NO |  | Default 0 |

### `LoyaltyManualRevocations`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `RevocationID` | `int` | NO | PK | Identity/generated; Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `Amount` | `int` | NO |  | Default 0 |
| `AuditorID` | `nvarchar(450)` | NO |  | Max length 450 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Reason` | `nvarchar(500)` | NO |  | Max length 500 |

Index:
- `UserID` (name `IX_LoyaltyManualRevocations_UserID`)

### `LoyaltyMonthlyVouchers`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `VoucherConfigID` | `int` | NO | PK | Identity/generated; Default 0 |
| `TierID` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `DiscountType` | `int` | NO |  | Default 0 |
| `DiscountValue` | `decimal(18,2)` | NO |  | Default 0 |
| `IsActive` | `bit` | NO |  | Default False |
| `MaxDiscount` | `decimal(18,2)` | NO |  | Default 0 |
| `MinOrderValue` | `decimal(18,2)` | NO |  | Default 0 |
| `ValidityDays` | `int` | NO |  | Default 0 |
| `VoucherCount` | `int` | NO |  | Default 0 |

Index:
- `TierID` (name `IX_LoyaltyMonthlyVouchers_TierID`)

### `LoyaltyPointHistories`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `HistoryID` | `bigint` | NO | PK | Identity/generated; Default 0 |
| `InvoiceID` | `int` | YES | FK |  |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `Amount` | `int` | NO |  | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Description` | `nvarchar(500)` | NO |  | Max length 500 |
| `TransactionType` | `nvarchar(20)` | NO |  | Max length 20 |

Index:
- `InvoiceID` (name `IX_LoyaltyPointHistories_InvoiceID`)
- `UserID`, `CreatedAt` (name `IX_LoyaltyPointHistories_UserID_CreatedAt`)

### `LoyaltyProfiles`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `UserID` | `nvarchar(450)` | NO | PK, FK |  |
| `CurrentTierID` | `int` | NO | FK | Default 0 |
| `AvailablePoints` | `int` | NO |  | Default 0 |
| `CurrentCheckInStreak` | `int` | NO |  | Default 0 |
| `LastCheckInDate` | `datetime2` | YES |  |  |
| `LastUpdated` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `PointsToNextTier` | `int` | NO |  | Default 0 |
| `RankAdjustmentOffset` | `int` | NO |  | Default 0 |
| `TotalPoints` | `int` | NO |  | Default 0 |

Index:
- `CurrentTierID` (name `IX_LoyaltyProfiles_CurrentTierID`)

### `LoyaltyRedeemPolicies`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `PolicyID` | `int` | NO | PK | Identity/generated; Default 0 |
| `TierID` | `int` | YES | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(256)` | NO |  | Max length 256 |
| `DiscountVnd` | `decimal(18,2)` | NO |  | Default 0 |
| `EndDate` | `datetime2` | YES |  |  |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(200)` | NO |  | Max length 200 |
| `PointsToRedeem` | `int` | NO |  | Default 0 |
| `StartDate` | `datetime2` | YES |  |  |

Index:
- `TierID` (name `IX_LoyaltyRedeemPolicies_TierID`)

### `LoyaltySettings`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `AllowEditReviewTimeLimitMinutes` | `int` | NO |  | Default 0 |
| `AllowMultipleRewardsPerProduct` | `bit` | NO |  | Default False |
| `EnableReviewReward` | `bit` | NO |  | Default False |
| `MaxReviewDaysAfterReceipt` | `int` | NO |  | Default 0 |
| `MinimumReviewChars` | `int` | NO |  | Default 0 |
| `MinimumReviewWords` | `int` | NO |  | Default 0 |
| `RequireDeliveryToReview` | `bit` | NO |  | Default False |
| `RequiredRatingForReward` | `int` | NO |  | Default 0 |
| `ReviewRewardPoints` | `int` | NO |  | Default 0 |
| `ReviewWithImageRewardPoints` | `int` | NO |  | Default 0 |
| `ReviewWithVideoRewardPoints` | `int` | NO |  | Default 0 |
| `UpdatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `WelcomeVoucherID` | `int` | YES |  |  |

### `LoyaltyTierPrivileges`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `PrivilegeID` | `int` | NO | PK | Identity/generated; Default 0 |
| `TierID` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(256)` | NO |  | Max length 256 |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(200)` | NO |  | Max length 200 |
| `PrivilegeType` | `nvarchar(50)` | NO |  | Max length 50 |
| `Value` | `nvarchar(500)` | YES |  | Max length 500 |

Index:
- `TierID` (name `IX_LoyaltyTierPrivileges_TierID`)

### `LoyaltyTiers`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `TierID` | `int` | NO | PK | Identity/generated; Default 0 |
| `BadgeIcon` | `nvarchar(200)` | NO |  | Max length 200 |
| `ColorHex` | `nvarchar(50)` | NO |  | Max length 50 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IsActive` | `bit` | NO |  | Default False |
| `MinPoints` | `int` | NO |  | Default 0 |
| `TierName` | `nvarchar(100)` | NO |  | Max length 100 |
| `UpdatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

### `LoyaltyVoucherRedemptionHistories`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `UserVoucherID` | `int` | YES | FK |  |
| `VoucherID` | `int` | NO | FK | Default 0 |
| `PeriodKey` | `nvarchar(20)` | NO |  | Max length 20 |
| `PointCost` | `int` | NO |  | Default 0 |
| `RedeemedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

Index:
- `UserID` (name `IX_LoyaltyVoucherRedemptionHistories_UserID`)
- `UserVoucherID` (name `IX_LoyaltyVoucherRedemptionHistories_UserVoucherID`)
- `VoucherID` (name `IX_LoyaltyVoucherRedemptionHistories_VoucherID`)

### `LoyaltyVoucherRedemptions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `TierID` | `int` | YES | FK |  |
| `VoucherID` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `EndDate` | `datetime2` | YES |  |  |
| `IsActive` | `bit` | NO |  | Default False |
| `LimitPerUserPerPeriod` | `int` | YES |  |  |
| `PointCost` | `int` | NO |  | Default 0 |
| `ResetCycle` | `int` | NO |  | Default None |
| `ResetDayOfMonth` | `int` | YES |  |  |
| `StartDate` | `datetime2` | YES |  |  |
| `TotalQuotaPerPeriod` | `int` | YES |  |  |
| `UpdatedAt` | `datetime2` | YES |  |  |

Index:
- `TierID` (name `IX_LoyaltyVoucherRedemptions_TierID`)
- `VoucherID` (name `IX_LoyaltyVoucherRedemptions_VoucherID`)

### `Notifications`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `ActionType` | `int` | NO |  | Default None |
| `ActionUrl` | `nvarchar(500)` | YES |  | Max length 500 |
| `BannerImage` | `nvarchar(500)` | YES |  | Max length 500 |
| `Code` | `nvarchar(50)` | NO |  | Max length 50 |
| `Content` | `nvarchar(max)` | NO |  |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(100)` | YES |  | Max length 100 |
| `CustomTypeName` | `nvarchar(100)` | YES |  | Max length 100 |
| `ExpiredAt` | `datetime2` | YES |  |  |
| `HangfireJobId` | `nvarchar(100)` | YES |  | Max length 100 |
| `IsDeleted` | `bit` | NO |  | Default False |
| `IsPinned` | `bit` | NO |  | Default False |
| `Priority` | `int` | NO |  | Default Low |
| `PublishedAt` | `datetime2` | YES |  |  |
| `ShortDescription` | `nvarchar(500)` | NO |  | Max length 500 |
| `Status` | `int` | NO |  | Default Draft |
| `TargetType` | `int` | NO |  | Default All |
| `TargetValue` | `nvarchar(max)` | YES |  |  |
| `ThumbnailImage` | `nvarchar(500)` | YES |  | Max length 500 |
| `Title` | `nvarchar(200)` | NO |  | Max length 200 |
| `Type` | `int` | NO |  | Default System |
| `UpdatedAt` | `datetime2` | YES |  |  |

Index:
- `Code` (unique; name `IX_Notifications_Code`)
- `Status` (name `IX_Notifications_Status`)

### `NotificationTemplates`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IsActive` | `bit` | NO |  | Default False |
| `TemplateCode` | `nvarchar(50)` | NO |  | Max length 50 |
| `TemplateContent` | `nvarchar(max)` | NO |  |  |
| `TemplateName` | `nvarchar(100)` | NO |  | Max length 100 |
| `UpdatedAt` | `datetime2` | YES |  |  |

Index:
- `TemplateCode` (unique; name `IX_NotificationTemplates_TemplateCode`)

### `PaymentTransactions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `PaymentTransactionId` | `int` | NO | PK | Identity/generated; Default 0 |
| `InvoiceID` | `int` | NO | FK | Default 0 |
| `Amount` | `decimal(18,2)` | NO |  | Default 0 |
| `CompletedAt` | `datetime2` | YES |  |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `FailedAt` | `datetime2` | YES |  |  |
| `FailureReason` | `nvarchar(500)` | YES |  | Max length 500 |
| `PaidAt` | `datetime2` | YES |  |  |
| `Provider` | `nvarchar(50)` | NO |  | Max length 50 |
| `RawQuery` | `nvarchar(2000)` | YES |  | Max length 2000 |
| `ResponseCode` | `nvarchar(10)` | YES |  | Max length 10 |
| `Status` | `int` | NO |  | Default Pending |
| `TxnRef` | `nvarchar(50)` | NO |  | Max length 50 |
| `VnPayTransactionNo` | `nvarchar(50)` | YES |  | Max length 50 |

Index:
- `InvoiceID` (name `IX_PaymentTransactions_InvoiceID`)

### `Permissions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `Action` | `nvarchar(50)` | NO |  | Max length 50 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Description` | `nvarchar(255)` | NO |  | Max length 255 |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |
| `Resource` | `nvarchar(50)` | NO |  | Max length 50 |

Index:
- `Name` (unique; name `IX_Permissions_Name`)

### `ProductAlerts`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `ProductId` | `int` | NO | FK | Default 0 |
| `UserId` | `nvarchar(450)` | NO | FK |  |
| `VariantId` | `int` | YES | FK |  |
| `AlertType` | `int` | NO |  | Default PriceDrop |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IsActive` | `bit` | NO |  | Default False |
| `LastNotifiedAt` | `datetime2` | YES |  |  |
| `TargetPrice` | `decimal(18,2)` | YES |  |  |

Index:
- `ProductId`, `IsActive` (name `IX_ProductAlerts_ProductId_IsActive`)
- `UserId` (name `IX_ProductAlerts_UserId`)
- `VariantId` (name `IX_ProductAlerts_VariantId`)

### `ProductImages`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ProductImageID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ProductID` | `int` | NO | FK | Default 0 |
| `DisplayOrder` | `int` | NO |  | Default 0 |
| `ImageUrl` | `nvarchar(max)` | NO |  |  |

Index:
- `ProductID` (name `IX_ProductImages_ProductID`)

### `ProductOptions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ProductOptionID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ProductID` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | YES |  |  |
| `CreatedBy` | `nvarchar(100)` | NO |  | Max length 100 |
| `DisplayOrder` | `int` | NO |  | Default 0 |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |

Index:
- `ProductID` (name `IX_ProductOptions_ProductID`)

### `ProductOptionValues`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ProductOptionValueID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ProductOptionID` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | YES |  |  |
| `CreatedBy` | `nvarchar(100)` | NO |  | Max length 100 |
| `DisplayOrder` | `int` | NO |  | Default 0 |
| `IsDeleted` | `bit` | NO |  | Default False |
| `Price` | `decimal(18,2)` | NO |  | Default 0 |
| `Value` | `nvarchar(50)` | NO |  | Max length 50 |

Index:
- `ProductOptionID` (name `IX_ProductOptionValues_ProductOptionID`)

### `Products`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ProductID` | `int` | NO | PK | Identity/generated; Default 0 |
| `CategoryID` | `int` | NO | FK | Default 0 |
| `SupplierID` | `int` | NO | FK | Default 0 |
| `AverageRating` | `float` | NO |  | Default 0 |
| `Code` | `nvarchar(50)` | NO |  | Max length 50 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(max)` | NO |  |  |
| `Description` | `nvarchar(max)` | NO |  |  |
| `IsDeleted` | `bit` | NO |  | Default False |
| `MetaDescription` | `nvarchar(500)` | YES |  | Max length 500 |
| `MetaTitle` | `nvarchar(255)` | YES |  | Max length 255 |
| `Price` | `decimal(18,2)` | NO |  | Default 0 |
| `ProductDiscountPercent` | `decimal(5,2)` | NO |  | Default 0 |
| `ProductName` | `nvarchar(200)` | NO |  | Max length 200 |
| `ReviewCount` | `int` | NO |  | Default 0 |
| `Slug` | `nvarchar(255)` | YES |  | Max length 255 |
| `Specifications` | `nvarchar(max)` | YES |  |  |
| `Status` | `bit` | NO |  | Default False |
| `Stock` | `int` | NO |  | Default 0 |
| `SupportsSubscription` | `bit` | NO |  | Default False |

Index:
- `CategoryID` (name `IX_Products_CategoryID`)
- `Code` (unique; name `IX_Products_Code`; filter `[IsDeleted] = 0`)
- `Slug` (unique; name `IX_Products_Slug`; filter `[Slug] IS NOT NULL`)
- `SupplierID` (name `IX_Products_SupplierID`)

### `Provinces`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ProvinceID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ApiVersion` | `nvarchar(10)` | NO |  | Max length 10 |
| `Code` | `nvarchar(20)` | NO |  | Max length 20 |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |
| `Note` | `nvarchar(max)` | YES |  |  |
| `ReplacedByCode` | `nvarchar(20)` | YES |  | Max length 20 |

### `ReferralRecords`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `ReferredUserId` | `nvarchar(450)` | NO | FK |  |
| `ReferrerId` | `nvarchar(450)` | NO | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `HasCompletedFirstOrder` | `bit` | NO |  | Default False |
| `IsPermanentlyActive` | `bit` | NO |  | Default False |

Index:
- `ReferredUserId` (name `IX_ReferralRecords_ReferredUserId`)
- `ReferrerId` (name `IX_ReferralRecords_ReferrerId`)

### `ReviewCensorshipLogs`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `LogID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ActorID` | `nvarchar(450)` | NO | FK | Max length 450 |
| `ReviewID` | `int` | NO | FK | Default 0 |
| `Action` | `nvarchar(50)` | NO |  | Max length 50 |
| `Reason` | `nvarchar(500)` | NO |  | Max length 500 |
| `Timestamp` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

Index:
- `ActorID` (name `IX_ReviewCensorshipLogs_ActorID`)
- `ReviewID` (name `IX_ReviewCensorshipLogs_ReviewID`)

### `ReviewComments`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `CommentID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ParentCommentID` | `int` | YES | FK |  |
| `ReviewID` | `int` | NO | FK | Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `Content` | `nvarchar(500)` | NO |  | Max length 500 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IsHidden` | `bit` | NO |  | Default False |

Index:
- `ParentCommentID` (name `IX_ReviewComments_ParentCommentID`)
- `ReviewID` (name `IX_ReviewComments_ReviewID`)
- `UserID` (name `IX_ReviewComments_UserID`)

### `ReviewLikes`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `LikeID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ReviewID` | `int` | NO | FK | Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

Index:
- `ReviewID` (name `IX_ReviewLikes_ReviewID`)
- `UserID` (name `IX_ReviewLikes_UserID`)

### `ReviewMedia`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `MediaID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ReviewID` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `MediaType` | `nvarchar(50)` | NO |  | Max length 50 |
| `Url` | `nvarchar(2048)` | NO |  | Max length 2048 |

Index:
- `ReviewID` (name `IX_ReviewMedia_ReviewID`)

### `Reviews`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ReviewID` | `int` | NO | PK | Identity/generated; Default 0 |
| `BundleID` | `int` | YES | FK |  |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `VariantID` | `int` | NO | FK | Default 0 |
| `AutoModerationStatus` | `nvarchar(max)` | YES |  |  |
| `CensorshipReason` | `nvarchar(max)` | YES |  |  |
| `Content` | `nvarchar(500)` | NO |  | Max length 500 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `FlaggedReason` | `nvarchar(max)` | YES |  |  |
| `HasEarnedRewardPoints` | `bit` | NO |  | Default False |
| `IsHidden` | `bit` | NO |  | Default False |
| `LoyaltyPointsEarned` | `int` | NO |  | Default 0 |
| `Rating` | `int` | NO |  | Default 0 |
| `UpdatedAt` | `datetime2` | YES |  |  |
| `ViolationScore` | `int` | NO |  | Default 0 |

Index:
- `BundleID` (name `IX_Reviews_BundleID`)
- `UserID` (name `IX_Reviews_UserID`)
- `VariantID` (name `IX_Reviews_VariantID`)

### `ReviewSensitiveKeywords`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `KeywordID` | `int` | NO | PK | Identity/generated; Default 0 |
| `Category` | `nvarchar(50)` | NO |  | Max length 50 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Severity` | `nvarchar(20)` | NO |  | Max length 20 |
| `Word` | `nvarchar(100)` | NO |  | Max length 100 |

### `RoleTemplates`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Description` | `nvarchar(255)` | NO |  | Max length 255 |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |

Index:
- `Name` (unique; name `IX_RoleTemplates_Name`)

### `SubscriptionPaymentHistories`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `HistoryID` | `int` | NO | PK | Identity/generated; Default 0 |
| `InvoiceID` | `int` | YES | FK |  |
| `SubscriptionID` | `int` | NO | FK | Default 0 |
| `Amount` | `decimal(18,2)` | NO |  | Default 0 |
| `CoinUsed` | `decimal(18,2)` | NO |  | Default 0 |
| `Message` | `nvarchar(max)` | YES |  |  |
| `PaymentDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `PaymentStatus` | `int` | NO |  | Default 0 |
| `WalletUsed` | `decimal(18,2)` | NO |  | Default 0 |

Index:
- `InvoiceID` (name `IX_SubscriptionPaymentHistories_InvoiceID`)
- `SubscriptionID` (name `IX_SubscriptionPaymentHistories_SubscriptionID`)

### `Subscriptions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `SubscriptionID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ProductID` | `int` | NO | FK | Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `VariantID` | `int` | YES | FK |  |
| `CompletedOccurrences` | `int` | NO |  | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `EndDate` | `datetime2` | YES |  |  |
| `FrequencyType` | `int` | NO |  | Default 0 |
| `FrequencyValue` | `int` | NO |  | Default 0 |
| `MaxOccurrences` | `int` | YES |  |  |
| `NextBillingDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Quantity` | `int` | NO |  | Default 0 |
| `ShippingAddressId` | `int` | NO |  | Default 0 |
| `StartDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Status` | `int` | NO |  | Default 0 |
| `SubscribedPrice` | `decimal(18,2)` | NO |  | Default 0 |
| `UpdatedAt` | `datetime2` | YES |  |  |

Index:
- `ProductID` (name `IX_Subscriptions_ProductID`)
- `UserID` (name `IX_Subscriptions_UserID`)
- `VariantID` (name `IX_Subscriptions_VariantID`)

### `Suppliers`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `SupplierID` | `int` | NO | PK | Identity/generated; Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(100)` | NO |  | Max length 100 |
| `Description` | `nvarchar(500)` | NO |  | Max length 500 |
| `Logo` | `nvarchar(max)` | NO |  |  |
| `Status` | `bit` | NO |  | Default False |
| `SupplierName` | `nvarchar(200)` | NO |  | Max length 200 |

### `TemplatePermissions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `PermissionId` | `int` | NO | PK, FK | Default 0 |
| `TemplateId` | `int` | NO | PK, FK | Default 0 |

Index:
- `PermissionId` (name `IX_TemplatePermissions_PermissionId`)

### `UserAddresses`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `AddressID` | `int` | NO | PK | Identity/generated; Default 0 |
| `DistrictID` | `int` | YES | FK |  |
| `ProvinceID` | `int` | NO | FK | Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `WardID` | `int` | YES | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IsDefault` | `bit` | NO |  | Default False |
| `PhoneNumber` | `nvarchar(15)` | NO |  | Max length 15 |
| `RecipientName` | `nvarchar(100)` | NO |  | Max length 100 |
| `StreetAddress` | `nvarchar(500)` | NO |  | Max length 500 |

Index:
- `DistrictID` (name `IX_UserAddresses_DistrictID`)
- `ProvinceID` (name `IX_UserAddresses_ProvinceID`)
- `UserID` (name `IX_UserAddresses_UserID`)
- `WardID` (name `IX_UserAddresses_WardID`)

### `UserNotifications`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `NotificationId` | `int` | NO | FK | Default 0 |
| `UserId` | `nvarchar(450)` | NO | FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IsDeleted` | `bit` | NO |  | Default False |
| `IsRead` | `bit` | NO |  | Default False |
| `ReadAt` | `datetime2` | YES |  |  |

Index:
- `NotificationId` (name `IX_UserNotifications_NotificationId`)
- `UserId`, `IsRead` (name `IX_UserNotifications_UserId_IsRead`)

### `UserPermissions`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `PermissionId` | `int` | NO | PK, FK | Default 0 |
| `UserId` | `nvarchar(450)` | NO | PK, FK |  |
| `GrantedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `GrantedBy` | `nvarchar(max)` | YES |  |  |
| `IsGranted` | `bit` | NO |  | Default False |

Index:
- `PermissionId` (name `IX_UserPermissions_PermissionId`)

### `UserVouchers`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `UserVoucherID` | `int` | NO | PK | Identity/generated; Default 0 |
| `InvoiceID` | `int` | YES | FK |  |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `VoucherID` | `int` | NO | FK | Default 0 |
| `CollectedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `IssuedCode` | `nvarchar(50)` | YES |  | Max length 50 |
| `SourceType` | `int` | NO |  | Default 0 |
| `Status` | `int` | NO |  | Default Unused |
| `UsedAt` | `datetime2` | YES |  |  |

Index:
- `InvoiceID` (name `IX_UserVouchers_InvoiceID`)
- `UserID`, `VoucherID`, `Status` (name `IX_UserVouchers_UserID_VoucherID_Status`)
- `VoucherID` (name `IX_UserVouchers_VoucherID`)

### `VariantOptionValues`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ProductOptionValueID` | `int` | NO | PK, FK | Default 0 |
| `VariantID` | `int` | NO | PK, FK | Default 0 |
| `VariantOptionValueID` | `int` | NO |  | Identity/generated; Default 0 |

Index:
- `ProductOptionValueID` (name `IX_VariantOptionValues_ProductOptionValueID`)

### `Variants`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `VariantID` | `int` | NO | PK | Identity/generated; Default 0 |
| `ProductID` | `int` | NO | FK | Default 0 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `CreatedBy` | `nvarchar(100)` | NO |  | Max length 100 |
| `Description` | `nvarchar(max)` | NO |  |  |
| `ImageUrl` | `nvarchar(max)` | YES |  |  |
| `IsDeleted` | `bit` | NO |  | Default False |
| `SKU` | `nvarchar(100)` | NO |  | Max length 100 |
| `Status` | `bit` | NO |  | Default False |
| `Stock` | `int` | NO |  | Concurrency token; Default 0 |
| `UnitPrice` | `decimal(18,2)` | NO |  | Default 0 |
| `VariantDiscountPercent` | `decimal(5,2)` | NO |  | Default 0 |
| `VariantName` | `nvarchar(300)` | NO |  | Max length 300 |

Index:
- `ProductID` (name `IX_Variants_ProductID`)
- `SKU` (unique; name `IX_Variants_SKU`; filter `[IsDeleted] = 0`)

### `Vouchers`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `VoucherID` | `int` | NO | PK | Identity/generated; Default 0 |
| `Code` | `nvarchar(50)` | NO |  | Max length 50 |
| `DiscountType` | `int` | NO |  | Default 0 |
| `DiscountValue` | `decimal(18,2)` | NO |  | Default 0 |
| `EndDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `ExclusiveType` | `int` | NO |  | Default None |
| `IsFreeShipping` | `bit` | NO |  | Default False |
| `MaxDiscount` | `decimal(18,2)` | NO |  | Default 0 |
| `MaxShippingDiscount` | `decimal(18,2)` | YES |  |  |
| `MinOrderValue` | `decimal(18,2)` | NO |  | Default 0 |
| `Name` | `nvarchar(200)` | NO |  | Max length 200 |
| `StartDate` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `Status` | `bit` | NO |  | Default False |
| `TotalQuantity` | `int` | NO |  | Default 0 |
| `UsageLimitPerUser` | `int` | NO |  | Default 0 |
| `UsedQuantity` | `int` | NO |  | Default 0 |
| `VisibilityType` | `int` | NO |  | Default 0 |
| `VoucherType` | `int` | NO |  | Default 0 |

### `VoucherUsages`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `Id` | `int` | NO | PK | Identity/generated; Default 0 |
| `CartID` | `int` | YES | FK |  |
| `InvoiceID` | `int` | YES | FK |  |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `VoucherID` | `int` | NO | FK | Default 0 |
| `DiscountAmount` | `decimal(18,2)` | NO |  | Default 0 |
| `OrderValue` | `decimal(18,2)` | NO |  | Default 0 |
| `UsedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

Index:
- `CartID` (name `IX_VoucherUsages_CartID`)
- `InvoiceID` (name `IX_VoucherUsages_InvoiceID`)
- `UserID` (name `IX_VoucherUsages_UserID`)
- `VoucherID` (name `IX_VoucherUsages_VoucherID`)

### `Wards`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `WardID` | `int` | NO | PK | Identity/generated; Default 0 |
| `DistrictID` | `int` | NO | FK | Default 0 |
| `ApiVersion` | `nvarchar(10)` | NO |  | Max length 10 |
| `Code` | `nvarchar(20)` | NO |  | Max length 20 |
| `IsActive` | `bit` | NO |  | Default False |
| `Name` | `nvarchar(100)` | NO |  | Max length 100 |
| `Note` | `nvarchar(max)` | YES |  |  |
| `ReplacedByCode` | `nvarchar(20)` | YES |  | Max length 20 |

Index:
- `DistrictID` (name `IX_Wards_DistrictID`)

### `Wishlists`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `ProductID` | `int` | NO | PK, FK | Default 0 |
| `UserID` | `nvarchar(450)` | NO | PK, FK |  |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |

Index:
- `ProductID` (name `IX_Wishlists_ProductID`)

### `WithdrawRequests`

| Cột | Kiểu vật lý | Null | Khóa | Ghi chú |
|---|---|---:|---|---|
| `RequestID` | `int` | NO | PK | Identity/generated; Default 0 |
| `UserID` | `nvarchar(450)` | NO | FK |  |
| `AdminNote` | `nvarchar(500)` | YES |  | Max length 500 |
| `Amount` | `decimal(18,2)` | NO |  | Default 0 |
| `BankAccount` | `nvarchar(50)` | NO |  | Max length 50 |
| `BankName` | `nvarchar(100)` | NO |  | Max length 100 |
| `BankOwnerName` | `nvarchar(100)` | NO |  | Max length 100 |
| `CreatedAt` | `datetime2` | NO |  | Default 01/01/0001 00:00:00 |
| `ProcessedAt` | `datetime2` | YES |  |  |
| `Status` | `nvarchar(50)` | NO |  | Max length 50 |

Index:
- `UserID` (name `IX_WithdrawRequests_UserID`)

## SQL Server - danh sách quan hệ FK

| Bảng cha | Bảng con | Cột FK | Bắt buộc | Delete behavior |
|---|---|---|---:|---|
| `AspNetRoles` | `AspNetRoleClaims` | `RoleId` | YES | `Cascade` |
| `AspNetRoles` | `AspNetUserRoles` | `RoleId` | YES | `Cascade` |
| `AspNetUsers` | `Address` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `AspNetUserClaims` | `UserId` | YES | `Cascade` |
| `AspNetUsers` | `AspNetUserLogins` | `UserId` | YES | `Cascade` |
| `AspNetUsers` | `AspNetUserRoles` | `UserId` | YES | `Cascade` |
| `AspNetUsers` | `AspNetUserTokens` | `UserId` | YES | `Cascade` |
| `AspNetUsers` | `BabyProfiles` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `BalanceTransactions` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `Carts` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `ChatMessages` | `SenderId` | NO | `SetNull` |
| `AspNetUsers` | `ChatSessions` | `AdminId` | NO | `NoAction` |
| `AspNetUsers` | `ChatSessions` | `UserId` | NO | `SetNull` |
| `AspNetUsers` | `Invoices` | `UserID` | NO | `SetNull` |
| `AspNetUsers` | `LoyaltyBirthdayGiftLogs` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `LoyaltyManualRevocations` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `LoyaltyProfiles` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `LoyaltyVoucherRedemptionHistories` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `ProductAlerts` | `UserId` | YES | `Cascade` |
| `AspNetUsers` | `ReferralRecords` | `ReferredUserId` | YES | `Restrict` |
| `AspNetUsers` | `ReferralRecords` | `ReferrerId` | YES | `Restrict` |
| `AspNetUsers` | `ReviewCensorshipLogs` | `ActorID` | YES | `Restrict` |
| `AspNetUsers` | `ReviewComments` | `UserID` | YES | `NoAction` |
| `AspNetUsers` | `ReviewLikes` | `UserID` | YES | `NoAction` |
| `AspNetUsers` | `Reviews` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `Subscriptions` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `UserAddresses` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `UserNotifications` | `UserId` | YES | `Cascade` |
| `AspNetUsers` | `UserPermissions` | `UserId` | YES | `Cascade` |
| `AspNetUsers` | `UserVouchers` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `VoucherUsages` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `Wishlists` | `UserID` | YES | `Cascade` |
| `AspNetUsers` | `WithdrawRequests` | `UserID` | YES | `Cascade` |
| `Banners` | `BannerVersions` | `BannerId` | YES | `Cascade` |
| `Bundles` | `BundleItems` | `BundleID` | YES | `Cascade` |
| `Bundles` | `CartDetails` | `BundleID` | NO | `ClientSetNull` |
| `Bundles` | `InvoiceDetails` | `BundleID` | NO | `ClientSetNull` |
| `Bundles` | `Reviews` | `BundleID` | NO | `ClientSetNull` |
| `Carts` | `CartDetails` | `CartID` | YES | `Cascade` |
| `Carts` | `VoucherUsages` | `CartID` | NO | `ClientSetNull` |
| `Categories` | `Products` | `CategoryID` | YES | `Cascade` |
| `ChatSessions` | `ChatMessages` | `ChatSessionId` | YES | `Cascade` |
| `Districts` | `UserAddresses` | `DistrictID` | NO | `NoAction` |
| `Districts` | `Wards` | `DistrictID` | YES | `Cascade` |
| `FlashSales` | `FlashSaleItems` | `FlashSaleId` | YES | `Cascade` |
| `Invoices` | `BalanceTransactions` | `InvoiceID` | NO | `ClientSetNull` |
| `Invoices` | `InvoiceDetails` | `InvoiceID` | YES | `Cascade` |
| `Invoices` | `LoyaltyPointHistories` | `InvoiceID` | NO | `SetNull` |
| `Invoices` | `PaymentTransactions` | `InvoiceID` | YES | `Cascade` |
| `Invoices` | `SubscriptionPaymentHistories` | `InvoiceID` | NO | `SetNull` |
| `Invoices` | `UserVouchers` | `InvoiceID` | NO | `ClientSetNull` |
| `Invoices` | `VoucherUsages` | `InvoiceID` | NO | `ClientSetNull` |
| `LoyaltyProfiles` | `LoyaltyPointHistories` | `UserID` | YES | `Cascade` |
| `LoyaltyTiers` | `LoyaltyMonthlyVouchers` | `TierID` | YES | `Cascade` |
| `LoyaltyTiers` | `LoyaltyProfiles` | `CurrentTierID` | YES | `Restrict` |
| `LoyaltyTiers` | `LoyaltyRedeemPolicies` | `TierID` | NO | `ClientSetNull` |
| `LoyaltyTiers` | `LoyaltyTierPrivileges` | `TierID` | YES | `Cascade` |
| `LoyaltyTiers` | `LoyaltyVoucherRedemptions` | `TierID` | NO | `ClientSetNull` |
| `Notifications` | `UserNotifications` | `NotificationId` | YES | `Cascade` |
| `Permissions` | `TemplatePermissions` | `PermissionId` | YES | `Cascade` |
| `Permissions` | `UserPermissions` | `PermissionId` | YES | `Cascade` |
| `ProductOptions` | `ProductOptionValues` | `ProductOptionID` | YES | `Cascade` |
| `ProductOptionValues` | `VariantOptionValues` | `ProductOptionValueID` | YES | `NoAction` |
| `Products` | `ProductAlerts` | `ProductId` | YES | `Cascade` |
| `Products` | `ProductImages` | `ProductID` | YES | `Cascade` |
| `Products` | `ProductOptions` | `ProductID` | YES | `Cascade` |
| `Products` | `Subscriptions` | `ProductID` | YES | `Cascade` |
| `Products` | `Variants` | `ProductID` | YES | `Cascade` |
| `Products` | `Wishlists` | `ProductID` | YES | `Cascade` |
| `Provinces` | `Districts` | `ProvinceID` | YES | `Cascade` |
| `Provinces` | `UserAddresses` | `ProvinceID` | YES | `NoAction` |
| `ReviewComments` | `ReviewComments` | `ParentCommentID` | NO | `ClientSetNull` |
| `Reviews` | `ReviewCensorshipLogs` | `ReviewID` | YES | `Cascade` |
| `Reviews` | `ReviewComments` | `ReviewID` | YES | `Cascade` |
| `Reviews` | `ReviewLikes` | `ReviewID` | YES | `Cascade` |
| `Reviews` | `ReviewMedia` | `ReviewID` | YES | `Cascade` |
| `RoleTemplates` | `AspNetUsers` | `RoleTemplateId` | NO | `SetNull` |
| `RoleTemplates` | `TemplatePermissions` | `TemplateId` | YES | `Cascade` |
| `Subscriptions` | `SubscriptionPaymentHistories` | `SubscriptionID` | YES | `Cascade` |
| `Suppliers` | `Products` | `SupplierID` | YES | `Cascade` |
| `UserVouchers` | `LoyaltyVoucherRedemptionHistories` | `UserVoucherID` | NO | `ClientSetNull` |
| `Variants` | `BundleItems` | `VariantID` | YES | `Cascade` |
| `Variants` | `CartDetails` | `VariantID` | NO | `ClientSetNull` |
| `Variants` | `InvoiceDetails` | `VariantID` | NO | `ClientSetNull` |
| `Variants` | `ProductAlerts` | `VariantId` | NO | `NoAction` |
| `Variants` | `Reviews` | `VariantID` | YES | `Cascade` |
| `Variants` | `Subscriptions` | `VariantID` | NO | `NoAction` |
| `Variants` | `VariantOptionValues` | `VariantID` | YES | `NoAction` |
| `Vouchers` | `Carts` | `ShippingVoucherID` | NO | `NoAction` |
| `Vouchers` | `Carts` | `VoucherID` | NO | `NoAction` |
| `Vouchers` | `Invoices` | `ShippingVoucherID` | NO | `NoAction` |
| `Vouchers` | `Invoices` | `VoucherID` | NO | `NoAction` |
| `Vouchers` | `LoyaltyVoucherRedemptionHistories` | `VoucherID` | YES | `Cascade` |
| `Vouchers` | `LoyaltyVoucherRedemptions` | `VoucherID` | YES | `Cascade` |
| `Vouchers` | `UserVouchers` | `VoucherID` | YES | `Cascade` |
| `Vouchers` | `VoucherUsages` | `VoucherID` | YES | `Cascade` |
| `Wards` | `UserAddresses` | `WardID` | NO | `NoAction` |

## MongoDB collections

Các collection này nằm trong `MongoDbService`. MongoDB không enforce FK vật lý, nên phần này ghi thực thể/document và thuộc tính, còn các liên kết sang SQL chỉ là liên kết logic theo id.

### `UserInteractions`

| Field | Kiểu | Null | Ghi chú |
|---|---|---:|---|
| `Id` | `string` | YES | BsonId/ObjectId |
| `CreatedAt` | `datetime` | NO |  |
| `InteractionType` | `InteractionType` | NO |  |
| `ProductId` | `int` | NO |  |
| `Score` | `float` | NO |  |
| `UserId` | `string` | YES |  |

### `KnowledgeArticles`

| Field | Kiểu | Null | Ghi chú |
|---|---|---:|---|
| `Id` | `string` | YES | BsonId/ObjectId |
| `Content` | `string` | YES |  |
| `CreatedAt` | `datetime` | NO |  |
| `Embedding` | `Single[]` | YES |  |
| `Title` | `string` | YES |  |

### `AuditLogs`

| Field | Kiểu | Null | Ghi chú |
|---|---|---:|---|
| `Id` | `string` | YES | BsonId/ObjectId |
| `Action` | `string` | YES |  |
| `Description` | `string` | YES |  |
| `EntityId` | `string` | YES |  |
| `EntityName` | `string` | YES |  |
| `IpAddress` | `string` | YES |  |
| `NewValues` | `string` | YES |  |
| `OldValues` | `string` | YES |  |
| `Timestamp` | `datetime` | NO |  |
| `UserId` | `string` | YES |  |

### `BlockedIps`

| Field | Kiểu | Null | Ghi chú |
|---|---|---:|---|
| `Id` | `string` | YES | BsonId/ObjectId |
| `BlockedAt` | `datetime` | NO |  |
| `ExpiresAt` | `datetime` | YES |  |
| `IpAddress` | `string` | YES |  |
| `IsActive` | `bool` | NO |  |
| `Reason` | `string` | YES |  |
| `RecentInvoices` | `List`1` | YES |  |
| `UserEmail` | `string` | YES |  |
| `UserId` | `string` | YES |  |

### `SecurityAuditLogs`

| Field | Kiểu | Null | Ghi chú |
|---|---|---:|---|
| `Id` | `string` | YES | BsonId/ObjectId |
| `ActionType` | `string` | YES |  |
| `CreatedAt` | `datetime` | NO |  |
| `Description` | `string` | YES |  |
| `IpAddress` | `string` | YES |  |
| `RequestCount` | `int` | NO |  |
| `UserId` | `string` | YES |  |

