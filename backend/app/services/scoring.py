# -*- coding: utf-8 -*-
"""
Created on Tue Dec 23 15:55:07 2025

@author: riche
"""

def compute_score(properties: dict, weights: dict) -> float:
    """
    Calcule un score global pondéré à partir
    des propriétés normalisées d'une commune.

    properties = {
        "score_sante": 0.8,
        "mag_scaled": 0.6,
        ...
    }

    weights = {
        "score_sante": 3,
        "mag_scaled": 2,
        ...
    }
    """

    total_weight = 0
    weighted_sum = 0

    for key, weight in weights.items():
        value = properties.get(key)

        if value is not None and weight > 0:
            weighted_sum += value * weight
            total_weight += weight

    if total_weight == 0:
        return 0.0

    return round(weighted_sum / total_weight, 3)
