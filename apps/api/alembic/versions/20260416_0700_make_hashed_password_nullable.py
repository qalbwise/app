"""make hashed_password nullable for Google OAuth

Revision ID: make_hashed_password_nullable
Revises: 3627bfd87172
Create Date: 2026-04-16 06:54:00.000000+00:00

"""

from collections.abc import Sequence

from alembic import op

revision: str = "make_hashed_password_nullable"
down_revision: str | Sequence[str] | None = "3627bfd87172"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("users", "hashed_password", nullable=True)


def downgrade() -> None:
    op.alter_column("users", "hashed_password", nullable=False)
