"""Mobile Praat Python runner package.

This package intentionally contains only local analysis code. Backend
HTTP routes, multi-worker task state, heartbeat, timeout, and cleanup
services stay on the server.
"""

__all__ = ["run_analysis"]
