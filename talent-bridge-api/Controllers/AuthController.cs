using Microsoft.AspNetCore.Mvc;
using TalentBridgeApi.DTOs;
using TalentBridgeApi.Services;

namespace TalentBridgeApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth)
    {
        _auth = auth;
    }

    /// <summary>Register a new Talent user</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) ||
            string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Name, email, and password are required." });

        if (req.Password.Length < 6)
            return BadRequest(new { error = "Password must be at least 6 characters." });

        var (response, error) = await _auth.RegisterAsync(req);
        if (error != null)
            return BadRequest(new { success = false, error });

        return StatusCode(201, new { success = true, data = response, message = "Registration successful." });
    }

    /// <summary>Login and receive JWT token</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Email and password are required." });

        var (response, error) = await _auth.LoginAsync(req);
        if (error != null)
            return Unauthorized(new { success = false, error });

        return Ok(new { success = true, data = response, message = "Login successful." });
    }
}
