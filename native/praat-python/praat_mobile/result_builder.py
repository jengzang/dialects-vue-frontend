from __future__ import annotations

from typing import Any, Dict

from .tone_features import extract_tone_features, sanitize_json


def build_result_json(
    job_id: str,
    task_id: str,
    job_data: Dict[str, Any],
    module_results: Dict[str, Any],
    audio_metadata: Dict[str, Any],
    sound,
) -> Dict[str, Any]:
    meta = {
        "job_id": job_id,
        "task_id": task_id,
        "mode": job_data.get("mode"),
        "modules": job_data.get("modules"),
        "created_at": job_data.get("created_at"),
        "duration_s": audio_metadata.get("duration_s"),
        "sample_rate": audio_metadata.get("sample_rate"),
        "channels": audio_metadata.get("channels"),
    }

    summary = {}
    for module_name, result in module_results.items():
        if "error" in result:
            continue
        if "summary" in result:
            summary[module_name] = result["summary"]
        else:
            summary[module_name] = result

    output_opts = job_data.get("output_options", {})
    include_timeseries = output_opts.get("include_timeseries", True)

    timeseries = None
    if include_timeseries:
        timeseries = {}

        if "pitch" in module_results and "contour" in module_results["pitch"]:
            pitch_contour = module_results["pitch"]["contour"]
            timeseries["time"] = pitch_contour.get("time", [])
            timeseries["pitch_hz"] = pitch_contour.get("f0_hz", [])

        if "intensity" in module_results and "contour" in module_results["intensity"]:
            intensity_contour = module_results["intensity"]["contour"]
            if "time" not in timeseries:
                timeseries["time"] = intensity_contour.get("time", [])
            timeseries["intensity_db"] = intensity_contour.get("intensity_db", [])

        if "formant" in module_results and "contour" in module_results["formant"]:
            formant_contour = module_results["formant"]["contour"]
            timeseries["formants"] = {
                key: value for key, value in formant_contour.items() if key.startswith("f")
            }

        downsample_hz = output_opts.get("downsample_hz")
        if downsample_hz and timeseries.get("time"):
            timeseries = downsample_timeseries(timeseries, downsample_hz)

    segments_list = []
    if "segments" in module_results:
        segments_list = module_results["segments"].get("segments", [])

    pitch_contour = None
    pitch_times = None
    speaker_ref = None

    if "pitch" in module_results and "contour" in module_results["pitch"]:
        pitch_data = module_results["pitch"]["contour"]
        pitch_times = pitch_data.get("time", [])
        pitch_contour = pitch_data.get("f0_hz", [])
        speaker_ref = module_results["pitch"].get("speaker_ref")

    if pitch_contour and pitch_times:
        for segment in segments_list:
            if segment["type"] in ["rime_core", "syllable_like"]:
                segment["tone_features"] = extract_tone_features(
                    pitch_contour=pitch_contour,
                    time_values=pitch_times,
                    segment_start=segment["start_s"],
                    segment_end=segment["end_s"],
                    speaker_ref=speaker_ref,
                )

    units = build_units(segments_list, job_data.get("mode"))

    debug = None
    if output_opts.get("include_debug", False):
        debug = {
            "module_results": module_results,
        }

    spectrogram_data = None
    if "spectrogram" in module_results and "error" not in module_results["spectrogram"]:
        spectrogram_data = {
            "time": module_results["spectrogram"]["time"],
            "frequency": module_results["spectrogram"]["frequency"],
            "energy_db": module_results["spectrogram"]["energy_db"],
        }

    return sanitize_json({
        "schema": "praat-analysis",
        "meta": meta,
        "summary": summary,
        "timeseries": timeseries,
        "spectrogram": spectrogram_data,
        "segments": segments_list,
        "units": units,
        "debug": debug,
    })


def build_units(segments: list, mode: str) -> list:
    units = []

    if mode == "single":
        if segments:
            start_s = min(segment["start_s"] for segment in segments)
            end_s = max(segment["end_s"] for segment in segments)

            tone_features = None
            for segment in segments:
                if segment["type"] == "rime_core" and "tone_features" in segment:
                    tone_features = segment["tone_features"]
                    break

            units.append({
                "unit_id": 0,
                "start_s": start_s,
                "end_s": end_s,
                "segments": list(range(len(segments))),
                "tone_features": tone_features,
            })
    else:
        syllable_segments = [
            (index, segment)
            for index, segment in enumerate(segments)
            if segment["type"] == "syllable_like"
        ]

        for unit_id, (segment_index, segment) in enumerate(syllable_segments):
            units.append({
                "unit_id": unit_id,
                "start_s": segment["start_s"],
                "end_s": segment["end_s"],
                "segments": [segment_index],
                "tone_features": segment.get("tone_features"),
            })

    return units


def downsample_timeseries(timeseries: Dict[str, Any], target_hz: int) -> Dict[str, Any]:
    import numpy as np

    if "time" not in timeseries or not timeseries["time"]:
        return timeseries

    times = np.array(timeseries["time"])
    if len(times) < 2:
        return timeseries

    dt = np.mean(np.diff(times))
    current_hz = 1.0 / dt

    if current_hz <= target_hz:
        return timeseries

    factor = int(current_hz / target_hz)
    if factor < 2:
        return timeseries

    downsampled = {}
    for key, values in timeseries.items():
        if isinstance(values, list) and len(values) == len(times):
            downsampled[key] = values[::factor]
        elif isinstance(values, dict):
            downsampled[key] = {
                nested_key: nested_value[::factor]
                if isinstance(nested_value, list) and len(nested_value) == len(times)
                else nested_value
                for nested_key, nested_value in values.items()
            }
        else:
            downsampled[key] = values

    return downsampled
