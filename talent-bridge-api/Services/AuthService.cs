using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TalentBridgeApi.Data;
using TalentBridgeApi.DTOs;
using TalentBridgeApi.Models;

namespace TalentBridgeApi.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<(AuthResponse? response, string? error)> RegisterAsync(RegisterRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return (null, "Email already registered.");

        var user = new User
        {
            Name         = req.Name,
            Email        = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12),
            Role         = "Talent",
            Grade        = "Unranked"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = GenerateJwt(user);
        return (new AuthResponse(token, user.Id.ToString(), user.Name, user.Email, user.Grade, user.Role), null);
    }

    public async Task<(AuthResponse? response, string? error)> LoginAsync(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return (null, "Invalid email or password.");

        var token = GenerateJwt(user);
        return (new AuthResponse(token, user.Id.ToString(), user.Name, user.Email, user.Grade, user.Role), null);
    }

    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(
            double.Parse(_config["Jwt:ExpiryHours"] ?? "8"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email,          user.Email),
            new Claim(ClaimTypes.Name,            user.Name),
            new Claim(ClaimTypes.Role,            user.Role),
            new Claim("grade",                    user.Grade)
        };

        var token = new JwtSecurityToken(
            issuer:            _config["Jwt:Issuer"],
            audience:          _config["Jwt:Audience"],
            claims:            claims,
            expires:           expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
