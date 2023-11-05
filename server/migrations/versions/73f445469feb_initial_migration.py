"""Initial migration

Revision ID: 73f445469feb
Revises: 
Create Date: 2023-11-05 21:35:33.447041

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '73f445469feb'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('tags',
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('created_date', sa.String(), nullable=False),
    sa.Column('updated_date', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('name')
    )
    op.create_table('users',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('password_hash', sa.String(), nullable=False),
    sa.Column('properties', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('documents',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('created_date', sa.String(), nullable=False),
    sa.Column('updated_date', sa.String(), nullable=False),
    sa.Column('properties', sa.String(), nullable=False),
    sa.Column('content', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('user_tags',
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('tag_name', sa.String(), nullable=False),
    sa.Column('created_date', sa.String(), nullable=False),
    sa.Column('updated_date', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['tag_name'], ['tags.name'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('user_id', 'tag_name')
    )
    op.create_table('document_tags',
    sa.Column('document_id', sa.String(), nullable=False),
    sa.Column('tag_name', sa.String(), nullable=False),
    sa.Column('created_date', sa.String(), nullable=False),
    sa.Column('updated_date', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
    sa.ForeignKeyConstraint(['tag_name'], ['tags.name'], ),
    sa.PrimaryKeyConstraint('document_id', 'tag_name')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('document_tags')
    op.drop_table('user_tags')
    op.drop_table('documents')
    op.drop_table('users')
    op.drop_table('tags')
    # ### end Alembic commands ###