import sys
import types
import importlib.util
from pathlib import Path

CONTENT_AGENT_PATH = Path(r"c:\Users\PC\ServiceApp\myserviceprovider-app\Agents\content_agent.py")


def load_content_agent_module():
    spec = importlib.util.spec_from_file_location("content_agent_module", str(CONTENT_AGENT_PATH))
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_adapters_return_none_when_modules_missing(monkeypatch):
    # Ensure any prior fake modules removed
    for name in ("sonic_research_team", "paintswap_tools", "agent_ui.Agents.sonic_research_team", "agent_ui.Agents.paintswap_tools"):
        if name in sys.modules:
            del sys.modules[name]

    ca = load_content_agent_module()

    assert ca.get_sonic_finance_snippet() is None
    assert ca.get_paintswap_stats() is None


def test_adapters_with_fake_modules(monkeypatch):
    # Create fake sonic_research_team
    fake_srt = types.ModuleType("sonic_research_team")

    def fake_market_summary():
        return "Sonic market summary: BTC up 4%, ETH up 3%"

    fake_srt.get_market_summary = fake_market_summary

    # Create fake paintswap_tools
    fake_pt = types.ModuleType("paintswap_tools")

    def fake_get_stats(limit=3):
        return {"top_collections": [f"col_{i}" for i in range(limit)], "count": limit}

    fake_pt.get_paintswap_stats = fake_get_stats

    # Inject into sys.modules before loading content agent
    sys.modules["sonic_research_team"] = fake_srt
    sys.modules["paintswap_tools"] = fake_pt

    ca = load_content_agent_module()

    snippet = ca.get_sonic_finance_snippet()
    assert snippet is not None and "Sonic market summary" in snippet

    stats = ca.get_paintswap_stats(limit_items=2)
    assert isinstance(stats, dict)
    assert stats.get("count") == 2


if __name__ == "__main__":
    # Run tests manually
    m = load_content_agent_module()
    print('sonic snippet (no module):', m.get_sonic_finance_snippet())
    print('paintswap stats (no module):', m.get_paintswap_stats())
