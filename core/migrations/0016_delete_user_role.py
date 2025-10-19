from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_ultimate_migration'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='usuario',
            name='role',
        ),
    ]