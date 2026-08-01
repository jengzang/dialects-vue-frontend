"""
Analysis module base classes and registry.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any


class AnalysisModule(ABC):
    """Base class for analysis modules."""

    @abstractmethod
    def analyze(self, sound, options: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """
        Analyze audio.

        Args:
            sound: Parselmouth Sound object
            options: Module-specific options
            mode: Analysis mode (single | continuous)

        Returns:
            Analysis results dictionary
        """
        pass


# Module registry
MODULES = {}


def register_module(name: str):
    """Decorator to register analysis module."""
    def decorator(cls):
        MODULES[name] = cls
        return cls
    return decorator


# Import all modules to register them
from . import basic, pitch, intensity, formant, voice_quality, segments, spectrogram
