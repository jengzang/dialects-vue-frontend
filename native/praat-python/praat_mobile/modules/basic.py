"""
Basic acoustic analysis module.
"""
import numpy as np
from typing import Dict, Any
from . import AnalysisModule, register_module


@register_module("basic")
class BasicModule(AnalysisModule):
    """Extract basic acoustic features."""

    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Extract basic features: duration, RMS, peak, silence ratio.

        Args:
            sound: Parselmouth Sound object
            options: Module options (unused)
            mode: Analysis mode

        Returns:
            Dictionary with basic features
        """
        try:
            import parselmouth

            # Duration
            duration_s = sound.get_total_duration()

            # Get intensity
            intensity = sound.to_intensity()

            # RMS and peak
            values = sound.values[0]  # First channel
            rms = np.sqrt(np.mean(values ** 2))
            peak = np.max(np.abs(values))

            # Convert to dB
            rms_db = 20 * np.log10(rms + 1e-10)
            peak_db = 20 * np.log10(peak + 1e-10)

            # Silence ratio (intensity < 40 dB)
            silence_threshold = 40.0
            intensity_values = intensity.values[0]
            silence_frames = np.sum(intensity_values < silence_threshold)
            total_frames = len(intensity_values)
            silence_ratio = silence_frames / total_frames if total_frames > 0 else 0.0

            return {
                "duration_s": float(duration_s),
                "rms_db": float(rms_db),
                "peak_db": float(peak_db),
                "silence_ratio": float(silence_ratio),
                "sample_rate": int(sound.sampling_frequency),
                "n_samples": int(sound.n_samples),
                "n_channels": int(sound.n_channels)
            }

        except Exception as e:
            return {
                "error": str(e),
                "duration_s": None,
                "rms_db": None,
                "peak_db": None,
                "silence_ratio": None
            }
