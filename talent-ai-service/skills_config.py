"""Predefined skill list for Talent Bridge matching."""

PREDEFINED_SKILLS = [
    "Python",
    "Networking",
    "Cybersecurity",
    "Data Center Operations",
    "Cloud Computing",
    "AI/ML",
    "Linux Administration",
    "Virtualization",
    "Power Systems",
    "Cooling Systems",
    "SQL Server",
    "Docker",
    "Kubernetes",
    "Fiber Optics",
    "DCIM",
    "HVAC",
    "Windows Server",
    "VMware",
    "Network Security",
    "Disaster Recovery",
]

# Grade thresholds based on overall match score
GRADE_THRESHOLDS = {
    "Gold":    80.0,
    "Silver":  60.0,
    "Bronze":  40.0,
    "Unranked": 0.0,
}

def calculate_grade(score: float) -> str:
    """Calculate grade from match score."""
    if score >= GRADE_THRESHOLDS["Gold"]:
        return "Gold"
    elif score >= GRADE_THRESHOLDS["Silver"]:
        return "Silver"
    elif score >= GRADE_THRESHOLDS["Bronze"]:
        return "Bronze"
    else:
        return "Unranked"
