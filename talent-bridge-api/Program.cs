using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Net;
using System.Text;
using System.Text.Json;
using TalentBridgeApi.Data;
using TalentBridgeApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ──────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Use camelCase for all JSON responses so the React frontend receives
        // field names like "token", "userId", "matchScore" instead of PascalCase.
        opts.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DictionaryKeyPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ── DbContext (SQLite) ────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey     = jwtSection["Key"]      ?? throw new InvalidOperationException("JWT Key is not configured.");
var jwtIssuer  = jwtSection["Issuer"]   ?? throw new InvalidOperationException("JWT Issuer is not configured.");
var jwtAudience = jwtSection["Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtIssuer,
        ValidAudience            = jwtAudience,
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    // Return 401 JSON instead of challenge redirect for expired/invalid tokens
    options.Events = new JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new
            {
                success = false,
                error = "Token tidak valid atau sudah kadaluarsa. Silakan login kembali."
            });
            await context.Response.WriteAsync(body);
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CvService>();
builder.Services.AddScoped<QuizService>();
builder.Services.AddScoped<CourseService>();
builder.Services.AddScoped<JobService>();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173",
                "http://127.0.0.1:5173",
                "https://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── Swagger / OpenAPI ─────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title   = "Talent Bridge API",
        Version = "v1",
        Description = "API for Talent Bridge — AI-powered talent matching platform"
    });

    // JWT Bearer support in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter JWT token: Bearer {your-token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── HttpClient for Flask AI Service ──────────────────────────────────────────
builder.Services.AddHttpClient("FlaskService", client =>
{
    var baseUrl = builder.Configuration["FlaskService:BaseUrl"]
                  ?? "http://localhost:5000";
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout     = TimeSpan.FromSeconds(60); // OCR can take a while
});

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Global exception handler (returns JSON for 500 errors) ───────────────────
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode  = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";
        var body = JsonSerializer.Serialize(new
        {
            success = false,
            error   = "Terjadi kesalahan, coba lagi",
            statusCode = 500
        });
        await context.Response.WriteAsync(body);
    });
});

// ── Middleware pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Talent Bridge API v1");
        c.RoutePrefix = string.Empty; // Swagger at root
    });
}

// CORS must be applied before authentication and authorisation
app.UseCors("FrontendPolicy");

// Static files — serve uploaded CVs from uploads/
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── Ensure CV upload directory exists at startup ──────────────────────────────
var uploadPath = app.Configuration["FileStorage:UploadPath"] ?? "uploads/cv";
Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), uploadPath));

// ── Seed database with demo data ──────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Apply any pending migrations automatically so the app works on first run
    try
    {
        dbContext.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not run database migrations automatically. " +
            "Run 'dotnet ef database update' manually if the database is not yet set up.");
    }
    await SeedData.InitializeAsync(dbContext);
}

app.Run();
