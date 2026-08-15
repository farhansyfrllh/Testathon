using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TalentBridgeApi.Data;
using TalentBridgeApi.DTOs;
using TalentBridgeApi.Models;

namespace TalentBridgeApi.Services;

public class CvService
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<CvService> _logger;

    // Allowed MIME types for CV uploads
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/png",
        "image/jpeg"
    };

    // Allowed file extensions as an extra safety check
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public CvService(
        AppDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<CvService> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    // ── Upload: validate → save to disk → forward to Flask → persist → grade ──

    public async Task<(CvUploadResponse? result, string? error)> UploadAsync(
        IFormFile file, Guid userId)
    {
        // 1. Validate file
        var validationError = ValidateFile(file);
        if (validationError != null)
            return (null, validationError);

        // 2. Ensure upload directory exists
        var uploadPath = _config["FileStorage:UploadPath"] ?? "uploads/cv";
        var absoluteUploadPath = Path.Combine(Directory.GetCurrentDirectory(), uploadPath);
        Directory.CreateDirectory(absoluteUploadPath);

        // 3. Save file to disk with GUID name, preserve extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var savedFileName = $"{Guid.NewGuid()}{extension}";
        var savedFilePath = Path.Combine(absoluteUploadPath, savedFileName);
        var relativeFilePath = Path.Combine(uploadPath, savedFileName).Replace("\\", "/");

        await using (var stream = new FileStream(savedFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // 4. Forward to Flask /ocr-and-match
        FlaskOcrMatchResponse flaskResponse;
        try
        {
            flaskResponse = await ForwardToFlaskAsync(savedFilePath, file.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Flask OCR service call failed for file {File}", savedFileName);
            // Clean up saved file if Flask fails so we don't leave orphan files
            if (File.Exists(savedFilePath)) File.Delete(savedFilePath);
            return (null, "AI service is unavailable. Please try again later.");
        }

        // 5. Persist to database
        try
        {
            var (cvUploadResponse, persistError) = await PersistResultsAsync(
                userId, relativeFilePath, flaskResponse);

            if (persistError != null)
                return (null, persistError);

            return (cvUploadResponse, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist CV results for user {UserId}", userId);
            return (null, "Failed to save CV results. Please try again.");
        }
    }

    // ── Get latest CV result for a user ──────────────────────────────────────

    public async Task<(CvResultResponse? result, string? error)> GetResultAsync(Guid userId)
    {
        var cv = await _db.CVs
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UploadedAt)
            .FirstOrDefaultAsync();

        if (cv == null)
            return (null, "No CV found for this user.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return (null, "User not found.");

        var skills = await _db.TalentSkills
            .Where(ts => ts.UserId == userId)
            .Select(ts => new SkillResult(ts.SkillName, ts.ProficiencyScore))
            .ToListAsync();

        return (new CvResultResponse(
            cv.Id.ToString(),
            cv.FilePath,
            cv.MatchScore,
            user.Grade,
            cv.UploadedAt,
            skills), null);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static string? ValidateFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return "No file provided.";

        if (file.Length > MaxFileSizeBytes)
            return $"File size exceeds the maximum allowed 10 MB (received {file.Length / 1024 / 1024} MB).";

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return $"File type '{extension}' is not allowed. Only PDF, PNG, and JPG files are accepted.";

        var mimeType = file.ContentType?.ToLowerInvariant() ?? string.Empty;
        if (!AllowedMimeTypes.Contains(mimeType))
            return $"MIME type '{mimeType}' is not allowed. Only PDF, PNG, and JPEG files are accepted.";

        return null;
    }

    private async Task<FlaskOcrMatchResponse> ForwardToFlaskAsync(string filePath, string originalFileName)
    {
        var client = _httpClientFactory.CreateClient("FlaskService");

        await using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        using var content = new MultipartFormDataContent();
        var fileContent = new StreamContent(fileStream);

        // Set content type on the file part so Flask can detect the file type
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        fileContent.Headers.ContentType = extension switch
        {
            ".pdf" => new MediaTypeHeaderValue("application/pdf"),
            ".png" => new MediaTypeHeaderValue("image/png"),
            ".jpg" or ".jpeg" => new MediaTypeHeaderValue("image/jpeg"),
            _ => new MediaTypeHeaderValue("application/octet-stream")
        };

        content.Add(fileContent, "file", Path.GetFileName(filePath));

        var response = await client.PostAsync("/ocr-and-match", content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        _logger.LogDebug("Flask /ocr-and-match response: {Json}", json);

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            // Flask returns snake_case keys
        };

        // Deserialize with custom snake_case handling
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var flaskResponse = new FlaskOcrMatchResponse
        {
            OverallMatchScore = root.TryGetProperty("overall_match_score", out var scoreEl)
                ? scoreEl.GetDouble()
                : 0.0,
            Method = root.TryGetProperty("method", out var methodEl)
                ? methodEl.GetString() ?? "rule_based"
                : "rule_based",
            ExtractedText = root.TryGetProperty("extracted_text", out var textEl)
                ? textEl.GetString()
                : null
        };

        if (root.TryGetProperty("extracted_skills", out var skillsEl) &&
            skillsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var skillEl in skillsEl.EnumerateArray())
            {
                var name = skillEl.TryGetProperty("name", out var nameEl)
                    ? nameEl.GetString() ?? string.Empty
                    : string.Empty;
                var confidence = skillEl.TryGetProperty("confidence", out var confEl)
                    ? confEl.GetDouble()
                    : 0.0;

                if (!string.IsNullOrWhiteSpace(name))
                    flaskResponse.ExtractedSkills.Add(new FlaskSkill { Name = name, Confidence = confidence });
            }
        }

        return flaskResponse;
    }

    private async Task<(CvUploadResponse? result, string? error)> PersistResultsAsync(
        Guid userId, string relativeFilePath, FlaskOcrMatchResponse flaskResponse)
    {
        // --- Verify user exists ---
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return (null, "User not found.");

        // --- Save CV record ---
        var cv = new Cv
        {
            UserId = userId,
            FilePath = relativeFilePath,
            ExtractedText = flaskResponse.ExtractedText,
            MatchScore = flaskResponse.OverallMatchScore,
            UploadedAt = DateTime.UtcNow
        };
        _db.CVs.Add(cv);

        // --- Replace TalentSkills for this user with the new analysis results ---
        var existingSkills = await _db.TalentSkills
            .Where(ts => ts.UserId == userId)
            .ToListAsync();
        _db.TalentSkills.RemoveRange(existingSkills);

        var newSkills = flaskResponse.ExtractedSkills.Select(s => new TalentSkill
        {
            UserId = userId,
            SkillName = s.Name,
            ProficiencyScore = s.Confidence
        }).ToList();
        _db.TalentSkills.AddRange(newSkills);

        // --- Update user grade based on match score ---
        var newGrade = CalculateGrade(flaskResponse.OverallMatchScore);
        user.Grade = newGrade;

        await _db.SaveChangesAsync();

        var skillResults = newSkills.Select(s => new SkillResult(s.SkillName, s.ProficiencyScore));

        return (new CvUploadResponse(
            cv.Id.ToString(),
            cv.MatchScore,
            newGrade,
            skillResults,
            flaskResponse.Method), null);
    }

    /// <summary>
    /// Grade logic per RF-02.9 / design.md:
    ///   score &lt; 40  → Unranked
    ///   40 ≤ score &lt; 60 → Bronze
    ///   60 ≤ score &lt; 80 → Silver
    ///   score ≥ 80       → Gold
    /// </summary>
    public static string CalculateGrade(double score) => score switch
    {
        >= 80 => "Gold",
        >= 60 => "Silver",
        >= 40 => "Bronze",
        _     => "Unranked"
    };
}
