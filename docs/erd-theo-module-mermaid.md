# ERD Theo Mo Dun - Mermaid

File nay gom cac so do ERD theo tung mo dun cua du an LazPe. Moi so do co thuoc tinh bang va quan he chinh, de khi dan vao Mermaid Live khong bi roi nhu ERD tong.

## 1. Mo Dun Tai Khoan, Phan Quyen Va Dia Chi

```mermaid
erDiagram
    AspNetUsers {
        string Id PK
        string FullName
        string Email
        string PhoneNumber
        decimal WalletBalance
        decimal CoinsBalance
        string Avatar
        bool Status
        datetime RegisterDate
        bool ReceiveEmailNotifications
        bool ReceiveOrderUpdates
        bool ReceivePromotions
        bool IsOnboarded
        string ReferralCode
        int RoleTemplateId FK
    }

    AspNetRoles {
        string Id PK
        string Name
        string NormalizedName
        string ConcurrencyStamp
    }

    AspNetUserRoles {
        string UserId PK, FK
        string RoleId PK, FK
    }

    AspNetUserClaims {
        int Id PK
        string UserId FK
        string ClaimType
        string ClaimValue
    }

    AspNetRoleClaims {
        int Id PK
        string RoleId FK
        string ClaimType
        string ClaimValue
    }

    AspNetUserLogins {
        string LoginProvider PK
        string ProviderKey PK
        string ProviderDisplayName
        string UserId FK
    }

    AspNetUserTokens {
        string UserId PK, FK
        string LoginProvider PK
        string Name PK
        string Value
    }

    RoleTemplates {
        int Id PK
        string Name
        string Description
        bool IsActive
        datetime CreatedAt
    }

    Permissions {
        int Id PK
        string Name
        string Description
        string Resource
        string Action
    }

    UserPermissions {
        string UserId PK, FK
        int PermissionId PK, FK
        bool IsGranted
        datetime GrantedAt
        string GrantedBy
    }

    TemplatePermissions {
        int TemplateId PK, FK
        int PermissionId PK, FK
    }

    Provinces {
        int ProvinceID PK
        string Name
        string Code
        bool IsActive
        string ReplacedByCode
        string Note
        string ApiVersion
    }

    Districts {
        int DistrictID PK
        string Name
        string Code
        int ProvinceID FK
        bool IsActive
        string ReplacedByCode
        string Note
        string ApiVersion
    }

    Wards {
        int WardID PK
        string Name
        string Code
        int DistrictID FK
        bool IsActive
        string ReplacedByCode
        string Note
        string ApiVersion
    }

    UserAddresses {
        int AddressID PK
        string UserID FK
        int ProvinceID FK
        int DistrictID FK
        int WardID FK
        string RecipientName
        string PhoneNumber
        string StreetAddress
        bool IsDefault
        datetime CreatedAt
    }

    Addresses {
        int AddressID PK
        string UserID FK
        string RecipientName
        string PhoneNumber
        string Province
        string District
        string Ward
        string DetailAddress
        bool IsDefault
        datetime CreatedAt
    }

    AspNetUsers ||--o{ AspNetUserRoles : ""
    AspNetRoles ||--o{ AspNetUserRoles : ""
    AspNetUsers ||--o{ AspNetUserClaims : ""
    AspNetRoles ||--o{ AspNetRoleClaims : ""
    AspNetUsers ||--o{ AspNetUserLogins : ""
    AspNetUsers ||--o{ AspNetUserTokens : ""
    RoleTemplates ||--o{ AspNetUsers : ""
    AspNetUsers ||--o{ UserPermissions : ""
    Permissions ||--o{ UserPermissions : ""
    RoleTemplates ||--o{ TemplatePermissions : ""
    Permissions ||--o{ TemplatePermissions : ""
    Provinces ||--o{ Districts : ""
    Districts ||--o{ Wards : ""
    AspNetUsers ||--o{ UserAddresses : ""
    Provinces ||--o{ UserAddresses : ""
    Districts ||--o{ UserAddresses : ""
    Wards ||--o{ UserAddresses : ""
    AspNetUsers ||--o{ Addresses : ""
```

