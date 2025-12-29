# app/services/scoring.py

def compute_score(props: dict, prefs: dict) -> float:
    """
    Calcule un score sur 20 en gérant les None correctement.
    Soleil = pondération fixe (3).
    sun_preference = préférence utilisateur (0 -> faible, 0.5 -> moyen, 1 -> fort)
    """

    # Récupération des pondérations
    w_sante = prefs.get("w_sante", 1)
    w_mag = prefs.get("w_mag", 1)
    w_asso = prefs.get("w_asso", 1)
    w_sun = prefs.get("w_sun", 3)
    sun_preference = prefs.get("sun_preference", 0.5)

    # Sécurisation des valeurs (aucun None ne doit casser le calcul)
    sante = props.get("score_sante") or 0
    mag = props.get("mag_scaled") or 0
    asso = props.get("asso_scaled") or 0
    sun_scaled = props.get("sun_scaled") or 0.5  # neutre si manquant

    # 🌞 Calcul soleil basé sur la proximité de la préférence
    distance = abs(sun_scaled - sun_preference)   # 0 = parfait
    sun_score = 1 - distance                      # 1 = idéal, 0 = opposé

    weighted_sum = (
        sante * w_sante +
        mag * w_mag +
        asso * w_asso +
        sun_score * w_sun
    )

    total_weight = w_sante + w_mag + w_asso + w_sun

    if total_weight == 0:
        return 0

    # 🟢 Score final sur 20
    return round((weighted_sum / total_weight) * 20, 2)