const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const backendRoot = path.join("c:", "Dev", "ProyectoCondominio", "condo-backend");
const requireFromBackend = createRequire(
    path.join(backendRoot, "package.json"),
);
const mysql = requireFromBackend("mysql2/promise");
requireFromBackend("dotenv").config({
    path: path.join(backendRoot, ".env"),
});

const CSV_PATH = path.join(
    "c:",
    "Dev",
    "ProyectoCondominio",
    "condo-backend",
    "istmo-import-complex-data.csv",
);
const OUT_PATH = path.join(
    "c:",
    "Dev",
    "ProyectoCondominio",
    "condominio-admin",
    "docs",
    "context",
    "istmo-import-validation.txt",
);
const COMPLEX_ID = 4;
const ADMIN_ID = 1092;

const parseAlicuota = (value) => {
    if (!value) return null;
    const parsed = Number.parseFloat(String(value).replace(",", "."));
    if (Number.isNaN(parsed)) return null;
    return parsed > 1 ? parsed / 100 : parsed;
};

const readCsv = () => {
    const content = fs.readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, "");
    const lines = content.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(";").map((header) => header.trim());

    return lines.slice(1).map((line) => {
        const values = line.split(";");
        return Object.fromEntries(
            headers.map((header, index) => [header, values[index] ?? ""]),
        );
    });
};

const main = async () => {
    const rows = readCsv();
    const byBuilding = new Map();
    const noOwner = [];
    const missingAlicuota = [];

    for (const row of rows) {
        const building = row.building_name?.trim();
        const apartment = row.apartment?.trim();
        const owner = row["Nombre Propietario"]?.trim() || "";
        const alicuota = parseAlicuota(row.alicuota);

        if (!byBuilding.has(building)) byBuilding.set(building, []);
        byBuilding.get(building).push({ apartment, owner, alicuota });

        if (!owner) noOwner.push(`${building}-${apartment}`);
        if (alicuota === null) missingAlicuota.push(`${building}-${apartment}`);
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const [[complexRow]] = await connection.query(
        "SELECT id, name, admin_id, status FROM residential_complexes WHERE id = ?",
        [COMPLEX_ID],
    );
    const [[adminRow]] = await connection.query(
        "SELECT id, name, email, role, status FROM users WHERE id = ?",
        [ADMIN_ID],
    );
    const [existingBuildings] = await connection.query(
        "SELECT id, complex_id, name, code, status, admin_id FROM buildings WHERE complex_id = ? ORDER BY id",
        [COMPLEX_ID],
    );
    const [[maxRow]] = await connection.query(
        "SELECT MAX(id) AS max_id FROM buildings",
    );
    await connection.end();

    const buildingNames = [];
    for (const row of rows) {
        const building = row.building_name?.trim();
        if (building && !buildingNames.includes(building)) {
            buildingNames.push(building);
        }
    }
    const maxBuildingId = maxRow.max_id || 0;
    const expectedIds = Object.fromEntries(
        buildingNames.map((name, index) => [name, maxBuildingId + index + 1]),
    );

    const lines = [
        "VALIDACION IMPORT ISTMO - Conjunto Residencial el ITSMO",
        "=".repeat(60),
        "",
        "DB previa a import:",
        `  complex_id ${COMPLEX_ID}: ${complexRow ? complexRow.name : "NO EXISTE"}`,
        `  admin_id ${ADMIN_ID}: ${adminRow ? `${adminRow.name} (${adminRow.role})` : "NO EXISTE"}`,
        `  edificios actuales en complex ${COMPLEX_ID}: ${existingBuildings.length}`,
        `  max(buildings.id) actual: ${maxBuildingId}`,
        "",
        "CSV:",
        `  filas apartamentos: ${rows.length}`,
        `  edificios unicos: ${buildingNames.length}`,
        `  sin propietario: ${noOwner.length}`,
        `  sin alicuota: ${missingAlicuota.length}`,
        "",
        "Edificios que SE CREARAN (si aun no existen):",
    ];

    for (const name of buildingNames) {
        const apartments = byBuilding.get(name);
        const alicuotas = [
            ...new Set(apartments.map((item) => item.alicuota).filter(Boolean)),
        ];
        const alicuotaSum = apartments.reduce(
            (sum, item) => sum + (item.alicuota || 0),
            0,
        );
        lines.push(
            `  id esperado ${String(expectedIds[name]).padStart(2, " ")} | ${name.padEnd(3, " ")} | apts ${String(apartments.length).padStart(2, " ")} | suma alicuota ${alicuotaSum.toFixed(4)} | valores ${JSON.stringify(alicuotas)}`,
        );
    }

    lines.push("", "Apartamentos sin propietario (owner_id = NULL):");
    lines.push(...noOwner.map((item) => `  ${item}`));

    if (missingAlicuota.length) {
        lines.push("", "Apartamentos sin alicuota en CSV:");
        lines.push(...missingAlicuota.map((item) => `  ${item}`));
    }

    lines.push(
        "",
        "Checks:",
        `  [${complexRow && complexRow.admin_id === ADMIN_ID ? "OK" : "FAIL"}] complex ${COMPLEX_ID} asignado a admin ${ADMIN_ID}`,
        `  [${existingBuildings.length === 0 ? "OK" : "WARN"}] complex ${COMPLEX_ID} sin edificios previos`,
        `  [${rows.length === 424 ? "OK" : "WARN"}] CSV con 424 apartamentos`,
        `  [${buildingNames.length === 27 ? "OK" : "WARN"}] CSV con 27 edificios`,
        `  [${expectedIds.A === maxBuildingId + 1 ? "OK" : "WARN"}] edificio A iniciaria en id ${expectedIds.A}`,
        "",
        "Backend actualizado:",
        "  complexId = 4",
        "  adminId = 1092",
        "  alicuota leida desde columna CSV",
        "",
        "Archivo a subir: condo-backend/istmo-import-complex-data.csv",
        "Endpoint: POST /api/building/import-complex-data",
    );

    fs.writeFileSync(OUT_PATH, lines.join("\n"), "utf-8");
    console.log(lines.join("\n"));
};

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
