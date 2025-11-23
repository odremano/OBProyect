from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_profesional_foreingkey_multi_negocio'),
    ]

    operations = [
        # Esta operación es solo cosmética - el índice ya existe en la BD
        # La incluimos para mantener sincronizado el estado de Django
        migrations.AlterField(
            model_name='membership',
            name='rol',
            field=models.CharField(
                choices=[('cliente', 'Cliente'), ('profesional', 'Profesional')],
                db_index=True,
                default='cliente',
                max_length=20
            ),
        ),
    ]