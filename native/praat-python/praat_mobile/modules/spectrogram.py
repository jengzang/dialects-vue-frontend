"""
Spectrogram extraction module.
"""
import numpy as np
from typing import Dict, Any, List
from . import AnalysisModule, register_module


@register_module("spectrogram")
class SpectrogramModule(AnalysisModule):
    """Extract spectrogram (time-frequency representation)."""

    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Extract spectrogram.

        Args:
            sound: Parselmouth Sound object
            options: Module options
            mode: Analysis mode

        Returns:
            Dictionary with spectrogram data
        """
        try:
            import parselmouth

            # Get options with defaults
            window_length = options.get('window_length', 0.005)  # 5ms
            time_step = options.get('time_step', 0.002)  # 2ms
            frequency_step = options.get('frequency_step', 20.0)  # 20 Hz
            max_frequency = options.get('max_frequency', 8000.0)  # 8000 Hz

            # Create spectrogram (window_shape is optional, use default)
            spectrogram = sound.to_spectrogram(
                window_length=window_length,
                maximum_frequency=max_frequency,
                time_step=time_step,
                frequency_step=frequency_step
            )

            # Extract time values
            time_values = []
            for i in range(spectrogram.nx):
                t = spectrogram.x1 + i * spectrogram.dx
                time_values.append(float(t))

            # Extract frequency values
            freq_values = []
            for i in range(spectrogram.ny):
                f = spectrogram.y1 + i * spectrogram.dy
                freq_values.append(float(f))

            # Extract energy matrix (time x frequency)
            energy_matrix = []
            for i in range(spectrogram.nx):
                time_slice = []
                for j in range(spectrogram.ny):
                    value = spectrogram.values[j][i]
                    # Convert to dB, handle invalid values
                    if value > 0 and not np.isnan(value) and not np.isinf(value):
                        db_value = 10 * np.log10(value)
                    else:
                        db_value = -100.0  # Minimum value for silence
                    time_slice.append(float(db_value))
                energy_matrix.append(time_slice)

            # Calculate summary statistics
            valid_values = [v for row in energy_matrix for v in row if v > -100]
            if valid_values:
                summary = {
                    "mean_db": float(np.mean(valid_values)),
                    "min_db": float(np.min(valid_values)),
                    "max_db": float(np.max(valid_values)),
                    "std_db": float(np.std(valid_values))
                }
            else:
                summary = {
                    "mean_db": None,
                    "min_db": None,
                    "max_db": None,
                    "std_db": None
                }

            return {
                "time": time_values,
                "frequency": freq_values,
                "energy_db": energy_matrix,  # 2D array: [time][frequency]
                "summary": summary
            }

        except Exception as e:
            return {
                "error": str(e),
                "time": [],
                "frequency": [],
                "energy_db": [],
                "summary": {}
            }
