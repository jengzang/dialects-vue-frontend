"""
Segmentation module with mode-specific strategies.
"""
import numpy as np
from typing import Dict, Any, List, Tuple
from . import AnalysisModule, register_module


@register_module("segments")
class SegmentsModule(AnalysisModule):
    """Segment audio into meaningful units."""

    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Segment audio based on mode.

        Single mode: silence -> voiced -> rime_core
        Continuous mode: silence -> speech -> voiced -> syllable_like

        Args:
            sound: Parselmouth Sound object
            options: Module options
            mode: Analysis mode (single | continuous)

        Returns:
            Dictionary with segments list
        """
        try:
            import parselmouth

            # Extract intensity and pitch
            intensity = sound.to_intensity()
            pitch = sound.to_pitch()

            if mode == "single":
                segments = self._segment_single(sound, intensity, pitch)
            else:  # continuous
                segments = self._segment_continuous(sound, intensity, pitch)

            return {
                "segments": segments,
                "mode": mode
            }

        except Exception as e:
            return {
                "error": str(e),
                "segments": [],
                "mode": mode
            }

    def _segment_single(self, sound, intensity, pitch) -> List[Dict[str, Any]]:
        """Segment single syllable: silence, voiced, rime_core."""
        segments = []

        # Extract intensity and pitch contours
        intensity_times, intensity_values = self._extract_intensity(intensity)
        pitch_times, pitch_values = self._extract_pitch(pitch)

        # Detect silence (intensity < 40 dB)
        silence_threshold = 40.0
        silence_mask = np.array(intensity_values) < silence_threshold

        # Find speech region (non-silence)
        speech_frames = np.where(~silence_mask)[0]

        if len(speech_frames) == 0:
            # All silence
            segments.append({
                "type": "silence",
                "start_s": 0.0,
                "end_s": sound.get_total_duration(),
                "duration_s": sound.get_total_duration()
            })
            return segments

        # Leading silence
        if speech_frames[0] > 0:
            segments.append({
                "type": "silence",
                "start_s": 0.0,
                "end_s": intensity_times[speech_frames[0]],
                "duration_s": intensity_times[speech_frames[0]]
            })

        # Speech region
        speech_start = intensity_times[speech_frames[0]]
        speech_end = intensity_times[speech_frames[-1]]

        # Find voiced region within speech
        voiced_frames = []
        for i in speech_frames:
            # Find corresponding pitch frame
            t = intensity_times[i]
            pitch_idx = self._find_nearest_time_index(pitch_times, t)
            if pitch_idx is not None and pitch_values[pitch_idx] > 0:
                voiced_frames.append(i)

        if voiced_frames:
            voiced_start = intensity_times[voiced_frames[0]]
            voiced_end = intensity_times[voiced_frames[-1]]

            segments.append({
                "type": "voiced",
                "start_s": voiced_start,
                "end_s": voiced_end,
                "duration_s": voiced_end - voiced_start
            })

            # Find rime_core (stable F0 region in middle 60% of voiced)
            rime_duration = (voiced_end - voiced_start) * 0.6
            rime_start = voiced_start + (voiced_end - voiced_start) * 0.2
            rime_end = rime_start + rime_duration

            segments.append({
                "type": "rime_core",
                "start_s": rime_start,
                "end_s": rime_end,
                "duration_s": rime_duration
            })

        # Trailing silence
        if speech_frames[-1] < len(intensity_times) - 1:
            segments.append({
                "type": "silence",
                "start_s": speech_end,
                "end_s": sound.get_total_duration(),
                "duration_s": sound.get_total_duration() - speech_end
            })

        return segments

    def _segment_continuous(self, sound, intensity, pitch) -> List[Dict[str, Any]]:
        """Segment continuous speech: silence, speech, voiced, syllable_like."""
        segments = []

        # Extract contours
        intensity_times, intensity_values = self._extract_intensity(intensity)
        pitch_times, pitch_values = self._extract_pitch(pitch)

        # Detect silence and speech regions
        silence_threshold = 40.0
        intensity_array = np.array(intensity_values)
        silence_mask = intensity_array < silence_threshold

        # Find continuous regions
        regions = self._find_continuous_regions(~silence_mask)

        for start_idx, end_idx in regions:
            start_t = intensity_times[start_idx]
            end_t = intensity_times[end_idx]

            # Add speech segment
            segments.append({
                "type": "speech",
                "start_s": start_t,
                "end_s": end_t,
                "duration_s": end_t - start_t
            })

            # Find voiced regions within speech
            voiced_regions = self._find_voiced_regions(
                intensity_times[start_idx:end_idx+1],
                pitch_times,
                pitch_values
            )

            for v_start, v_end in voiced_regions:
                segments.append({
                    "type": "voiced",
                    "start_s": v_start,
                    "end_s": v_end,
                    "duration_s": v_end - v_start
                })

            # Detect syllable-like units (energy peaks + duration heuristics)
            syllables = self._detect_syllables(
                intensity_times[start_idx:end_idx+1],
                intensity_values[start_idx:end_idx+1]
            )

            for syl_start, syl_end in syllables:
                segments.append({
                    "type": "syllable_like",
                    "start_s": syl_start,
                    "end_s": syl_end,
                    "duration_s": syl_end - syl_start
                })

        # Add silence segments
        all_speech_times = [(s["start_s"], s["end_s"]) for s in segments if s["type"] == "speech"]
        silence_regions = self._find_silence_regions(all_speech_times, sound.get_total_duration())

        for sil_start, sil_end in silence_regions:
            segments.append({
                "type": "silence",
                "start_s": sil_start,
                "end_s": sil_end,
                "duration_s": sil_end - sil_start
            })

        # Sort by start time
        segments.sort(key=lambda x: x["start_s"])

        return segments

    def _extract_intensity(self, intensity) -> Tuple[List[float], List[float]]:
        """Extract intensity contour."""
        times = []
        values = []
        for i in range(intensity.nx):
            t = intensity.x1 + i * intensity.dx
            v = intensity.values[0][i]
            times.append(float(t))
            values.append(float(v) if not np.isnan(v) else 0.0)
        return times, values

    def _extract_pitch(self, pitch) -> Tuple[List[float], List[float]]:
        """Extract pitch contour."""
        times = []
        values = []
        for i in range(pitch.get_number_of_frames()):
            t = pitch.get_time_from_frame_number(i + 1)
            f0 = pitch.get_value_in_frame(i + 1)
            times.append(float(t))
            values.append(float(f0) if f0 and f0 > 0 else 0.0)
        return times, values

    def _find_nearest_time_index(self, times: List[float], target: float) -> int:
        """Find index of nearest time value."""
        times_array = np.array(times)
        idx = np.argmin(np.abs(times_array - target))
        return int(idx)

    def _find_continuous_regions(self, mask: np.ndarray, min_length: int = 3) -> List[Tuple[int, int]]:
        """Find continuous True regions in boolean mask."""
        regions = []
        in_region = False
        start = 0

        for i, val in enumerate(mask):
            if val and not in_region:
                start = i
                in_region = True
            elif not val and in_region:
                if i - start >= min_length:
                    regions.append((start, i - 1))
                in_region = False

        if in_region and len(mask) - start >= min_length:
            regions.append((start, len(mask) - 1))

        return regions

    def _find_voiced_regions(
        self,
        intensity_times: List[float],
        pitch_times: List[float],
        pitch_values: List[float]
    ) -> List[Tuple[float, float]]:
        """Find voiced regions within a time range."""
        voiced_mask = []
        for t in intensity_times:
            idx = self._find_nearest_time_index(pitch_times, t)
            voiced_mask.append(pitch_values[idx] > 0)

        regions = self._find_continuous_regions(np.array(voiced_mask), min_length=3)
        return [(intensity_times[start], intensity_times[end]) for start, end in regions]

    def _detect_syllables(
        self,
        times: List[float],
        intensity_values: List[float],
        min_duration: float = 0.05,
        max_duration: float = 0.5
    ) -> List[Tuple[float, float]]:
        """Detect syllable-like units based on energy peaks."""
        from scipy.signal import find_peaks

        intensity_array = np.array(intensity_values)

        # Find peaks
        peaks, _ = find_peaks(intensity_array, distance=5, prominence=3)

        syllables = []
        for peak in peaks:
            # Find boundaries around peak
            start_idx = max(0, peak - 10)
            end_idx = min(len(times) - 1, peak + 10)

            # Refine boundaries based on intensity drop
            threshold = intensity_array[peak] * 0.7
            while start_idx > 0 and intensity_array[start_idx] > threshold:
                start_idx -= 1
            while end_idx < len(times) - 1 and intensity_array[end_idx] > threshold:
                end_idx += 1

            start_t = times[start_idx]
            end_t = times[end_idx]
            duration = end_t - start_t

            if min_duration <= duration <= max_duration:
                syllables.append((start_t, end_t))

        return syllables

    def _find_silence_regions(
        self,
        speech_regions: List[Tuple[float, float]],
        total_duration: float
    ) -> List[Tuple[float, float]]:
        """Find silence regions between speech."""
        if not speech_regions:
            return [(0.0, total_duration)]

        silence = []

        # Leading silence
        if speech_regions[0][0] > 0.01:
            silence.append((0.0, speech_regions[0][0]))

        # Inter-speech silence
        for i in range(len(speech_regions) - 1):
            gap_start = speech_regions[i][1]
            gap_end = speech_regions[i + 1][0]
            if gap_end - gap_start > 0.01:
                silence.append((gap_start, gap_end))

        # Trailing silence
        if speech_regions[-1][1] < total_duration - 0.01:
            silence.append((speech_regions[-1][1], total_duration))

        return silence
