using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models; 
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Service;
using PolyBabyAPI.Services;
using PolyBabyAPI.Settings;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Tự động load file Credentials của Google Vision nếu đang chạy dưới Local Dev (thư mục mockups hoặc Local)
var googleCredsEnv = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
if (string.IsNullOrEmpty(googleCredsEnv))
{
    var fallbackPathMockups = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "mockups", "lazpe-store-ce230763f012.json"));
    var fallbackPathLocal = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "Local", "lazpe-store-ce230763f012.json"));
    
    if (File.Exists(fallbackPathLocal))
    {
        Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", fallbackPathLocal);
    }
    else if (File.Exists(fallbackPathMockups))
    {
        Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", fallbackPathMockups);
    }
}

// Load appsettings.Local.json for local development secrets (ignored by Git)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
// Tự động load thêm từ thư mục Local chung của dự án nếu có
var globalLocalAppSettings = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "Local", "appsettings.Local.json"));
if (File.Exists(globalLocalAppSettings))
{
    builder.Configuration.AddJsonFile(globalLocalAppSettings, optional: true, reloadOnChange: true);
}

// Bắt buộc load lại EnvironmentVariables sau cùng để các biến môi trường trong Docker-Compose 
// (như ConnectionString, VnPay__ReturnUrl) có độ ưu tiên cao nhất, đè lên appsettings.Local.json
builder.Configuration.AddEnvironmentVariables();

