"""drop bookmarks table

Revision ID: drop_bookmarks_table
Revises: 788ac94a8323
Create Date: 2026-05-20 00:00:00.000000+00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "drop_bookmarks_table"
down_revision: str | Sequence[str] | None = "788ac94a8323"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_table("bookmarks")


def downgrade() -> None:
    op.create_table(
        "bookmarks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("ayah_key", sa.String(length=20), nullable=False),
        sa.Column("surah_number", sa.Integer(), nullable=False),
        sa.Column("verse_number", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index(
        op.f("ix_bookmarks_user_id"), "bookmarks", ["user_id"], unique=False
    )
