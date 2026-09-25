SEVERITY_BANDS = [
    (0, 4, "Minimal"),
    (5, 9, "Mild"),
    (10, 14, "Moderate"),
    (15, 19, "Moderately Severe"),
    (20, 27, "Severe"),
]


def calculate_severity(answers: list[int]) -> dict:
    """
    answers: list of 9 integers (0-3), one per PHQ-9 question, in order.
    Returns dict with total score, severity label, and a suicide-risk flag.
    """
    if len(answers) != 9 or any(a not in (0, 1, 2, 3) for a in answers):
        raise ValueError("Expected 9 answers, each between 0 and 3.")

    total = sum(answers)
    severity = next(label for low, high, label in SEVERITY_BANDS if low <= total <= high)

    suicide_risk = answers[8] >= 2

    return {
        "phq_total": total,
        "phq_severity": severity,
        "suicide_risk_flag": suicide_risk,
    }
