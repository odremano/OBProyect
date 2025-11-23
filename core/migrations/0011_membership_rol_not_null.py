from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0010_normalize_membership_roles"),  # o la última que tengas aplicada
    ]
    operations = [
        migrations.AlterField(
            model_name="membership",
            name="rol",
            field=models.CharField(
                max_length=20,
                choices=[("cliente", "Cliente"), ("profesional", "Profesional")],
                null=False,
                db_index=True,
            ),
        ),
    ]
