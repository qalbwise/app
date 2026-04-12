"""add foreign key to searches table

Revision ID: 298cfcb580de
Revises: add_searches
Create Date: 2026-04-12 18:48:15.784228+00:00

"""

from collections.abc import Sequence

from alembic import op

revision: str = "298cfcb580de"
down_revision: str | Sequence[str] | None = "add_searches"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
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
