"""Skill matching service with AI and rule-based fallback."""
import os
import numpy as np
from skills_config import PREDEFINED_SKILLS, calculate_grade

# Try to load the sentence-transformers model at startup
AI_AVAILABLE = False
_model = None

# Respect USE_AI_FALLBACK env flag — if true, skip AI entirely
_use_ai_fallback = os.getenv('USE_AI_FALLBACK', 'false').lower() == 'true'

if not _use_ai_fallback:
    try:
        from sentence_transformers import SentenceTransformer
        model_name = os.getenv('MODEL_NAME', 'all-MiniLM-L6-v2')
        _model = SentenceTransformer(model_name)
        AI_AVAILABLE = True
        print(f"[AI] Model '{model_name}' loaded successfully.")
    except Exception as e:
        AI_AVAILABLE = False
        print(f"[FALLBACK] AI model not available: {e}. Using rule-based matching.")
else:
    print("[FALLBACK] USE_AI_FALLBACK=true — skipping AI, using rule-based matching.")


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def match_skills_ai(text: str) -> dict:
    """
    AI-based skill matching using sentence-transformers cosine similarity.
    Encodes CV text and each skill, returns skills with similarity >= 0.3.
    """
    if not AI_AVAILABLE or _model is None:
        raise RuntimeError("AI model is not available")

    if not text or not text.strip():
        return {
            "extracted_skills": [],
            "overall_match_score": 0.0,
            "grade": calculate_grade(0.0),
            "method": "ai"
        }

    try:
        text_embedding = _model.encode([text])[0]
        matched_skills = []

        for skill in PREDEFINED_SKILLS:
            skill_embedding = _model.encode([skill])[0]
            similarity = _cosine_similarity(text_embedding, skill_embedding)
            if similarity >= 0.3:  # threshold as specified
                matched_skills.append({
                    "name": skill,
                    "confidence": round(float(similarity) * 100, 2)
                })

        matched_skills.sort(key=lambda x: x["confidence"], reverse=True)

        # Overall score: proportion of matched skills weighted by avg confidence
        if matched_skills:
            avg_conf = sum(s["confidence"] for s in matched_skills) / len(matched_skills)
            proportion = len(matched_skills) / len(PREDEFINED_SKILLS)
            overall_score = min(100.0, proportion * 100 * (avg_conf / 100) * 2)
        else:
            overall_score = 0.0

        return {
            "extracted_skills": matched_skills,
            "overall_match_score": round(overall_score, 2),
            "grade": calculate_grade(overall_score),
            "method": "ai"
        }
    except Exception as e:
        print(f"[FALLBACK] AI matching failed: {e}, falling back to rule-based.")
        return match_skills_rule_based(text)


def match_skills_rule_based(text: str) -> dict:
    """
    Rule-based skill matching using case-insensitive keyword detection.
    Checks if the skill name appears in the CV text.
    """
    if not text or not text.strip():
        return {
            "extracted_skills": [],
            "overall_match_score": 0.0,
            "grade": calculate_grade(0.0),
            "method": "rule_based"
        }

    text_lower = text.lower()
    matched_skills = []

    for skill in PREDEFINED_SKILLS:
        skill_lower = skill.lower()
        if skill_lower in text_lower:
            # Frequency-based confidence: base 60 + bonus per occurrence
            count = text_lower.count(skill_lower)
            confidence = min(95.0, 60.0 + (count - 1) * 5.0)
            matched_skills.append({
                "name": skill,
                "confidence": round(confidence, 2)
            })

    matched_skills.sort(key=lambda x: x["confidence"], reverse=True)

    # Overall score: proportion of matched skills (capped at 100)
    overall_score = min(100.0, (len(matched_skills) / max(len(PREDEFINED_SKILLS), 1)) * 100 * 1.5)

    return {
        "extracted_skills": matched_skills,
        "overall_match_score": round(overall_score, 2),
        "grade": calculate_grade(overall_score),
        "method": "rule_based"
    }


def match_skills(text: str) -> dict:
    """
    Match skills from CV text.
    Uses AI if available and USE_AI_FALLBACK is false, otherwise rule-based.
    """
    if AI_AVAILABLE and _model is not None:
        return match_skills_ai(text)
    else:
        return match_skills_rule_based(text)


