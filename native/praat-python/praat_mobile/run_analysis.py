from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import parselmouth

from .modules import MODULES
from .result_builder import build_result_json

TEMPORARY_AUDIO_POLICY = {
    "original_input": "delete-after-analysis",
    "normalized_audio": "delete-after-analysis",
    "result_json": "retain",
    "run_metadata": "retain",
}


def _load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


def _normalize_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    options = dict(settings.get("options") or {})

    for source_key, target_key in [
        ("pitch_options", "pitch"),
        ("formant_options", "formant"),
        ("intensity_options", "intensity"),
        ("spectrogram_options", "spectrogram"),
        ("voice_quality_options", "voice_quality"),
        ("segments_options", "segments"),
    ]:
        if source_key in settings and target_key not in options:
            options[target_key] = settings[source_key]

    output_options = settings.get("output_options") or settings.get("output") or {}

    return {
        "mode": settings.get("mode", "single"),
        "modules": list(settings.get("modules") or ["basic", "pitch", "intensity", "formant"]),
        "options": options,
        "output_options": output_options,
        "created_at": settings.get("created_at") or datetime.now(timezone.utc).isoformat(),
    }


def _audio_metadata(sound) -> Dict[str, Any]:
    return {
        "duration_s": sound.get_total_duration(),
        "sample_rate": getattr(sound, "sampling_frequency", None),
        "channels": getattr(sound, "n_channels", None),
        "format": "wav",
    }


def run_analysis(
    *,
    wav_path: str | Path,
    settings: Dict[str, Any],
    client_run_id: str,
) -> Dict[str, Any]:
    wav_path = Path(wav_path)
    if wav_path.suffix.lower() != ".wav":
        raise ValueError("Mobile local Praat analysis accepts WAV files only")
    if not wav_path.exists():
        raise FileNotFoundError(f"WAV file not found: {wav_path}")

    sound = parselmouth.Sound(str(wav_path))
    job_data = _normalize_settings(settings)
    module_results = {}

    for module_name in job_data["modules"]:
        if module_name not in MODULES:
            raise ValueError(f"Unknown Praat module: {module_name}")

        module_options = job_data["options"].get(module_name, {})
        if module_name == "voice_quality" and not module_options.get("f0_min"):
            pitch_options = job_data["options"].get("pitch", {})
            if pitch_options:
                module_options = {
                    "f0_min": pitch_options.get("f0_min", 75.0),
                    "f0_max": pitch_options.get("f0_max", 600.0),
                    **module_options,
                }

        module_results[module_name] = MODULES[module_name]().analyze(
            sound,
            module_options,
            job_data["mode"],
        )

    return build_result_json(
        job_id=f"{client_run_id}_local_job_1",
        task_id=client_run_id,
        job_data=job_data,
        module_results=module_results,
        audio_metadata=_audio_metadata(sound),
        sound=sound,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run local mobile Praat analysis")
    parser.add_argument("--wav", required=True, help="Path to a WAV file")
    parser.add_argument("--settings", required=True, help="Path to analysis settings JSON")
    parser.add_argument("--client-run-id", required=True, help="Client-generated run id")
    parser.add_argument("--result", required=True, help="Path to write result JSON")
    parser.add_argument("--meta", required=True, help="Path to write run metadata JSON")
    args = parser.parse_args()

    started_at = datetime.now(timezone.utc)
    settings = _load_json(Path(args.settings))
    result = run_analysis(
        wav_path=args.wav,
        settings=settings,
        client_run_id=args.client_run_id,
    )
    completed_at = datetime.now(timezone.utc)

    _write_json(Path(args.result), result)
    _write_json(Path(args.meta), {
        "client_run_id": args.client_run_id,
        "engine": "python-parselmouth",
        "started_at": started_at.isoformat(),
        "completed_at": completed_at.isoformat(),
        "elapsed_ms": int((completed_at - started_at).total_seconds() * 1000),
        "temporary_audio_policy": TEMPORARY_AUDIO_POLICY,
        "status": "completed",
    })


if __name__ == "__main__":
    main()
