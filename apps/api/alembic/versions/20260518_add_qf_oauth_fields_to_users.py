"""add qf_sub, qf_refresh_token, qf_id_token to users

Revision ID: add_qf_oauth_fields_to_users
Revises: f65747695ecf
Create Date: 2026-05-18

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "add_qf_oauth_fields_to_users"
down_revision: str | Sequence[str] | None = "f65747695ecf"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("qf_sub", sa.String(255), nullable=True, unique=True),
    )
    op.add_column(
        "users",
        sa.Column("qf_refresh_token", sa.String(512), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("qf_id_token", sa.String(2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "qf_id_token")
    op.drop_column("users", "qf_refresh_token")
    op.drop_column("users", "qf_sub")