## 2. Mo Dun San Pham, Bien The Va Combo

```mermaid
erDiagram
    Categories {
        int CategoryID PK
        string CategoryName
        int ParentID
        int Level
        string SortOrder
        string Description
        datetime CreatedAt
        string CreatedBy
        bool Status
    }

    Suppliers {
        int SupplierID PK
        string SupplierName
        string Logo
        string Description
        string CreatedBy
        datetime CreatedAt
        bool Status
    }

    Products {
        int ProductID PK
        int CategoryID FK
        int SupplierID FK
        string Code
        string ProductName
        string Description
        string Specifications
        decimal Price
        decimal ProductDiscountPercent
        int Stock
        bool Status
        datetime CreatedAt
        string CreatedBy
        string Slug
        string MetaTitle
        string MetaDescription
        double AverageRating
        int ReviewCount
        bool IsDeleted
        bool SupportsSubscription
    }

    ProductImages {
        int ProductImageID PK
        int ProductID FK
        string ImageUrl
        int DisplayOrder
    }

    ProductOptions {
        int ProductOptionID PK
        int ProductID FK
        string Name
        int DisplayOrder
        datetime CreatedAt
        string CreatedBy
    }

    ProductOptionValues {
        int ProductOptionValueID PK
        int ProductOptionID FK
        string Value
        int DisplayOrder
        decimal Price
        datetime CreatedAt
        string CreatedBy
        bool IsDeleted
    }

    Variants {
        int VariantID PK
        int ProductID FK
        string VariantName
        decimal UnitPrice
        decimal VariantDiscountPercent
        int Stock
        string SKU
        string ImageUrl
        string Description
        datetime CreatedAt
        string CreatedBy
        bool Status
        bool IsDeleted
    }

    VariantOptionValues {
        int VariantOptionValueID PK
        int VariantID FK
        int ProductOptionValueID FK
    }

    Bundles {
        int BundleID PK
        string Name
        string Code
        string Description
        decimal Price
        decimal OriginalPrice
        decimal DiscountPercent
        string ImageUrl
        bool Status
        datetime CreatedDate
        datetime UpdatedDate
        string CreatedBy
        string UpdatedBy
    }

    BundleItems {
        int BundleItemID PK
        int BundleID FK
        int VariantID FK
        int Quantity
        int SortOrder
    }

    ProductAlerts {
        int Id PK
        string UserId FK
        int ProductId FK
        int VariantId FK
        string AlertType
        bool IsActive
        datetime CreatedAt
    }

    Categories ||--o{ Products : ""
    Suppliers ||--o{ Products : ""
    Products ||--o{ ProductImages : ""
    Products ||--o{ ProductOptions : ""
    ProductOptions ||--o{ ProductOptionValues : ""
    Products ||--o{ Variants : ""
    Variants ||--o{ VariantOptionValues : ""
    ProductOptionValues ||--o{ VariantOptionValues : ""
    Bundles ||--o{ BundleItems : ""
    Variants ||--o{ BundleItems : ""
    Products ||--o{ ProductAlerts : ""
    Variants ||--o{ ProductAlerts : ""
```

## 3. Mo Dun Gio Hang, Don Hang Va Thanh Toan

