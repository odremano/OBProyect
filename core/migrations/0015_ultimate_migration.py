from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_alter_membership_rol'),
    ]

    operations = [
        # Remover el índice del estado de Django
        # (No hace nada en la BD porque el índice ya no está definido en el modelo)
        migrations.RemoveIndex(
            model_name='profesional',
            name='prof_user_neg_avail_idx',
        ),
    ]