using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
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

var builder = WebApplication.CreateBuilder(args);

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

    // Cấu hình Cloudinary
    builder.Services.Configure<CloudinarySettings>(
        builder.Configuration.GetSection("Cloudinary")
    );

    // Cấu hình CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowMVC", policy =>
        {
            policy.WithOrigins("https://localhost:7102", "http://localhost:5102", "https://localhost:7101", "http://localhost:5101", "http://localhost:3000")
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
    });

    // API Controllers và Swagger
    builder.Services.AddControllers();
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

    // Core business services
    builder.Services.AddScoped<IBundleService, BundleService>();
    builder.Services.AddScoped<IReviewService, ReviewService>();
    builder.Services.AddScoped<ICartService, CartService>();
    builder.Services.AddScoped<IVoucherService, VoucherService>();
    builder.Services.AddScoped<IInvoiceService, InvoiceService>();

    // Product services
    builder.Services.AddScoped<ICategoryService, CategoryService>();
    builder.Services.AddScoped<ISupplierService, SupplierService>();
    builder.Services.AddScoped<IProductService, ProductService>();
    builder.Services.AddScoped<IProductOptionService, ProductOptionService>();
    builder.Services.AddScoped<IVariantService, VariantService>(); 

    // Address service
    builder.Services.AddHttpClient<AddressApiService>();
    builder.Services.AddScoped<AddressApiService>();

    builder.Services.AddHttpClient();
    builder.Services.AddMemoryCache();

    //Đăng ký Permission Service
    builder.Services.AddScoped<IPermissionService, PermissionService>();

    //Đăng ký UserService
    builder.Services.AddScoped<IUserService, UserService>();

    // sau các service registration hiện có 
    builder.Services.Configure<VnPayOptions>(builder.Configuration.GetSection(VnPayOptions.SectionName));
    builder.Services.AddScoped<IVnPayService, VnPayService>();
    builder.Services.AddHostedService<VnPayPendingPaymentCleanupService>();

    builder.Services.AddRazorPages();
    builder.Services.AddControllersWithViews();

    var app = builder.Build();

    // Seed data
    using (var scope = app.Services.CreateScope())
    {
        try
        {
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

    app.UseHttpsRedirection();
    app.UseCors("AllowMVC");
    app.UseAuthentication(); 
    app.UseAuthorization();  

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

    Console.WriteLine("PolyBaby API starting...");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Application failed to start: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    throw;
}

