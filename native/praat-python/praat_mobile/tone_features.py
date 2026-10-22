"""
Tone feature extraction for Chinese/dialect analysis.
"""
import numpy as np
from typing import Dict, Optional, List, Any
from scipy import stats


def extract_tone_features(
    pitch_contour: List[float],
    time_values: List[float],
    segment_start: float,
    segment_end: float,
    speaker_ref: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Extract tone features from pitch contour for a specific segment.

    Args:
        pitch_contour: List of F0 values (Hz), 0 or None for unvoiced
        time_values: Corresponding time values (seconds)
        segment_start: Segment start time (seconds)
        segment_end: Segment end time (seconds)
        speaker_ref: Speaker reference F0 values (p5, p50, p95)

    Returns:
        Dictionary with tone features (all nullable)
    """
    # Extract segment data
    segment_f0 = []
    segment_times = []

    for t, f0 in zip(time_values, pitch_contour):
        if segment_start <= t <= segment_end:
            if f0 and f0 > 0 and not np.isnan(f0) and not np.isinf(f0):
                segment_f0.append(f0)
                segment_times.append(t)

    # Initialize result with all None
    features = {
        "f0_start": None,
        "f0_end": None,
        "f0_min": None,
        "f0_max": None,
        "f0_mean": None,
        "f0_slope": None,
        "f0_range": None,
        "contour_5pt": None,
        "voiced_ratio": None
    }

    if len(segment_f0) < 2:
        return features

    segment_f0 = np.array(segment_f0)
    segment_times = np.array(segment_times)

    # Basic statistics
    features["f0_start"] = float(segment_f0[0])
    features["f0_end"] = float(segment_f0[-1])
    features["f0_min"] = float(np.min(segment_f0))
    features["f0_max"] = float(np.max(segment_f0))
    features["f0_mean"] = float(np.mean(segment_f0))
    features["f0_range"] = features["f0_max"] - features["f0_min"]

    # F0 slope (linear regression)
    if len(segment_f0) >= 2:
        slope, _, _, _, _ = stats.linregress(segment_times, segment_f0)
        features["f0_slope"] = float(slope)

    # 5-point contour (normalized to 1-5 scale for tone notation)
    if len(segment_f0) >= 5:
        indices = np.linspace(0, len(segment_f0) - 1, 5).astype(int)
        contour_5pt = segment_f0[indices].tolist()

        # Normalize to 1-5 scale if speaker reference provided
        if speaker_ref and "p5" in speaker_ref and "p95" in speaker_ref:
            p5 = speaker_ref["p5"]
            p95 = speaker_ref["p95"]

            if p95 > p5:  # Avoid division by zero
                # Map to 1-5 scale: p5 -> 1, p95 -> 5
                contour_5pt = [
                    1 + 4 * (f0 - p5) / (p95 - p5)
                    for f0 in contour_5pt
                ]
                # Clamp to 1-5 range
                contour_5pt = [max(1.0, min(5.0, x)) for x in contour_5pt]

        features["contour_5pt"] = [float(x) for x in contour_5pt]

    # Voiced ratio
    total_frames = len([t for t in time_values if segment_start <= t <= segment_end])
    if total_frames > 0:
        features["voiced_ratio"] = len(segment_f0) / total_frames

    return features


def sanitize_json(obj: Any) -> Any:
    """
    Sanitize JSON object by replacing NaN/inf with None.

    Args:
        obj: Any JSON-serializable object

    Returns:
        Sanitized object
    """
    if isinstance(obj, dict):
        return {k: sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json(item) for item in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    else:
        return obj