```mermaid
erDiagram
    AspNetUsers {
        string Id PK
        string FullName
        string Email
        string PhoneNumber
        decimal WalletBalance
        decimal CoinsBalance
    }

    Carts {
        int CartID PK
        string UserID FK
        int VoucherID FK
        int ShippingVoucherID FK
        datetime CreatedDate
        decimal SubTotal
        decimal DiscountAmount
        decimal TierDiscountAmount
        decimal ShippingDiscountAmount
        decimal TotalAmount
        bool Status
    }

    CartDetails {
        int CartDetailID PK
        int CartID FK
        int VariantID FK
        int BundleID FK
        int Quantity
        decimal UnitPrice
        decimal TotalPrice
        bool IsGift
    }

    Invoices {
        int InvoiceID PK
        string InvoiceCode
        string TrackingCode
        string UserID FK
        int VoucherID FK
        int ShippingVoucherID FK
        decimal SubTotal
        decimal DiscountAmount
        decimal VoucherDiscountAmount
        decimal PointsDiscountAmount
        decimal CoinsDiscountAmount
        decimal WalletDiscountAmount
        decimal AmountToPay
        decimal TierDiscountAmount
        decimal ShippingDiscountAmount
        decimal TotalPrice
        int PayMethod
        decimal ShippingFee
        string ShippingAddress
        string ShippingRecipientName
        string ShippingPhone
        int Status
        bool IsDeleted
        string CancelReason
        datetime CreatedAt
        datetime ConfirmedAt
        datetime ShippedAt
        datetime CompletedAt
        datetime CancelledAt
        string Note
    }

    InvoiceDetails {
        int InvoiceDetailID PK
        int InvoiceID FK
        int BundleID FK
        int VariantID FK
        int Quantity
        decimal UnitPrice
        decimal TotalPrice
    }

    PaymentTransactions {
        int PaymentTransactionId PK
        int InvoiceID FK
        string TxnRef
        string VnPayTransactionNo
        string ResponseCode
        int Status
        string RawQuery
        decimal Amount
        string Provider
        datetime CreatedAt
        datetime PaidAt
        datetime CompletedAt
        datetime FailedAt
        string FailureReason
    }

    BalanceTransactions {
        int Id PK
        string UserID FK
        int InvoiceID FK
        int SourceType
        int Direction
        decimal Amount
        string Reason
        string IdempotencyKey
        string HashSignature
        datetime CreatedAt
    }

    WithdrawRequests {
        int RequestID PK
        string UserID FK
        decimal Amount
        string BankName
        string BankAccount
        string BankOwnerName
        string Status
        string AdminNote
        datetime CreatedAt
        datetime ProcessedAt
    }

    Variants {
        int VariantID PK
        int ProductID FK
        string VariantName
        decimal UnitPrice
        int Stock
    }

    Bundles {
        int BundleID PK
        string Name
        decimal Price
        decimal DiscountPercent
    }

    AspNetUsers ||--o{ Carts : ""
    Carts ||--o{ CartDetails : ""
    Variants ||--o{ CartDetails : ""
    Bundles ||--o{ CartDetails : ""
    AspNetUsers ||--o{ Invoices : ""
    Invoices ||--o{ InvoiceDetails : ""
    Variants ||--o{ InvoiceDetails : ""
    Bundles ||--o{ InvoiceDetails : ""
    Invoices ||--o{ PaymentTransactions : ""
    AspNetUsers ||--o{ BalanceTransactions : ""
    Invoices ||--o{ BalanceTransactions : ""
    AspNetUsers ||--o{ WithdrawRequests : ""
```

## 4. Mo Dun Khuyen Mai, Voucher Va Flash Sale

```mermaid
erDiagram
    Vouchers {
        int VoucherID PK
        int VoucherType
        bool IsFreeShipping
        decimal MaxShippingDiscount
        string Code
        string Name
        int DiscountType
        decimal DiscountValue
        decimal MinOrderValue
        decimal MaxDiscount
        datetime StartDate
        datetime EndDate
        int TotalQuantity
        int UsedQuantity
        bool Status
        int VisibilityType
        int ExclusiveType
        int UsageLimitPerUser
    }

    UserVouchers {
        int UserVoucherID PK
        string UserID FK
        int VoucherID FK
        int InvoiceID FK
        string IssuedCode
        int Status
        int SourceType
        datetime CollectedAt
        datetime UsedAt
    }

    VoucherUsages {
        int Id PK
        int VoucherID FK
        string UserID FK
        int InvoiceID FK
        int CartID FK
        datetime UsedAt
        decimal DiscountAmount
        decimal OrderValue
    }

    FlashSales {
        int Id PK
        string Name
        datetime StartTime
        datetime EndTime
        int Status
        int Type
        string BannerUrl
        string Description
        bool IsActive
        datetime CreatedAt
        string CreatedBy
    }

    FlashSaleItems {
        int Id PK
        int FlashSaleId FK
        int ItemType
        int ReferenceId
        decimal DiscountPrice
        int DiscountType
        int RequiredQuantity
        string GiftVariantIds
        int TotalQuantity
        int SoldQuantity
        int MaxQuantityPerUser
    }

    Carts {
        int CartID PK
        string UserID FK
        int VoucherID FK
        int ShippingVoucherID FK
        decimal DiscountAmount
        decimal ShippingDiscountAmount
        decimal TotalAmount
    }

    Invoices {
        int InvoiceID PK
        string UserID FK
        int VoucherID FK
        int ShippingVoucherID FK
        decimal VoucherDiscountAmount
        decimal ShippingDiscountAmount
        decimal TotalPrice
    }

    AspNetUsers {
        string Id PK
        string FullName
        string Email
    }

    Vouchers ||--o{ UserVouchers : ""
    AspNetUsers ||--o{ UserVouchers : ""
    Invoices ||--o{ UserVouchers : ""
    Vouchers ||--o{ VoucherUsages : ""
    AspNetUsers ||--o{ VoucherUsages : ""
    Carts ||--o{ VoucherUsages : ""
    Invoices ||--o{ VoucherUsages : ""
    Vouchers ||--o{ Carts : ""
    Vouchers ||--o{ Invoices : ""
    FlashSales ||--o{ FlashSaleItems : ""
```

