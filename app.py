from __future__ import annotations

import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
STATIC_DIR = APP_DIR / "static"
APP_DB = DATA_DIR / "gutty.db"
DEFAULT_PORT = 8420

BRISTOL_TYPES = {
    1: "Hard separate lumps",
    2: "Lumpy sausage",
    3: "Cracked sausage",
    4: "Smooth soft sausage",
    5: "Soft blobs",
    6: "Mushy fluffy pieces",
    7: "Watery liquid",
}

COLOR_NOTES = {
    "brown": "Brown is the usual baseline.",
    "green": "Green can happen with leafy foods, coloring, or faster transit.",
    "yellow": "Yellow can be food-related, but persistent greasy yellow stool is worth checking.",
    "black": "Black can come from iron or bismuth, but tarry black stool can be urgent.",
    "red": "Red can come from foods, but blood-red stool should be taken seriously.",
    "pale": "Pale or clay-colored stool can point to bile-flow issues if it persists.",
}

URGENT_FLAGS = {
    "blood": "blood in stool",
    "black_tarry": "black or tarry stool",
    "severe_pain": "severe belly pain",
    "fever": "fever",
    "dehydration": "dehydration symptoms",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db_connection(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_DIR.mkdir(parents=True, exist_ok=True)


def init_db() -> None:
    ensure_dirs()
    with closing(db_connection(APP_DB)) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS poop_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                logged_at TEXT NOT NULL,
                bristol_type INTEGER NOT NULL,
                color TEXT NOT NULL,
                amount TEXT NOT NULL,
                urgency INTEGER NOT NULL,
                comfort INTEGER NOT NULL,
                hydration INTEGER NOT NULL,
                fiber INTEGER NOT NULL,
                stress INTEGER NOT NULL,
                notes TEXT NOT NULL,
                flags TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS community_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                log_id INTEGER,
                display_name TEXT NOT NULL,
                story TEXT NOT NULL,
                suggestion TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(log_id) REFERENCES poop_logs(id)
            );
            """
        )
        conn.commit()


def clean_text(value: Any, fallback: str = "") -> str:
    return str(value or fallback).strip()[:800]


def parse_flags(payload: dict[str, Any]) -> list[str]:
    flags = payload.get("flags") or []
    if not isinstance(flags, list):
        return []
    return [str(flag) for flag in flags if str(flag) in URGENT_FLAGS]


def clamp_int(value: Any, minimum: int, maximum: int, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = fallback
    return max(minimum, min(parsed, maximum))


def add_poop_log(payload: dict[str, Any]) -> dict[str, Any]:
    bristol_type = clamp_int(payload.get("bristol_type"), 1, 7, 4)
    logged_at = clean_text(payload.get("logged_at")) or utc_now()
    color = clean_text(payload.get("color"), "brown").lower()
    amount = clean_text(payload.get("amount"), "medium").lower()
    flags = parse_flags(payload)

    with closing(db_connection(APP_DB)) as conn:
        cursor = conn.execute(
            """
            INSERT INTO poop_logs (
                logged_at, bristol_type, color, amount, urgency, comfort,
                hydration, fiber, stress, notes, flags, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                logged_at,
                bristol_type,
                color,
                amount,
                clamp_int(payload.get("urgency"), 1, 5, 3),
                clamp_int(payload.get("comfort"), 1, 5, 4),
                clamp_int(payload.get("hydration"), 1, 5, 3),
                clamp_int(payload.get("fiber"), 1, 5, 3),
                clamp_int(payload.get("stress"), 1, 5, 3),
                clean_text(payload.get("notes")),
                json.dumps(flags),
                utc_now(),
            ),
        )
        conn.commit()
        return {"ok": True, "id": int(cursor.lastrowid)}


