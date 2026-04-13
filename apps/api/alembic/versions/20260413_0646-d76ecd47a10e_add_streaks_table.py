"""add streaks table

Revision ID: d76ecd47a10e
Revises: e9536ebaae50
Create Date: 2026-04-13 06:46:57.908932+00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "d76ecd47a10e"
down_revision: str | Sequence[str] | None = "e9536ebaae50"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "streaks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_streaks_user_id"), "streaks", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_streaks_user_id"), table_name="streaks")
    op.drop_table("streaks")