try
{
    // Kết nối cơ sở dữ liệu
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString, sql =>
            sql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));
    builder.Services.AddDatabaseDeveloperPageExceptionFilter();

    // Cấu hình JWT Authentication
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    var secretKey = jwtSettings["SecretKey"];
    
    // Validate SecretKey length
    if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
    {
        throw new InvalidOperationException("JWT SecretKey must be at least 32 characters long.");
    }

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && 
                    (path.StartsWithSegments("/chatHub") || path.StartsWithSegments("/notificationHub") || path.StartsWithSegments("/directMessageHub")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    })
    .AddCookie(options =>
    {
        options.LoginPath = "/Authentication/Login";
        options.LogoutPath = "/Authentication/Logout";
        options.AccessDeniedPath = "/Authentication/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    });

    // Cấu hình Identity
    builder.Services.AddDefaultIdentity<ApplicationUser>(options =>
    {
        // Password settings
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequiredLength = 6;

        // Email confirmation settings
        options.SignIn.RequireConfirmedAccount = false;
        options.SignIn.RequireConfirmedEmail = false;
        options.SignIn.RequireConfirmedPhoneNumber = false;

        // User settings
        options.User.RequireUniqueEmail = true;

        // Lockout settings
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
        options.Lockout.MaxFailedAccessAttempts = 5; 
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders()
    .AddDefaultUI();

    // Cấu hình MongoDb
    builder.Services.Configure<PolyBabyAPI.Settings.MongoDbSettings>(
        builder.Configuration.GetSection("MongoDbSettings")
    );
    builder.Services.AddSingleton<PolyBabyAPI.Interfaces.IMongoDbService, PolyBabyAPI.Services.MongoDbService>();
    builder.Services.AddScoped<PolyBabyAPI.Interfaces.IRecommendationService, PolyBabyAPI.Services.RecommendationService>();
    builder.Services.AddScoped<PolyBabyAPI.Interfaces.IIpBlockService, PolyBabyAPI.Services.IpBlockService>();

    // Cấu hình Cloudinary
    builder.Services.Configure<CloudinarySettings>(
        builder.Configuration.GetSection("Cloudinary")
    );

    // Cấu hình Gemini
    builder.Services.Configure<GeminiSettings>(
        builder.Configuration.GetSection("Gemini")
    );
    builder.Services.AddHttpClient<IGeminiService, GeminiService>();


    // Cấu hình CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowMVC", policy =>
        {
            policy.SetIsOriginAllowed(origin => true) // Cho phép tất cả các domain (kể cả Render URL)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new PolyBabyAPI.Helpers.CustomDateTimeConverter());
    });

    // API Controllers và Swagger
    builder.Services.AddEndpointsApiExplorer();

    // Cấu hình Swagger đơn giản (không lỗi)
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "PolyBaby API",
            Version = "v1",
            Description = "API for PolyBaby e-commerce platform"
        });

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Nhập token JWT vào đây",
            Name = "Authorization",
            In = ParameterLocation.Header
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        c.IncludeXmlComments(xmlPath);

        c.CustomSchemaIds(type => type.FullName);
    });

    // Đăng ký Services
    builder.Services.AddTransient<IEmailSender, EmailSender>();
    builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
    builder.Services.AddScoped<IProfileService, ProfileService>();
    builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
    builder.Services.AddScoped<PolyBabyAPI.Interfaces.IBabyProfileService, PolyBabyAPI.Services.BabyProfileService>();
    builder.Services.AddScoped<PolyBabyAPI.Interfaces.IBabyTrackerService, PolyBabyAPI.Services.BabyTrackerService>();

    // Core business services
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IBundleService, BundleService>();
    builder.Services.AddScoped<IReviewService, ReviewService>();
    builder.Services.AddScoped<ICartService, CartService>();
    builder.Services.AddScoped<IUpsellService, UpsellService>();
    builder.Services.AddScoped<IVoucherService, VoucherService>();
    builder.Services.AddScoped<IInvoiceService, InvoiceService>();
    builder.Services.AddScoped<IStatisticsService, StatisticsService>();
    builder.Services.AddScoped<ITrendForecastingService, TrendForecastingService>();
    builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
    builder.Services.AddScoped<IBannerService, BannerService>();
    builder.Services.AddScoped<IWalletSecurityService, WalletSecurityService>();
    builder.Services.AddScoped<IWithdrawEmailService, WithdrawEmailService>();

    // Product services
    builder.Services.AddScoped<ICategoryService, CategoryService>();
    builder.Services.AddScoped<ISupplierService, SupplierService>();
    builder.Services.AddScoped<IProductService, ProductService>();
    builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
    builder.Services.AddScoped<IProductAlertService, ProductAlertService>();
    builder.Services.AddScoped<IProductOptionService, ProductOptionService>();
    builder.Services.AddScoped<IVariantService, VariantService>(); 

    // Audit Log Service
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<IAuditLogService, AuditLogService>();

    // Address service
    builder.Services.AddHttpClient<AddressApiService>(client =>
    {
        client.Timeout = TimeSpan.FromSeconds(5);
    });
    builder.Services.AddScoped<AddressApiService>();

    builder.Services.AddHttpClient();
    builder.Services.AddMemoryCache();

    //Đăng ký Permission Service
    builder.Services.AddScoped<IPermissionService, PermissionService>();
    builder.Services.AddScoped<ISearchEngineService, SearchEngineService>();
    builder.Services.AddScoped<IImageSearchService, ImageSearchService>();
    builder.Services.AddScoped<IVoiceSearchService, VoiceSearchService>();

    //Đăng ký UserService
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IImageModerationService, GoogleVisionModerationService>();

    // Đăng ký Chat & SignalR
    builder.Services.AddSignalR().AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.PayloadSerializerOptions.Converters.Add(new PolyBabyAPI.Helpers.CustomDateTimeConverter());
    });
    builder.Services.AddHostedService<ChatCleanupService>();

    // sau các service registration hiện có 
    builder.Services.Configure<VnPayOptions>(builder.Configuration.GetSection(VnPayOptions.SectionName));
    builder.Services.AddScoped<IVnPayService, VnPayService>();
    builder.Services.AddHostedService<VnPayPendingPaymentCleanupService>();
    builder.Services.AddHostedService<OrderAutoCompleteService>();

    // Cấu hình Hangfire
    builder.Services.AddHangfire(configuration => configuration
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true
        }));
    builder.Services.AddHangfireServer();

    // Register job services
    builder.Services.AddScoped<LoyaltyMonthlyVoucherJob>();
    builder.Services.AddScoped<LoyaltyCycleResetJob>();
    builder.Services.AddScoped<LoyaltyBirthdayGiftJob>();
    builder.Services.AddScoped<PolyBabyAPI.Jobs.ModelTrainingJob>();
    builder.Services.AddScoped<TrendModelTrainingJob>();

    builder.Services.AddRazorPages();
    builder.Services.AddControllersWithViews();

    // Cấu hình Rate Limiter (Chống DDoS/Spam request)
    builder.Services.AddRateLimiter(options =>
    {
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? httpContext.Request.Headers.Host.ToString(),
                factory: partition => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = builder.Environment.IsDevelopment() ? 1000 : 1000, // Tăng lên 1000 request ở prod để tránh block Next.js SSR
                    QueueLimit = 0, // Không cho xếp hàng, quá giới hạn là từ chối luôn
                    Window = TimeSpan.FromMinutes(1) // Trong vòng 1 phút
                }));
                
        options.OnRejected = async (context, token) =>
        {
            context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.HttpContext.Response.ContentType = "application/json";
            await context.HttpContext.Response.WriteAsync("{\"error\": \"Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.\"}", cancellationToken: token);
        };
    });

    var app = builder.Build();

    // Seed data
    using (var scope = app.Services.CreateScope())
    {
        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.MigrateAsync();
            
            // Cập nhật tất cả voucher cũ có VoucherType = 0 thành ProductDiscount (1)
            await dbContext.Database.ExecuteSqlRawAsync("UPDATE Vouchers SET VoucherType = 1 WHERE VoucherType = 0");

            await IdentitySeeder.SeedAsync(scope.ServiceProvider);
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    }

    // Configure pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseMigrationsEndPoint();
        app.UseDeveloperExceptionPage();
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "PolyBaby API v1");
            c.RoutePrefix = "swagger";
        });
    }
    else
    {
        app.UseExceptionHandler("/Home/Error");
        app.UseHsts();
    }

    // app.UseHttpsRedirection(); // Đã có Nginx/Cloudflare xử lý HTTPS, tắt cái này để tránh lỗi redirect loop 301
    // Đảm bảo thư mục wwwroot tồn tại để phục vụ file tĩnh
    var webRootPath = builder.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    if (!Directory.Exists(webRootPath))
    {
        Directory.CreateDirectory(webRootPath);
    }

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(webRootPath),
        RequestPath = ""
    });
    app.UseCors("AllowMVC");
    app.UseRouting();
    app.UseRateLimiter();
    app.UseAuthentication(); 
    app.UseAuthorization();  

    // Hangfire Dashboard
    app.UseHangfireDashboard("/hangfire");

    // Đăng ký Recurring Jobs cho Loyalty
    try
    {
        var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
        
        // 1. Job phát voucher hàng tháng (Chạy 00:00 ngày 1 hàng tháng)
        recurringJobManager.AddOrUpdate<LoyaltyMonthlyVoucherJob>(
            "loyalty-monthly-voucher-issuance",
            job => job.ExecuteAsync(),
            Cron.Monthly(1, 0, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );

        // 2. Job reset cuối kỳ (Chạy 00:00 ngày 1/1 và 1/7 hàng năm)
        recurringJobManager.AddOrUpdate<LoyaltyCycleResetJob>(
            "loyalty-end-of-cycle-reset",
            job => job.ExecuteAsync(),
            "0 0 1 1,7 *",
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );

        // 3. Job phát quà sinh nhật hàng ngày (Chạy 00:05 hàng ngày)
        recurringJobManager.AddOrUpdate<LoyaltyBirthdayGiftJob>(
            "loyalty-daily-birthday-gift-issuance",
            job => job.ExecuteAsync(),
            Cron.Daily(0, 5),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );

        // 4. Job huấn luyện AI Model (Chạy lúc 2 giờ sáng và 2 giờ chiều)
        recurringJobManager.AddOrUpdate<PolyBabyAPI.Jobs.ModelTrainingJob>(
            "ai-model-training",
            job => job.ExecuteAsync(),
            "0 2,14 * * *", // Chạy lúc 2:00 AM và 2:00 PM
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );

        // 5. Job huấn luyện AI Trend Model (Chạy lúc 3 giờ sáng)
        recurringJobManager.AddOrUpdate<TrendModelTrainingJob>(
            "ai-trend-model-training",
            job => job.ExecuteAsync(),
            "0 3 * * *", // Chạy lúc 3:00 AM
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );

        // 6. Job báo cáo rút tiền hàng ngày (Chạy lúc 10:00 sáng)
        recurringJobManager.AddOrUpdate<PolyBabyAPI.Jobs.WithdrawDailyReportJob>(
            "withdraw-daily-report",
            job => job.ExecuteAsync(),
            "0 10 * * *", // 10:00 AM mỗi ngày
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );

        // 7. Job tự động hủy yêu cầu rút tiền quá hạn 3 ngày (Chạy mỗi giờ một lần)
        recurringJobManager.AddOrUpdate<PolyBabyAPI.Jobs.WithdrawAutoRejectJob>(
            "withdraw-auto-reject-expired",
            job => job.ExecuteAsync(),
            "0 * * * *", // Chạy vào phút thứ 0 của mỗi giờ
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );
        // 8. Job mua hàng định kỳ (Chạy mỗi 1 giờ)
        recurringJobManager.AddOrUpdate<PolyBabyAPI.Interfaces.ISubscriptionService>(
            "auto-replenishment-job",
            service => service.ExecuteDueSubscriptionsAsync(),
            "0 * * * *", // Chạy vào phút thứ 0 của mỗi giờ
            new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time") }
        );
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Lỗi cấu hình Hangfire Recurring Jobs: {ex.Message}");
    }

    app.MapHub<PolyBabyAPI.Hubs.ChatHub>("/chatHub");
    app.MapHub<PolyBabyAPI.Hubs.DirectMessageHub>("/directMessageHub");
    app.MapHub<PolyBabyAPI.Hubs.NotificationHub>("/notificationHub");
    app.MapHub<PolyBabyAPI.Hubs.BannerHub>("/bannerHub");
    app.MapControllers();
    app.MapControllerRoute(
        name: "areas",
        pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}"
    );
    app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}"
    );
    app.MapControllerRoute(
        name: "admin",
        pattern: "admin/{action=Index}/{id?}",
        defaults: new { area = "Admin", controller = "Dashboard" }
    );

    app.MapRazorPages();

    // Health Check endpoints cho UptimeRobot (Hỗ trợ cả GET và HEAD)
    var healthCheck = () => Results.Ok(new { status = "UP", message = "Backend API is running!" });
    app.MapMethods("/", new[] { "GET", "HEAD" }, healthCheck);
    app.MapMethods("/api", new[] { "GET", "HEAD" }, healthCheck);

    Console.WriteLine("PolyBaby API starting...");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Application failed to start: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    throw;
}