## 5. Mo Dun Khach Hang Than Thiet

```mermaid
erDiagram
    AspNetUsers {
        string Id PK
        string FullName
        string Email
        decimal CoinsBalance
        decimal WalletBalance
    }

    LoyaltyProfiles {
        string UserID PK, FK
        int CurrentTierID FK
        int AvailablePoints
        int TotalPoints
        int PointsToNextTier
        int RankAdjustmentOffset
        int CurrentCheckInStreak
        datetime LastCheckInDate
        datetime LastUpdated
    }

    LoyaltyTiers {
        int TierID PK
        string TierName
        int MinPoints
        string ColorHex
        string BadgeIcon
        bool IsActive
        datetime CreatedAt
        datetime UpdatedAt
    }

    LoyaltyPointHistories {
        long HistoryID PK
        string UserID FK
        string TransactionType
        int Amount
        int InvoiceID FK
        string Description
        datetime CreatedAt
    }

    LoyaltyEarnPolicies {
        int PolicyID PK
        string Name
        decimal VndAmount
        int PointsEarned
        datetime StartDate
        datetime EndDate
        bool IsActive
        bool IsCampaign
        decimal Multiplier
        string CreatedBy
        datetime CreatedAt
    }

    LoyaltyRedeemPolicies {
        int PolicyID PK
        string Name
        int PointsToRedeem
        decimal DiscountVnd
        int TierID FK
        datetime StartDate
        datetime EndDate
        bool IsActive
        string CreatedBy
        datetime CreatedAt
    }

    LoyaltyTierPrivileges {
        int PrivilegeID PK
        int TierID FK
        string Name
        string PrivilegeType
        string Value
        bool IsActive
        string CreatedBy
        datetime CreatedAt
    }

    LoyaltyMonthlyVouchers {
        int VoucherConfigID PK
        int TierID FK
        int VoucherCount
        int DiscountType
        decimal DiscountValue
        decimal MinOrderValue
        decimal MaxDiscount
        int ValidityDays
        bool IsActive
        datetime CreatedAt
    }

    LoyaltyVoucherRedemptions {
        int Id PK
        int VoucherID FK
        int PointCost
        int TierID FK
        int LimitPerUserPerPeriod
        int TotalQuotaPerPeriod
        int ResetCycle
        int ResetDayOfMonth
        datetime StartDate
        datetime EndDate
        bool IsActive
        datetime CreatedAt
        datetime UpdatedAt
    }

    LoyaltyVoucherRedemptionHistories {
        int Id PK
        string UserID FK
        int VoucherID FK
        int UserVoucherID FK
        int PointCost
        string PeriodKey
        datetime RedeemedAt
    }

    LoyaltyManualRevocations {
        int RevocationID PK
        string UserID FK
        int Amount
        string Reason
        string AuditorID
        datetime CreatedAt
    }

    LoyaltyBirthdayGiftLogs {
        int GiftLogID PK
        string UserID FK
        int Year
        string GiftType
        string GiftValue
        string IssuedBy
        datetime ReceivedAt
    }

    LoyaltySettings {
        int Id PK
        bool EnableReviewReward
        int ReviewRewardPoints
        int MinimumReviewWords
        int RequiredRatingForReward
        bool AllowMultipleRewardsPerProduct
        int WelcomeVoucherID FK
        int ReviewWithImageRewardPoints
        int ReviewWithVideoRewardPoints
        int MinimumReviewChars
        int AllowEditReviewTimeLimitMinutes
        int MaxReviewDaysAfterReceipt
        bool RequireDeliveryToReview
        datetime UpdatedAt
    }

    Vouchers {
        int VoucherID PK
        string Code
        string Name
        int DiscountType
        decimal DiscountValue
    }

    UserVouchers {
        int UserVoucherID PK
        string UserID FK
        int VoucherID FK
        int Status
        int SourceType
    }

    Invoices {
        int InvoiceID PK
        string UserID FK
        decimal PointsDiscountAmount
        decimal TotalPrice
    }

    AspNetUsers ||--|| LoyaltyProfiles : ""
    LoyaltyTiers ||--o{ LoyaltyProfiles : ""
    LoyaltyProfiles ||--o{ LoyaltyPointHistories : ""
    Invoices ||--o{ LoyaltyPointHistories : ""
    LoyaltyTiers ||--o{ LoyaltyRedeemPolicies : ""
    LoyaltyTiers ||--o{ LoyaltyTierPrivileges : ""
    LoyaltyTiers ||--o{ LoyaltyMonthlyVouchers : ""
    Vouchers ||--o{ LoyaltyVoucherRedemptions : ""
    LoyaltyTiers ||--o{ LoyaltyVoucherRedemptions : ""
    AspNetUsers ||--o{ LoyaltyVoucherRedemptionHistories : ""
    Vouchers ||--o{ LoyaltyVoucherRedemptionHistories : ""
    UserVouchers ||--o{ LoyaltyVoucherRedemptionHistories : ""
    AspNetUsers ||--o{ LoyaltyManualRevocations : ""
    AspNetUsers ||--o{ LoyaltyBirthdayGiftLogs : ""
    Vouchers ||--o{ LoyaltySettings : ""
```

