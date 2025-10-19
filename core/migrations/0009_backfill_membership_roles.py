from django.db import migrations

def backfill_membership_roles(apps, schema_editor):
    Membership = apps.get_model("core", "Membership")
    Usuario = apps.get_model("core", "Usuario")

    membership_table = Membership._meta.db_table
    usuario_table = Usuario._meta.db_table
    vendor = schema_editor.connection.vendor  # 'mysql', 'postgresql', 'sqlite'

    with schema_editor.connection.cursor() as cursor:
        if vendor == "mysql":
            # ---- MySQL: usar UPDATE ... JOIN ...
            cursor.execute(f"""
                UPDATE `{membership_table}` AS m
                JOIN `{usuario_table}` AS u ON m.user_id = u.id
                SET m.rol = u.role
                WHERE m.rol IS NULL
                  AND u.role IS NOT NULL
                  AND u.role <> ''
            """)
        else:
            # ---- PostgreSQL / SQLite: UPDATE ... FROM ...
            cursor.execute(f"""
                UPDATE {membership_table} AS m
                   SET rol = u.role
                  FROM {usuario_table} AS u
                 WHERE m.user_id = u.id
                   AND m.rol IS NULL
                   AND u.role IS NOT NULL
                   AND u.role <> ''
            """)

        # Paso 2: cualquier Membership que siga sin rol => 'cliente'
        # (misma sintaxis para todos los vendors)
        if vendor == "mysql":
            cursor.execute(f"UPDATE `{membership_table}` SET rol = 'cliente' WHERE rol IS NULL")
        else:
            cursor.execute(f"UPDATE {membership_table} SET rol = 'cliente' WHERE rol IS NULL")

def noop(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        # >>> Asegúrate que apunte a la migración donde pusiste rol = null=True
        ("core", "0008_alter_membership_rol"),
    ]
    operations = [
        migrations.RunPython(backfill_membership_roles, noop),
    ]
