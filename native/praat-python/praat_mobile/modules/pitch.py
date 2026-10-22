"""
Pitch (F0) extraction module with auto-adaptive range.
"""
import numpy as np
from typing import Dict, Any, Tuple, List
from . import AnalysisModule, register_module


@register_module("pitch")
class PitchModule(AnalysisModule):
    """Extract pitch contour with two-phase auto-tuning."""

    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Extract pitch with auto-adaptive F0 range.

        Phase 1: Wide range extraction
        Phase 2: Auto-tune based on P5/P95, re-extract

        Args:
            sound: Parselmouth Sound object
            options: Pitch options (f0_min, f0_max, time_step)
            mode: Analysis mode

        Returns:
            Dictionary with pitch contour and statistics
        """
        try:
            import parselmouth

            # Get options
            f0_min_init = options.get("f0_min", 75.0)
            f0_max_init = options.get("f0_max", 600.0)
            time_step = options.get("time_step", 0.0)

            print(f"[PITCH DEBUG] Starting pitch extraction with f0_min={f0_min_init}, f0_max={f0_max_init}")

            # Phase 1: Wide range extraction
            # Note: time_step must be None or positive, not 0
            pitch_kwargs = {
                "pitch_floor": f0_min_init,
                "pitch_ceiling": f0_max_init
            }
            if time_step and time_step > 0:
                pitch_kwargs["time_step"] = time_step

            pitch_phase1 = sound.to_pitch(**pitch_kwargs)

            print(f"[PITCH DEBUG] Phase 1 complete, frames={pitch_phase1.get_number_of_frames()}")

            # Extract valid F0 values
            f0_values_phase1 = []
            for i in range(pitch_phase1.get_number_of_frames()):
                f0 = pitch_phase1.get_value_in_frame(i + 1)
                if f0 and f0 > 0:
                    f0_values_phase1.append(f0)

            print(f"[PITCH DEBUG] Phase 1 valid F0 values: {len(f0_values_phase1)}/{pitch_phase1.get_number_of_frames()}")

            # Phase 2: Auto-tune if enough valid values
            if len(f0_values_phase1) >= 10:
                f0_array = np.array(f0_values_phase1)
                p5 = np.percentile(f0_array, 5)
                p95 = np.percentile(f0_array, 95)

                # Adjust range with margin
                f0_min_tuned = max(30.0, p5 * 0.75)
                f0_max_tuned = min(1000.0, p95 * 1.25)

                print(f"[PITCH DEBUG] Phase 2: Auto-tuned range {f0_min_tuned:.1f}-{f0_max_tuned:.1f} Hz")

                # Re-extract with tuned range
                pitch_kwargs_tuned = {
                    "pitch_floor": f0_min_tuned,
                    "pitch_ceiling": f0_max_tuned
                }
                if time_step and time_step > 0:
                    pitch_kwargs_tuned["time_step"] = time_step

                pitch = sound.to_pitch(**pitch_kwargs_tuned)
            else:
                # Not enough data, use phase 1 result
                print(f"[PITCH DEBUG] Not enough valid F0 values, using phase 1 result")
                pitch = pitch_phase1
                f0_min_tuned = f0_min_init
                f0_max_tuned = f0_max_init

            # Extract final contour
            time_values, f0_values = self._extract_contour(pitch)

            print(f"[PITCH DEBUG] Final contour: {len(time_values)} time points, {len([f for f in f0_values if f > 0])} voiced frames")

            # Calculate statistics
            valid_f0 = [f0 for f0 in f0_values if f0 and f0 > 0]

            if valid_f0:
                f0_array = np.array(valid_f0)
                speaker_ref = {
                    "p5": float(np.percentile(f0_array, 5)),
                    "p50": float(np.percentile(f0_array, 50)),
                    "p95": float(np.percentile(f0_array, 95))
                }
                summary = {
                    "mean_f0": float(np.mean(f0_array)),
                    "min_f0": float(np.min(f0_array)),
                    "max_f0": float(np.max(f0_array)),
                    "std_f0": float(np.std(f0_array)),
                    "voiced_frames": len(valid_f0),
                    "total_frames": len(f0_values),
                    "voiced_ratio": len(valid_f0) / len(f0_values)
                }
                print(f"[PITCH DEBUG] Summary: mean_f0={summary['mean_f0']:.1f} Hz, voiced_ratio={summary['voiced_ratio']:.2%}")
            else:
                print(f"[PITCH DEBUG] WARNING: No valid F0 values found!")
                speaker_ref = {"p5": None, "p50": None, "p95": None}
                summary = {
                    "mean_f0": None,
                    "min_f0": None,
                    "max_f0": None,
                    "std_f0": None,
                    "voiced_frames": 0,
                    "total_frames": len(f0_values),
                    "voiced_ratio": 0.0
                }

            result = {
                "contour": {
                    "time": time_values,
                    "f0_hz": f0_values
                },
                "summary": summary,
                "speaker_ref": speaker_ref,
                "extraction_params": {
                    "f0_min": float(f0_min_tuned),
                    "f0_max": float(f0_max_tuned),
                    "time_step": float(time_step) if time_step > 0 else "auto"
                }
            }

            print(f"[PITCH DEBUG] Returning result with {len(result['contour']['time'])} time points")
            return result

        except Exception as e:
            print(f"[PITCH DEBUG] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "contour": {"time": [], "f0_hz": []},
                "summary": {},
                "speaker_ref": {}
            }

    def _extract_contour(self, pitch) -> Tuple[List[float], List[float]]:
        """Extract time and F0 values from Pitch object."""
        time_values = []
        f0_values = []

        for i in range(pitch.get_number_of_frames()):
            t = pitch.get_time_from_frame_number(i + 1)
            f0 = pitch.get_value_in_frame(i + 1)

            time_values.append(float(t))
            # Store 0 for unvoiced, not None (for easier processing)
            f0_values.append(float(f0) if f0 and f0 > 0 else 0.0)

        return time_values, f0_values
