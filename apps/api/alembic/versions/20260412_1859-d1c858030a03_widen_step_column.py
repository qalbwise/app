"""widen step column

Revision ID: d1c858030a03
Revises: 298cfcb580de
Create Date: 2026-04-12 18:59:21.477665+00:00

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "d1c858030a03"
down_revision: str | Sequence[str] | None = "298cfcb580de"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("searches", "step", existing_type=sa.String(50), type_=sa.Text(), postgresql_using="step::text")


def downgrade() -> None:
    op.alter_column("searches", "step", existing_type=sa.Text(), type_=sa.String(50))