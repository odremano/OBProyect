from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_membership_role_default_cliente'),
    ]

    operations = [
        # 1. Cambiar relación para permitir múltiples perfiles profesionales
        migrations.AlterField(
            model_name='profesional',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='perfiles_profesional',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # 2. Evitar duplicados: un usuario solo puede ser profesional una vez por negocio
        migrations.AlterUniqueTogether(
            name='profesional',
            unique_together={('user', 'negocio')},
        ),
        
        # 3. Optimizar consultas frecuentes
        migrations.AddIndex(
            model_name='profesional',
            index=models.Index(
                fields=['user', 'negocio', 'is_available'], 
                name='prof_user_neg_avail_idx'
            ),
        ),
    ]