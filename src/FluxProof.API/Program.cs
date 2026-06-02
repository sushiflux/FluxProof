using System.Text;
using FluxProof.API.Services;
using FluxProof.Application.Interfaces;
using FluxProof.Infrastructure.Services;
using FluxProof.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddOpenApi();

// Database
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<FluxProofDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}
else
{
    builder.Services.AddDbContext<FluxProofDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProjectService>();
builder.Services.AddScoped<RevisionService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<UserPreferenceService>();

// CORS for Vite dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("ViteDev", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors("ViteDev");
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Database migration + seed on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FluxProofDbContext>();
    var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    await DbSeeder.SeedAsync(db, env);
}

app.Run();
