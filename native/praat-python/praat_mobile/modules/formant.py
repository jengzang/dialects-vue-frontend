"""
Formant extraction module.
"""
import numpy as np
from typing import Dict, Any, List, Tuple
from scipy.signal import medfilt
from . import AnalysisModule, register_module


@register_module("formant")
class FormantModule(AnalysisModule):
    """Extract formant frequencies (F1-F5)."""

    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Extract formant frequencies with smoothing.

        Args:
            sound: Parselmouth Sound object
            options: Formant options (max_formants, max_freq_hz, window_length)
            mode: Analysis mode

        Returns:
            Dictionary with formant contours and statistics
        """
        try:
            import parselmouth

            # Get options
            max_formants = options.get("max_formants", 5)
            max_freq_hz = options.get("max_freq_hz", 5500.0)
            window_length = options.get("window_length", 0.025)
            time_step = options.get("time_step", 0.002)  # 2ms for better resolution
            pre_emphasis_from = options.get("pre_emphasis_from", 50.0)  # Standard pre-emphasis frequency

            # Extract formants
            formant = sound.to_formant_burg(
                time_step=time_step,
                max_number_of_formants=max_formants,
                maximum_formant=max_freq_hz,
                window_length=window_length,
                pre_emphasis_from=pre_emphasis_from
            )

            # Extract contours for F1-F5
            time_values = []
            formant_contours = {f"f{i}": [] for i in range(1, max_formants + 1)}

            for i in range(formant.get_number_of_frames()):
                t = formant.get_time_from_frame_number(i + 1)
                time_values.append(float(t))

                for formant_num in range(1, max_formants + 1):
                    value = formant.get_value_at_time(
                        formant_number=formant_num,
                        time=t
                    )
                    if value and not np.isnan(value) and not np.isinf(value):
                        formant_contours[f"f{formant_num}"].append(float(value))
                    else:
                        formant_contours[f"f{formant_num}"].append(None)

            # Apply median filtering for smoothness
            smoothed_contours = {}
            for key, values in formant_contours.items():
                smoothed_contours[key] = self._smooth_formant(values)

            # Calculate statistics
            summary = {}
            for formant_num in range(1, max_formants + 1):
                key = f"f{formant_num}"
                valid_values = [v for v in smoothed_contours[key] if v is not None]

                if valid_values:
                    values_array = np.array(valid_values)
                    summary[key] = {
                        "mean_hz": float(np.mean(values_array)),
                        "std_hz": float(np.std(values_array)),
                        "min_hz": float(np.min(values_array)),
                        "max_hz": float(np.max(values_array))
                    }
                else:
                    summary[key] = {
                        "mean_hz": None,
                        "std_hz": None,
                        "min_hz": None,
                        "max_hz": None
                    }

            return {
                "contour": {
                    "time": time_values,
                    **smoothed_contours
                },
                "summary": summary,
                "extraction_params": {
                    "max_formants": max_formants,
                    "max_freq_hz": max_freq_hz,
                    "window_length": window_length,
                    "time_step": time_step,
                    "pre_emphasis_from": pre_emphasis_from
                }
            }

        except Exception as e:
            return {
                "error": str(e),
                "contour": {"time": []},
                "summary": {}
            }

    def _smooth_formant(self, values: List[float], kernel_size: int = 5) -> List[float]:
        """
        Apply median filtering to formant contour.

        Only filters continuous valid segments, preserving None values.
        """
        if len(values) < kernel_size:
            return values

        # Convert None to NaN for processing
        array = np.array([v if v is not None else np.nan for v in values])

        # Find valid segments
        valid_mask = ~np.isnan(array)
        if not np.any(valid_mask):
            return values

        # Apply median filter only to continuous valid segments
        try:
            result = []
            i = 0
            while i < len(array):
                if valid_mask[i]:
                    # Find end of valid segment
                    j = i
                    while j < len(array) and valid_mask[j]:
                        j += 1

                    # Extract valid segment
                    segment = array[i:j]

                    # Apply median filter only if segment is long enough
                    if len(segment) >= kernel_size:
                        filtered_segment = medfilt(segment, kernel_size=kernel_size)
                        result.extend(filtered_segment.tolist())
                    else:
                        # Keep original values for short segments
                        result.extend(segment.tolist())

                    i = j
                else:
                    # Keep None for invalid values
                    result.append(None)
                    i += 1

            return result
        except Exception as e:
            # If filtering fails, return original values
            return values
