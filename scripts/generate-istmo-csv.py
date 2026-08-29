import csv
import re
from collections import defaultdict
from pathlib import Path

import openpyxl

XLSM = Path(r"c:\Dev\ProyectoCondominio\condominio-admin\RECIBOS CONDOMINIO  JUNIO 2026.xlsm")
OUT_IMPORT = Path(r"c:\Dev\ProyectoCondominio\condo-backend\istmo-import-complex-data.csv")
OUT_LEGACY = Path(r"c:\Dev\ProyectoCondominio\condo-backend\istmo-subir-conjunto-2.csv")
OUT_REPORT = Path(r"c:\Dev\ProyectoCondominio\condominio-admin\docs\context\istmo-import-report.txt")
DEFAULT_PWD = "$2b$10$P6nti1ZV4YagWwXoYnp3U.plcyRTPloHT.ylsvmlRwHM0y1LwJUiK"


def clean(value):
    if value is None:
        return ""
    return str(value).strip()


def parse_alicuota(value):
    if value is None or value == "":
        return ""
    raw = str(value).replace(",", ".").strip()
    try:
        number = float(raw)
    except ValueError:
        return ""
    if number > 1:
        number /= 100
    return f"{number:.6f}".rstrip("0").rstrip(".")


def parse_sheet(workbook, name):
    worksheet = workbook[name]
    owner = ""
    alicuota = ""
    header_row_index = None

    rows = list(worksheet.iter_rows(min_row=1, max_row=20, values_only=True))
    for index, row in enumerate(rows):
        cells = [clean(cell) for cell in row]
        if any("PROPIETARIO" in cell.upper() for cell in cells) and any(
            "ALICUOTA" in cell.upper() for cell in cells
        ):
            header_row_index = index
            break

    if header_row_index is not None:
        for row in rows[header_row_index + 1 : header_row_index + 4]:
            cells = [clean(cell) for cell in row]
            candidate_owner = cells[3] if len(cells) > 3 else ""
            candidate_alicuota = parse_alicuota(cells[8] if len(cells) > 8 else None)

            if candidate_owner and candidate_owner not in ("0", "-", "."):
                owner = candidate_owner
            if candidate_alicuota and not alicuota:
                alicuota = candidate_alicuota

            if owner or alicuota:
                break

    match = re.match(r"^([A-Za-z]+)-(\d+)$", name.strip())
    if not match:
        return None

    building, apartment = match.group(1).upper(), match.group(2)
    owner = owner if owner and owner not in ("0", "-", ".") else ""

    return {
        "building_name": building,
        "apartment": apartment,
        "number": f"{building}-{apartment}",
        "owner": owner,
        "alicuota": alicuota,
        "sheet": name,
    }


def main():
    workbook = openpyxl.load_workbook(
        XLSM, read_only=True, data_only=True, keep_vba=True
    )

    records = [
        parse_sheet(workbook, sheet_name)
        for sheet_name in workbook.sheetnames
        if sheet_name.lower() != "mes"
    ]
    records = sorted(
        [record for record in records if record],
        key=lambda item: (item["building_name"], int(item["apartment"])),
    )
    workbook.close()

    with OUT_IMPORT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle, delimiter=";")
        writer.writerow(
            ["building_name", "apartment", "Nombre Propietario", "email", "alicuota"]
        )
        for record in records:
            writer.writerow(
                [
                    record["building_name"],
                    record["apartment"],
                    record["owner"],
                    "",
                    record["alicuota"],
                ]
            )

    with OUT_LEGACY.open("w", encoding="latin-1", newline="") as handle:
        writer = csv.writer(handle, delimiter=";")
        writer.writerow(
            [
                "building_id",
                "building_name",
                "number",
                "alicuota",
                "name_user",
                "email",
                "password",
                "role",
                "deuda",
            ]
        )
        for record in records:
            writer.writerow(
                [
                    "",
                    record["building_name"],
                    record["number"],
                    record["alicuota"].replace(".", ","),
                    record["owner"],
                    "",
                    DEFAULT_PWD,
                    "OWNER",
                    "0,00",
                ]
            )

    no_owner = [record for record in records if not record["owner"]]
    by_building = defaultdict(int)
    for record in records:
        by_building[record["building_name"]] += 1

    lines = [
        f"Total apartamentos: {len(records)}",
        f"Con propietario: {len(records) - len(no_owner)}",
        f"Sin propietario: {len(no_owner)}",
        "",
        "Apartamentos sin propietario:",
    ]
    for record in no_owner:
        lines.append(
            f"  {record['sheet']} | edificio {record['building_name']} | apt {record['apartment']} | alicuota {record['alicuota']}"
        )
    lines.extend(["", "Edificios y cantidad:"])
    for building, count in sorted(by_building.items()):
        lines.append(f"  {building}: {count}")

    OUT_REPORT.write_text("\n".join(lines), encoding="utf-8")

    print(f"Wrote {OUT_IMPORT}")
    print(f"Wrote {OUT_LEGACY}")
    print(f"Wrote {OUT_REPORT}")
    print(f"No owner count: {len(no_owner)}")


if __name__ == "__main__":
    main()
