"""
Voice quality analysis module.
"""
import numpy as np
from typing import Dict, Any
from . import AnalysisModule, register_module


@register_module("voice_quality")
class VoiceQualityModule(AnalysisModule):
    """Extract voice quality measures: HNR, jitter, shimmer."""

    # Minimum valid HNR threshold (dB)
    # Values below this are considered invalid
    MIN_HNR_DB = -50.0

    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Extract voice quality measures.

        Args:
            sound: Parselmouth Sound object
            options: Module options
            mode: Analysis mode

        Returns:
            Dictionary with voice quality measures
        """
        try:
            import parselmouth

            # Get pitch options (consistent with pitch module)
            f0_min = options.get("f0_min", 75.0)
            f0_max = options.get("f0_max", 600.0)

            # Create pitch object with specified range
            pitch = sound.to_pitch(pitch_floor=f0_min, pitch_ceiling=f0_max)

            # Extract HNR (Harmonics-to-Noise Ratio)
            harmonicity = sound.to_harmonicity()
            hnr_values = []
            for i in range(harmonicity.nx):
                value = harmonicity.values[0][i]
                # Filter out invalid values:
                # - NaN and inf values
                # - Extreme negative values (< MIN_HNR_DB)
                if not np.isnan(value) and not np.isinf(value) and value >= self.MIN_HNR_DB:
                    hnr_values.append(float(value))

            # Calculate point process for jitter/shimmer
            jitter_local = None
            jitter_abs = None
            shimmer_local = None
            shimmer_db = None

            try:
                # Check if audio has enough voiced content
                # Get voiced frames count
                voiced_frames = sum(1 for i in range(pitch.get_number_of_frames())
                                   if pitch.get_value_in_frame(i + 1) > 0)

                # Need at least 10 voiced frames for reliable jitter/shimmer
                if voiced_frames < 10:
                    raise ValueError(f"Insufficient voiced frames ({voiced_frames}), need at least 10")

                # CRITICAL FIX: Correct parameter order (floor first, ceiling second)
                point_process = parselmouth.praat.call(
                    sound,
                    "To PointProcess (periodic, cc)",
                    f0_min,    # Minimum pitch (correct order)
                    f0_max     # Maximum pitch (correct order)
                )

                # Validate PointProcess has enough periods
                num_periods = parselmouth.praat.call(point_process, "Get number of points")
                if num_periods < 3:
                    print(f"[VOICE_QUALITY] Warning: Only {num_periods} periods detected, need at least 3 for reliable jitter/shimmer")
                    # Continue anyway, but values may be unreliable

                # Jitter (local)
                jitter_local = parselmouth.praat.call(
                    point_process,
                    "Get jitter (local)",
                    0.0,
                    0.0,
                    0.0001,
                    0.02,
                    1.3
                )

                # Jitter (absolute)
                jitter_abs = parselmouth.praat.call(
                    point_process,
                    "Get jitter (local, absolute)",
                    0.0,
                    0.0,
                    0.0001,
                    0.02,
                    1.3
                )

                # Shimmer (local)
                shimmer_local = parselmouth.praat.call(
                    [sound, point_process],
                    "Get shimmer (local)",
                    0.0,
                    0.0,
                    0.0001,
                    0.02,
                    1.3,
                    1.6
                )

                # Shimmer (dB)
                shimmer_db = parselmouth.praat.call(
                    [sound, point_process],
                    "Get shimmer (local_dB)",
                    0.0,
                    0.0,
                    0.0001,
                    0.02,
                    1.3,
                    1.6
                )

            except Exception as e:
                # Enable error logging for debugging
                print(f"[VOICE_QUALITY] Jitter/Shimmer calculation failed: {e}")
                import traceback
                traceback.print_exc()
                # Still return None values but with visibility

            # Calculate statistics
            result = {
                "hnr": {
                    "mean_db": float(np.mean(hnr_values)) if hnr_values else None,
                    "std_db": float(np.std(hnr_values)) if hnr_values else None,
                    "min_db": float(np.min(hnr_values)) if hnr_values else None,
                    "max_db": float(np.max(hnr_values)) if hnr_values else None
                },
                "jitter": {
                    "local": float(jitter_local) if jitter_local and not np.isnan(jitter_local) else None,
                    "absolute_s": float(jitter_abs) if jitter_abs and not np.isnan(jitter_abs) else None
                },
                "shimmer": {
                    "local": float(shimmer_local) if shimmer_local and not np.isnan(shimmer_local) else None,
                    "db": float(shimmer_db) if shimmer_db and not np.isnan(shimmer_db) else None
                }
            }

            return result

        except Exception as e:
            return {
                "error": str(e),
                "hnr": {},
                "jitter": {},
                "shimmer": {}
            }
