"""add searches table

Revision ID: add_searches
Revises: bc27ff799899
Create Date: 2026-04-13

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "add_searches"
down_revision: str | Sequence[str] | None = "bc27ff799899"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "searches",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("step", sa.String(length=50), nullable=True),
        sa.Column("raw_results", sa.JSON(), nullable=True),
        sa.Column("results", sa.JSON(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("session_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_searches_slug"), "searches", ["slug"], unique=True)
    op.create_index(op.f("ix_searches_status"), "searches", ["status"], unique=False)
    op.create_foreign_key(
        "searches_user_id_fkey",
        "searches",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("searches_user_id_fkey", "searches", type_="foreignkey")
    op.drop_index(op.f("ix_searches_status"), table_name="searches")
    op.drop_index(op.f("ix_searches_slug"), table_name="searches")
    op.drop_table("searches")
