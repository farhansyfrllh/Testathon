using System.Text.Json.Serialization;

namespace TalentBridgeApi.DTOs;

public record AnswerDto(
    [property: JsonPropertyName("questionId")]    string QuestionId,
    [property: JsonPropertyName("selectedOptionIds")] List<string> SelectedOptionIds,
    [property: JsonPropertyName("dragDropMapping")]   Dictionary<string, string>? DragDropMapping
);

public record QuizSubmitRequest(
    [property: JsonPropertyName("answers")] List<AnswerDto> Answers
);

public record QuizResultDto(
    double Score,
    string Grade,
    int XpGained,
    bool Passed,
    int CorrectCount,
    int TotalCount
);
