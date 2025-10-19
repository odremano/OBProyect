from django.db import migrations

def normalize_roles(apps, schema_editor):
    Membership = apps.get_model("core", "Membership")
    table = Membership._meta.db_table
    vendor = schema_editor.connection.vendor

    with schema_editor.connection.cursor() as cursor:
        # 1) admin -> profesional
        if vendor == "mysql":
            cursor.execute(f"UPDATE `{table}` SET rol = 'profesional' WHERE rol = 'admin'")
        else:
            cursor.execute(f"UPDATE {table} SET rol = 'profesional' WHERE rol = 'admin'")

        # 2) normalizar espacios/mayúsculas, por si acaso
        # (MySQL tiene LOWER/TRIM, Postgres/SQLite también)
        if vendor == "mysql":
            cursor.execute(f"UPDATE `{table}` SET rol = LOWER(TRIM(rol)) WHERE rol IS NOT NULL")
        else:
            cursor.execute(f"UPDATE {table} SET rol = LOWER(TRIM(rol)) WHERE rol IS NOT NULL")

def noop(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0009_backfill_membership_roles"),  # <-- apunta al backfill que ya corriste
    ]
    operations = [
        migrations.RunPython(normalize_roles, noop),
    ]
