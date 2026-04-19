"""add user preferences jsonb

Revision ID: add_user_preferences_jsonb
Revises: make_hashed_password_nullable
Create Date: 2026-04-18

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "add_user_preferences_jsonb"
down_revision: str | Sequence[str] | None = "make_hashed_password_nullable"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "preferences", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "preferences")
