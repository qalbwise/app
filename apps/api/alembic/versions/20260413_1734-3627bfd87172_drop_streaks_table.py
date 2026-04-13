"""drop_streaks_table

Revision ID: 3627bfd87172
Revises: d76ecd47a10e
Create Date: 2026-04-13 17:34:13.151064+00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "3627bfd87172"
down_revision: str | Sequence[str] | None = "d76ecd47a10e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index(op.f("ix_streaks_user_id"), table_name="streaks")
    op.drop_table("streaks")


def downgrade() -> None:
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
