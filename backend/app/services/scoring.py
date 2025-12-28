# app/services/scoring.py

def compute_score(properties: dict, weights: dict) -> float:
    """
    Calcule un score global pondéré sur 20.
    - Somme pondérée des variables
    - Normalisation par le poids total
    - Conversion sur 20
    """

    total_weight = 0
    weighted_sum = 0.0

    for key, weight in weights.items():
        value = properties.get(key)
        if value is not None and weight > 0:
            weighted_sum += float(value) * float(weight)
            total_weight += float(weight)

    if total_weight == 0:
        return 0.0

    # Normalisation /20
    score_sur_20 = (weighted_sum / total_weight) * 20
    return round(score_sur_20, 2)