def add_community_post(payload: dict[str, Any]) -> dict[str, Any]:
    display_name = clean_text(payload.get("display_name"), "anonymous gut scout")[:80]
    story = clean_text(payload.get("story"))
    suggestion = clean_text(payload.get("suggestion"))
    log_id = payload.get("log_id")
    log_id = int(log_id) if str(log_id or "").isdigit() else None
    if not story or not suggestion:
        raise ValueError("Story and suggestion are required.")

    with closing(db_connection(APP_DB)) as conn:
        cursor = conn.execute(
            """
            INSERT INTO community_posts (log_id, display_name, story, suggestion, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (log_id, display_name, story, suggestion, utc_now()),
        )
        conn.commit()
        return {"ok": True, "id": int(cursor.lastrowid)}


def decode_flags(raw: str) -> list[str]:
    try:
        flags = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    return [str(flag) for flag in flags if str(flag) in URGENT_FLAGS]


def row_to_log(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["flags"] = decode_flags(item.get("flags", "[]"))
    item["bristol_label"] = BRISTOL_TYPES.get(int(item["bristol_type"]), "Unknown")
    return item


def build_patterns(logs: list[dict[str, Any]]) -> list[dict[str, str]]:
    if not logs:
        return [
            {
                "tone": "info",
                "title": "Your gut needs a baseline",
                "detail": "Log three situations and Gutty can start comparing texture, color, urgency, comfort, hydration, fiber, and stress.",
            }
        ]

    recent = logs[:7]
    urgent = [flag for log in recent for flag in log["flags"]]
    if urgent:
        return [
            {
                "tone": "urgent",
                "title": "Do not crowdsource this one",
                "detail": f"You marked {', '.join(URGENT_FLAGS[flag] for flag in sorted(set(urgent)))}. Consider calling a clinician, urgent care, or emergency services if symptoms are severe.",
            }
        ]

    patterns: list[dict[str, str]] = []
    avg_bristol = sum(int(log["bristol_type"]) for log in recent) / len(recent)
    avg_hydration = sum(int(log["hydration"]) for log in recent) / len(recent)
    avg_fiber = sum(int(log["fiber"]) for log in recent) / len(recent)
    avg_stress = sum(int(log["stress"]) for log in recent) / len(recent)
    avg_comfort = sum(int(log["comfort"]) for log in recent) / len(recent)

    if avg_bristol <= 2.4:
        patterns.append(
            {
                "tone": "warning",
                "title": "Harder stools are trending",
                "detail": "Types 1-2 often show up with constipation patterns. Water, fiber, movement, and routine timing are the usual first things to review.",
            }
        )
    elif avg_bristol >= 5.8:
        patterns.append(
            {
                "tone": "warning",
                "title": "Looser stools are trending",
                "detail": "Types 6-7 can happen with illness, stress, alcohol, caffeine, or food triggers. Hydration matters if this keeps happening.",
            }
        )
    else:
        patterns.append(
            {
                "tone": "good",
                "title": "Texture looks mostly in range",
                "detail": "Your recent logs are clustering near Bristol types 3-5, which is usually the calmer middle of the stool chart.",
            }
        )

    odd_colors = [log["color"] for log in recent if log["color"] in {"black", "red", "pale", "yellow"}]
    if odd_colors:
        color = odd_colors[0]
        patterns.append(
            {
                "tone": "warning" if color in {"black", "red", "pale"} else "info",
                "title": f"{color.title()} color note",
                "detail": COLOR_NOTES.get(color, "Color changes can be food-related, but persistence is worth tracking."),
            }
        )

    if avg_hydration <= 2.3:
        patterns.append(
            {
                "tone": "info",
                "title": "Hydration is a suspect",
                "detail": "Low hydration scores can make stools harder and bowel movements less comfortable.",
            }
        )

    if avg_fiber <= 2.3:
        patterns.append(
            {
                "tone": "info",
                "title": "Fiber could use backup",
                "detail": "A gradual fiber bump from beans, oats, fruit, vegetables, nuts, or seeds may help. Go slowly so your gut does not stage a protest.",
            }
        )

    if avg_stress >= 4 and avg_comfort <= 3:
        patterns.append(
            {
                "tone": "info",
                "title": "Stress may be in the chat",
                "detail": "Stress and gut motility are annoyingly close friends. A calmer pre-bathroom routine may be worth testing.",
            }
        )

    return patterns[:4]


def build_gut_score(logs: list[dict[str, Any]]) -> dict[str, Any]:
    if not logs:
        return {
            "score": 50,
            "headline": "Gutty is waiting for the first field report",
            "summary": "Everyone says trust your gut. First, let us find out whether your gut is behaving like a reliable narrator.",
            "next_step": "Log your next poop situation with Bristol type, color, comfort, hydration, fiber, stress, and any red flags.",
        }

    recent = logs[:7]
    score = 82
    for log in recent:
        bristol_type = int(log["bristol_type"])
        if bristol_type in {1, 2, 6, 7}:
            score -= 5
        if log["color"] in {"black", "red", "pale"}:
            score -= 8
        if log["flags"]:
            score -= 20
        score += int(log["hydration"]) - 3
        score += int(log["fiber"]) - 3
        score += int(log["comfort"]) - 3
        score -= max(0, int(log["stress"]) - 3)

    score = max(0, min(100, score))
    latest = recent[0]
    headline = "Your gut is giving usable data"
    if latest["flags"]:
        headline = "Your gut is asking for backup"
    elif int(latest["bristol_type"]) in {3, 4}:
        headline = "Your latest log is in the smooth zone"
    elif int(latest["bristol_type"]) <= 2:
        headline = "Your latest log leaned hard"
    elif int(latest["bristol_type"]) >= 6:
        headline = "Your latest log leaned loose"

    summary = (
        f"Latest report: type {latest['bristol_type']} ({latest['bristol_label']}), "
        f"{latest['color']} color, {latest['amount']} amount, urgency {latest['urgency']}/5."
    )
    next_step = "Try one small controlled experiment for the next 24 hours: hydration, fiber, movement, or stress reduction. Change one variable at a time."
    if latest["flags"]:
        next_step = "Red flags beat experiments. Consider contacting a medical professional, especially for blood, tarry black stool, severe pain, fever, or dehydration."

    return {"score": score, "headline": headline, "summary": summary, "next_step": next_step}


def gutty_summary() -> dict[str, Any]:
    with closing(db_connection(APP_DB)) as conn:
        logs = [
            row_to_log(row)
            for row in conn.execute(
                """
                SELECT *
                FROM poop_logs
                ORDER BY logged_at DESC, id DESC
                LIMIT 50
                """
            )
        ]

        totals = conn.execute(
            """
            SELECT
                COUNT(*) AS log_count,
                ROUND(AVG(bristol_type), 1) AS avg_bristol,
                ROUND(AVG(comfort), 1) AS avg_comfort,
                ROUND(AVG(urgency), 1) AS avg_urgency
            FROM poop_logs
            """
        ).fetchone()

        since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        week_count = conn.execute(
            "SELECT COUNT(*) AS week_count FROM poop_logs WHERE logged_at >= ?",
            (since,),
        ).fetchone()

        community = [
            dict(row)
            for row in conn.execute(
                """
                SELECT id, log_id, display_name, story, suggestion, created_at
                FROM community_posts
                ORDER BY created_at DESC, id DESC
                LIMIT 12
                """
            )
        ]

    return {
        "totals": {
            "log_count": int(totals["log_count"] or 0),
            "week_count": int(week_count["week_count"] or 0),
            "avg_bristol": totals["avg_bristol"] or 0,
            "avg_comfort": totals["avg_comfort"] or 0,
            "avg_urgency": totals["avg_urgency"] or 0,
        },
        "gut_score": build_gut_score(logs),
        "patterns": build_patterns(logs),
        "logs": logs[:20],
        "community": community,
        "bristol_types": BRISTOL_TYPES,
        "disclaimer": "Gutty is for personal tracking and general wellness education. It is not a diagnosis or medical advice.",
    }


def reset_data() -> dict[str, Any]:
    with closing(db_connection(APP_DB)) as conn:
        conn.execute("DELETE FROM community_posts")
        conn.execute("DELETE FROM poop_logs")
        conn.execute("UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('poop_logs', 'community_posts')")
        conn.commit()
    return {"ok": True, "message": "Gutty data reset. Your gut gets a fresh notebook."}


class GuttyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def _send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length == 0:
            return {}
        raw = self.rfile.read(content_length)
        return json.loads(raw.decode("utf-8"))

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/summary":
            self._send_json(gutty_summary())
            return
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        if self.path == "/api/logs":
            try:
                result = add_poop_log(self._read_json_body())
            except (ValueError, json.JSONDecodeError) as exc:
                self._send_json({"error": f"Invalid poop log: {exc}"}, status=HTTPStatus.BAD_REQUEST)
                return
            self._send_json(result, status=HTTPStatus.CREATED)
            return

        if self.path == "/api/community":
            try:
                result = add_community_post(self._read_json_body())
            except (ValueError, json.JSONDecodeError) as exc:
                self._send_json({"error": f"Invalid community post: {exc}"}, status=HTTPStatus.BAD_REQUEST)
                return
            self._send_json(result, status=HTTPStatus.CREATED)
            return

        if self.path == "/api/reset":
            self._send_json(reset_data())
            return

        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def run() -> None:
    init_db()
    port = int(os.environ.get("PORT", DEFAULT_PORT))
    server = ThreadingHTTPServer(("127.0.0.1", port), GuttyHandler)
    print(f"Gutty running at http://127.0.0.1:{port}")
    print(f"Using local app database: {APP_DB}")
    print("Gutty is a wellness tracker, not medical advice.")
    server.serve_forever()


if __name__ == "__main__":
    run()