def _jaccard_similarity(set_a: set, set_b: set) -> float:
    """Compute Jaccard similarity between two sets: |intersection| / |union|."""
    if not set_a and not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union)


def _compute_missing_skills_ai(talent_skills: list, required_skills: list, threshold: float = 0.4) -> list:
    """
    Determine which required skills are 'missing' from talent's skill set
    using semantic similarity. A required skill is considered covered if its
    best cosine similarity against any talent skill exceeds the threshold.
    """
    if not required_skills or not AI_AVAILABLE or _model is None:
        return required_skills[:]

    if not talent_skills:
        return required_skills[:]

    talent_embeddings = _model.encode(talent_skills)
    missing = []
    for req_skill in required_skills:
        req_embedding = _model.encode([req_skill])[0]
        # Check if any talent skill is semantically close enough
        covered = False
        for t_emb in talent_embeddings:
            if _cosine_similarity(req_embedding, t_emb) >= threshold:
                covered = True
                break
        if not covered:
            missing.append(req_skill)
    return missing


def recommend_courses_by_skills(talent_skills: list, courses: list) -> list:
    """
    Rank courses by relevance to the talent's skill profile.

    AI path (sentence-transformers available):
      - Join talent_skills into a single string, join required_skills per course
      - Compute cosine similarity between the two joined strings using _model.encode
      - Determine missing_skills: required skills not semantically covered (threshold 0.4)
      - similarity_score is 0–100 (cosine * 100)

    Fallback path (Jaccard):
      - Compare lowercased skill sets: |intersection| / |union| * 100
      - missing_skills: required skills not in talent's lowercased set
    """
    results = []

    if AI_AVAILABLE and _model is not None:
        # Encode talent skills as a combined document
        talent_text = " ".join(talent_skills) if talent_skills else ""

        for course in courses:
            required = course.get('required_skills', [])
            if not required:
                results.append({
                    "id": course.get('id'),
                    "title": course.get('title', ''),
                    "similarity_score": 0.0,
                    "missing_skills": []
                })
                continue

            required_text = " ".join(required)

            if not talent_text.strip():
                # No talent skills — all required skills are missing, score 0
                results.append({
                    "id": course.get('id'),
                    "title": course.get('title', ''),
                    "similarity_score": 0.0,
                    "missing_skills": list(required)
                })
                continue

            try:
                talent_embedding = _model.encode([talent_text])[0]
                required_embedding = _model.encode([required_text])[0]
                cosine_sim = _cosine_similarity(talent_embedding, required_embedding)
                similarity_score = round(float(cosine_sim) * 100, 2)

                missing_skills = _compute_missing_skills_ai(talent_skills, required, threshold=0.4)

                results.append({
                    "id": course.get('id'),
                    "title": course.get('title', ''),
                    "similarity_score": similarity_score,
                    "missing_skills": missing_skills
                })
            except Exception as e:
                print(f"[FALLBACK] AI course recommendation failed for '{course.get('title')}': {e}")
                # Fall back to Jaccard for this course
                talent_set = {s.lower() for s in talent_skills}
                required_lower = {s.lower() for s in required}
                jaccard = _jaccard_similarity(talent_set, required_lower)
                missing_skills = [s for s in required if s.lower() not in talent_set]
                results.append({
                    "id": course.get('id'),
                    "title": course.get('title', ''),
                    "similarity_score": round(jaccard * 100, 2),
                    "missing_skills": missing_skills
                })
    else:
        # Jaccard fallback: compare lowercased skill sets
        talent_set = {s.lower() for s in talent_skills}

        for course in courses:
            required = course.get('required_skills', [])
            if not required:
                results.append({
                    "id": course.get('id'),
                    "title": course.get('title', ''),
                    "similarity_score": 0.0,
                    "missing_skills": []
                })
                continue

            required_set = {s.lower() for s in required}
            jaccard = _jaccard_similarity(talent_set, required_set)
            missing_skills = [s for s in required if s.lower() not in talent_set]

            results.append({
                "id": course.get('id'),
                "title": course.get('title', ''),
                "similarity_score": round(jaccard * 100, 2),
                "missing_skills": missing_skills
            })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results