## 6. Mo Dun Danh Gia, Chat, Thong Bao Va Noi Dung

```mermaid
erDiagram
    AspNetUsers {
        string Id PK
        string FullName
        string Email
        string Avatar
    }

    Reviews {
        int ReviewID PK
        string UserID FK
        int VariantID FK
        int BundleID FK
        int Rating
        string Content
        datetime CreatedAt
        bool IsHidden
        bool HasEarnedRewardPoints
        int LoyaltyPointsEarned
        datetime UpdatedAt
        string CensorshipReason
        string AutoModerationStatus
        string FlaggedReason
        int ViolationScore
    }

    ReviewLikes {
        int ReviewLikeID PK
        int ReviewID FK
        string UserID FK
        datetime CreatedAt
    }

    ReviewComments {
        int CommentID PK
        int ReviewID FK
        string UserID FK
        string Content
        datetime CreatedAt
        bool IsHidden
    }

    ReviewMedia {
        int MediaID PK
        int ReviewID FK
        string MediaUrl
        string MediaType
        datetime CreatedAt
    }

    ReviewCensorshipLogs {
        int LogID PK
        int ReviewID FK
        string ActorID FK
        string Action
        string Reason
        datetime CreatedAt
    }

    ReviewSensitiveKeywords {
        int KeywordID PK
        string Word
        string Severity
        string Category
        datetime CreatedAt
    }

    ChatSessions {
        int Id PK
        string UserId FK
        string AdminId FK
        string Subject
        int Status
        datetime CreatedAt
        datetime ClosedAt
    }

    ChatMessages {
        int Id PK
        int ChatSessionId FK
        string SenderId FK
        string Content
        string AttachmentUrl
        datetime SentAt
        bool IsRead
    }

    Notifications {
        int Id PK
        string Code
        string Title
        string Message
        string Type
        string Status
        datetime CreatedAt
    }

    UserNotifications {
        int Id PK
        string UserId FK
        int NotificationId FK
        bool IsRead
        bool IsDeleted
        datetime CreatedAt
        datetime ReadAt
    }

    NotificationTemplates {
        int Id PK
        string TemplateCode
        string Title
        string Content
        string Type
        datetime CreatedAt
    }

    Banners {
        int Id PK
        string Name
        string Position
        string Type
        string Status
        string Page
        string Version
        bool HasUnpublishedChanges
        datetime PublishedAt
        datetime CreatedAt
        datetime UpdatedAt
        string CreatedBy
    }

    BannerVersions {
        int Id PK
        int BannerId FK
        string Version
        datetime CreatedAt
        string CreatedBy
    }

    Variants {
        int VariantID PK
        string VariantName
    }

    Bundles {
        int BundleID PK
        string Name
    }

    Reviews ||--o{ ReviewLikes : ""
    AspNetUsers ||--o{ ReviewLikes : ""
    Reviews ||--o{ ReviewComments : ""
    AspNetUsers ||--o{ ReviewComments : ""
    Reviews ||--o{ ReviewMedia : ""
    Reviews ||--o{ ReviewCensorshipLogs : ""
    AspNetUsers ||--o{ ReviewCensorshipLogs : ""
    AspNetUsers ||--o{ Reviews : ""
    Variants ||--o{ Reviews : ""
    Bundles ||--o{ Reviews : ""
    AspNetUsers ||--o{ ChatSessions : ""
    ChatSessions ||--o{ ChatMessages : ""
    AspNetUsers ||--o{ ChatMessages : ""
    Notifications ||--o{ UserNotifications : ""
    AspNetUsers ||--o{ UserNotifications : ""
    Banners ||--o{ BannerVersions : ""
```

