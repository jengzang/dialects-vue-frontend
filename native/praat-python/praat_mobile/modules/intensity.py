"""
Intensity extraction module.
"""
import numpy as np
from typing import Dict, Any, List, Tuple
from . import AnalysisModule, register_module


@register_module("intensity")
class IntensityModule(AnalysisModule):
    """Extract intensity contour."""

    # Minimum valid intensity threshold (dB)
    # Values below this are considered silence/invalid
    MIN_INTENSITY_DB = -50.0

    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Extract intensity contour.

        Args:
            sound: Parselmouth Sound object
            options: Module options
            mode: Analysis mode

        Returns:
            Dictionary with intensity contour and statistics
        """
        try:
            import parselmouth

            # Extract intensity
            intensity = sound.to_intensity()

            # Extract contour
            time_values, intensity_values = self._extract_contour(intensity)

            # Calculate statistics
            valid_intensity = [i for i in intensity_values if i and not np.isnan(i) and not np.isinf(i)]

            if valid_intensity:
                intensity_array = np.array(valid_intensity)
                summary = {
                    "mean_db": float(np.mean(intensity_array)),
                    "min_db": float(np.min(intensity_array)),
                    "max_db": float(np.max(intensity_array)),
                    "std_db": float(np.std(intensity_array))
                }
            else:
                summary = {
                    "mean_db": None,
                    "min_db": None,
                    "max_db": None,
                    "std_db": None
                }

            return {
                "contour": {
                    "time": time_values,
                    "intensity_db": intensity_values
                },
                "summary": summary
            }

        except Exception as e:
            return {
                "error": str(e),
                "contour": {"time": [], "intensity_db": []},
                "summary": {}
            }

    def _extract_contour(self, intensity) -> Tuple[List[float], List[float]]:
        """Extract time and intensity values."""
        time_values = []
        intensity_values = []

        for i in range(intensity.nx):
            t = intensity.x1 + i * intensity.dx
            value = intensity.values[0][i]

            time_values.append(float(t))

            # Filter out invalid values:
            # - NaN values
            # - Extreme negative values (< MIN_INTENSITY_DB)
            if np.isnan(value) or value < self.MIN_INTENSITY_DB:
                intensity_values.append(None)
            else:
                intensity_values.append(float(value))

        return time_values, intensity_values
