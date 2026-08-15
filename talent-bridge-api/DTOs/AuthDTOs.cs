using System.Text.Json.Serialization;

namespace TalentBridgeApi.DTOs;

public record RegisterRequest(
    [property: JsonPropertyName("name")]     string Name,
    [property: JsonPropertyName("email")]    string Email,
    [property: JsonPropertyName("password")] string Password
);

public record LoginRequest(
    [property: JsonPropertyName("email")]    string Email,
    [property: JsonPropertyName("password")] string Password
);

public record AuthResponse(
    string Token,
    string UserId,
    string Name,
    string Email,
    string Grade,
    string Role
);