## 7. Mo Dun Wishlist, Gioi Thieu, Dang Ky Dinh Ky Va Ho So Em Be

```mermaid
erDiagram
    AspNetUsers {
        string Id PK
        string FullName
        string Email
        string PhoneNumber
        string ReferralCode
    }

    Products {
        int ProductID PK
        string ProductName
        decimal Price
        bool SupportsSubscription
    }

    Variants {
        int VariantID PK
        int ProductID FK
        string VariantName
        decimal UnitPrice
    }

    Wishlists {
        string UserID PK, FK
        int ProductID PK, FK
        datetime CreatedAt
    }

    ReferralRecords {
        int Id PK
        string ReferrerId FK
        string ReferredUserId FK
        datetime CreatedAt
        bool IsPermanentlyActive
        bool HasCompletedFirstOrder
    }

    Subscriptions {
        int SubscriptionID PK
        string UserID FK
        int ProductID FK
        int VariantID FK
        int Quantity
        int FrequencyType
        int FrequencyValue
        datetime StartDate
        datetime NextBillingDate
        datetime EndDate
        int MaxOccurrences
        int CompletedOccurrences
        int Status
        int ShippingAddressId
        decimal SubscribedPrice
        datetime CreatedAt
        datetime UpdatedAt
    }

    SubscriptionPaymentHistories {
        int Id PK
        int SubscriptionID FK
        int InvoiceID FK
        datetime PaymentDate
        decimal Amount
        int Status
    }

    Invoices {
        int InvoiceID PK
        string UserID FK
        decimal TotalPrice
        int Status
    }

    BabyProfiles {
        int BabyProfileID PK
        string UserID FK
        string BabyName
        datetime DateOfBirth
        string Gender
        datetime CreatedAt
    }

    AspNetUsers ||--o{ Wishlists : ""
    Products ||--o{ Wishlists : ""
    AspNetUsers ||--o{ ReferralRecords : ""
    AspNetUsers ||--o{ ReferralRecords : ""
    AspNetUsers ||--o{ Subscriptions : ""
    Products ||--o{ Subscriptions : ""
    Variants ||--o{ Subscriptions : ""
    Subscriptions ||--o{ SubscriptionPaymentHistories : ""
    Invoices ||--o{ SubscriptionPaymentHistories : ""
    AspNetUsers ||--o{ BabyProfiles : ""
```
