import re
from html import unescape
from html.parser import HTMLParser


class TafsirHTMLToPlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        classes = attr_map.get("class", "")
        if tag in {"script", "style"} or "arabic" in classes or "uthmani" in classes:
            self.skip_depth += 1
            return
        if tag in {"p", "br", "div", "li", "h1", "h2", "h3"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if self.skip_depth > 0:
            self.skip_depth -= 1
            return
        if tag in {"p", "div", "li"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self.skip_depth > 0:
            return
        text = data.strip()
        if text:
            self.parts.append(text)

    def get_text(self) -> str:
        text = " ".join(self.parts)
        text = re.sub(r"[ \t\r\f\v]+", " ", text)
        text = re.sub(r"\n\s+", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return unescape(text).strip()


def strip_tafsir_html(html_text: str) -> str:
    parser = TafsirHTMLToPlainText()
    parser.feed(html_text)
    return parser.get_text()


def extract_tafsir_text(data: dict, edition_id: str) -> str:
    results = data.get("results") or {}
    passages = results.get(edition_id) or []
    if not passages:
        return ""

    html_text = passages[0].get("text", "")
    if not isinstance(html_text, str):
        return ""

    return strip_tafsir_html(html_text)
