"""Shared LLM prompt fragments — keep wording DRY across OpenAI calls."""

ENGLISH_ONLY_INSTRUCTION = (
    "Respond in English only. Do not use any other language in your reply. "
    "Follow the output format instructions above exactly."
)


def append_english_only(prompt: str) -> str:
    return f"{prompt.strip()}\n\n{ENGLISH_ONLY_INSTRUCTION}"
