"""replace searches with canonical topics

Revision ID: topic_search_cache
Revises: add_user_preferences_jsonb
Create Date: 2026-04-26

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "topic_search_cache"
down_revision: str | Sequence[str] | None = "add_user_preferences_jsonb"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "topics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("canonical_query", sa.String(length=255), nullable=False),
        sa.Column("embedding", sa.Text(), nullable=True),
        sa.Column("search_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("step", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("canonical_query"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_topics_canonical_query"), "topics", ["canonical_query"])
    op.create_index(op.f("ix_topics_slug"), "topics", ["slug"])
    op.create_index(op.f("ix_topics_status"), "topics", ["status"])

    op.create_table(
        "topic_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ayah_key", sa.String(length=20), nullable=False),
        sa.Column("surah_name", sa.String(length=100), nullable=False),
        sa.Column("arabic_text", sa.Text(), nullable=False),
        sa.Column("translation", sa.Text(), nullable=False),
        sa.Column("why_this_verse", sa.Text(), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("tafsir_excerpt", sa.Text(), nullable=True),
        sa.Column("tafsir_author", sa.String(length=255), nullable=True),
        sa.Column("tafsir_edition", sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_topic_results_topic_id"), "topic_results", ["topic_id"])

    op.create_table(
        "user_searches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("session_id", sa.String(length=255), nullable=True),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_query", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_searches_topic_id"), "user_searches", ["topic_id"])

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO topics (
                id,
                slug,
                canonical_query,
                search_count,
                status,
                step,
                created_at,
                completed_at
            )
            SELECT
                gen_random_uuid(),
                first_slug,
                canonical_query,
                search_count,
                status,
                step,
                created_at,
                completed_at
            FROM (
                SELECT
                    lower(trim(both ' .,!?;:' from topic)) AS canonical_query,
                    min(slug) AS first_slug,
                    count(*) AS search_count,
                    (array_agg(status ORDER BY created_at))[1] AS status,
                    (array_agg(step ORDER BY created_at))[1] AS step,
                    min(created_at) AS created_at,
                    max(CASE WHEN status = 'complete' THEN updated_at ELSE NULL END)
                        AS completed_at
                FROM searches
                GROUP BY lower(trim(both ' .,!?;:' from topic))
            ) canonical_searches
            """
        )
    )
    conn.execute(
        sa.text(
            """
            INSERT INTO user_searches (
                id,
                user_id,
                session_id,
                topic_id,
                user_query,
                created_at
            )
            SELECT
                gen_random_uuid(),
                s.user_id,
                s.session_id,
                t.id,
                s.topic,
                s.created_at
            FROM searches s
            JOIN topics t
                ON t.canonical_query = lower(trim(both ' .,!?;:' from s.topic))
            """
        )
    )
    conn.execute(
        sa.text(
            """
            INSERT INTO topic_results (
                id,
                topic_id,
                ayah_key,
                surah_name,
                arabic_text,
                translation,
                why_this_verse,
                rank,
                relevance_score,
                url
            )
            SELECT
                gen_random_uuid(),
                t.id,
                result->>'ayah_key',
                COALESCE(result->>'surah_name', ''),
                COALESCE(result->>'arabic_text', ''),
                COALESCE(result->>'translation', ''),
                result->>'why_this_verse',
                COALESCE((result->>'rank')::integer, ordinality - 1),
                COALESCE((result->>'relevance_score')::double precision, 0),
                COALESCE(result->>'url', '')
            FROM (
                SELECT DISTINCT ON (lower(trim(both ' .,!?;:' from topic)))
                    *
                FROM searches
                WHERE results IS NOT NULL
                ORDER BY lower(trim(both ' .,!?;:' from topic)), created_at
            ) s
            JOIN topics t
                ON t.canonical_query = lower(trim(both ' .,!?;:' from s.topic))
            CROSS JOIN LATERAL json_array_elements(s.results) WITH ORDINALITY
                AS result(result, ordinality)
            """
        )
    )

    op.drop_index(op.f("ix_searches_status"), table_name="searches")
    op.drop_index(op.f("ix_searches_slug"), table_name="searches")
    op.drop_table("searches")

    op.alter_column("topics", "search_count", server_default=None)
    op.alter_column("topics", "status", server_default=None)
    op.alter_column("topic_results", "relevance_score", server_default=None)


def downgrade() -> None:
    op.create_table(
        "searches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("step", sa.String(length=200), nullable=True),
        sa.Column("raw_results", sa.JSON(), nullable=True),
        sa.Column("results", sa.JSON(), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("session_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_searches_slug"), "searches", ["slug"], unique=True)
    op.create_index(op.f("ix_searches_status"), "searches", ["status"])

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO searches (
                id,
                slug,
                topic,
                status,
                step,
                raw_results,
                results,
                user_id,
                session_id,
                created_at,
                updated_at
            )
            SELECT DISTINCT ON (t.id)
                t.id,
                left(t.slug, 50),
                us.user_query,
                t.status,
                t.step,
                NULL,
                COALESCE(results.results, '[]'::json),
                us.user_id,
                us.session_id,
                t.created_at,
                COALESCE(t.completed_at, t.created_at)
            FROM topics t
            LEFT JOIN user_searches us ON us.topic_id = t.id
            LEFT JOIN LATERAL (
                SELECT json_agg(
                    json_build_object(
                        'ayah_key', tr.ayah_key,
                        'surah_name', tr.surah_name,
                        'arabic_text', tr.arabic_text,
                        'translation', tr.translation,
                        'translator', 'Saheeh International',
                        'why_this_verse', tr.why_this_verse,
                        'rank', tr.rank,
                        'relevance_score', tr.relevance_score,
                        'url', tr.url
                    )
                    ORDER BY tr.rank
                ) AS results
                FROM topic_results tr
                WHERE tr.topic_id = t.id
            ) results ON TRUE
            ORDER BY t.id, us.created_at
            """
        )
    )

    op.drop_index(op.f("ix_user_searches_topic_id"), table_name="user_searches")
    op.drop_table("user_searches")
    op.drop_index(op.f("ix_topic_results_topic_id"), table_name="topic_results")
    op.drop_table("topic_results")
    op.drop_index(op.f("ix_topics_status"), table_name="topics")
    op.drop_index(op.f("ix_topics_slug"), table_name="topics")
    op.drop_index(op.f("ix_topics_canonical_query"), table_name="topics")
    op.drop_table("topics")
