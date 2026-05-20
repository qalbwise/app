"""add bookmarks table

Revision ID: 788ac94a8323
Revises: add_qf_oauth_fields_to_users
Create Date: 2026-05-19 17:49:39.129853+00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "788ac94a8323"
down_revision: str | Sequence[str] | None = "add_qf_oauth_fields_to_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("bookmarks", sa.Column("surah_number", sa.Integer(), nullable=True))
    op.add_column("bookmarks", sa.Column("verse_number", sa.Integer(), nullable=True))

    conn = op.get_bind()
    conn.execute(
        sa.text("""
            UPDATE bookmarks
            SET surah_number = split_part(ayah_key, ':', 1)::integer,
                verse_number = split_part(ayah_key, ':', 2)::integer
        """)
    )

    op.alter_column("bookmarks", "surah_number", nullable=False)
    op.alter_column("bookmarks", "verse_number", nullable=False)
    op.create_foreign_key(None, "bookmarks", "users", ["user_id"], ["id"])
    op.drop_column("bookmarks", "note")
    op.drop_column("bookmarks", "extra_data")
    op.drop_column("bookmarks", "translation")
    op.drop_column("bookmarks", "arabic_text")
    op.drop_column("bookmarks", "surah_name")
    op.drop_index(op.f("ix_notes_user_id"), table_name="notes")
    op.create_foreign_key(
        None, "notes", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )


def downgrade() -> None:
    op.drop_constraint(None, "notes", type_="foreignkey")
    op.create_index(op.f("ix_notes_user_id"), "notes", ["user_id"], unique=False)
    op.add_column(
        "bookmarks",
        sa.Column(
            "surah_name", sa.VARCHAR(length=100), autoincrement=False, nullable=False
        ),
    )
    op.add_column(
        "bookmarks",
        sa.Column("arabic_text", sa.TEXT(), autoincrement=False, nullable=False),
    )
    op.add_column(
        "bookmarks",
        sa.Column("translation", sa.TEXT(), autoincrement=False, nullable=False),
    )
    op.add_column(
        "bookmarks",
        sa.Column(
            "extra_data",
            postgresql.JSON(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "bookmarks", sa.Column("note", sa.TEXT(), autoincrement=False, nullable=True)
    )
    op.drop_constraint(None, "bookmarks", type_="foreignkey")
    op.drop_column("bookmarks", "verse_number")
    op.drop_column("bookmarks", "surah_number")
