EXPORT_HEADER = {
    "hu": [
        "Kurzus kód",
        "Kurzus neve",
        "Kredit",
        "Státusz",
        "Teljesítés féléve",
        "Pontszám",
        "Kategória"
    ],
    "en": [
        "Course code",
        "Course name",
        "Credit",
        "Status",
        "Completed semester",
        "Points",
        "Category"
    ]
}

TEMPLATE_HEADER = {
    "hu": [
        "Kurzus kód",
        "Kurzus neve",
        "Kategória",
        "Ajánlott félév",
        "Kredit",
        "Státusz (completed/in_progress)",
        "Teljesítés féléve"
    ],
    "en": [
        "Course code",
        "Course name",
        "Category",
        "Recommended semester",
        "Credit",
        "Status (completed/in_progress)",
        "Completed semester"
    ]
}

STATUS_MAP = {
    "hu": {
        "completed": "teljesítve",
        "in_progress": "folyamatban"
    },
    "en": {
        "completed": "completed",
        "in_progress": "in_progress"
    }
}

CATEGORY_MAP = {
    "hu": {
        "required": "kötelező",
        "elective": "kötelezően választható",
        "optional": "szabadon választható",
        "pe": "testnevelés"
    },
    "en": {
        "required": "required",
        "elective": "elective",
        "optional": "optional",
        "pe": "pe"
    }
}

ERROR_MESSAGES = {
    "missing_pair": {
        "hu": "A státusz (6. oszlop) és a teljesítés féléve (7. oszlop) mindkettő kitöltése kötelező; a sor hibás.",
        "en": "Both status (column 6) and completed semester (column 7) must be provided; the row is invalid."
    },
    "missing_code": {
        "hu": "Hiányzó tárgykód (1. oszlop).",
        "en": "Missing course code (column 1)."
    },
    "course_not_found": {
        "hu": "A következő tárgykód nem található az adatbázisban: {code}.",
        "en": "Course code not found in DB: {code}."
    },
    "invalid_number": {
        "hu": "Érvénytelen numerikus érték a(z) {col} oszlopban: '{val}'",
        "en": "Invalid numeric value in column {col}: '{val}'"
    },
    "formula_no_cached": {
        "hu": "A cella képletet tartalmaz, de nincs elmentett számolt érték. Nyisd meg az Excel fájlt, számold újra és mentsd el (vagy paste values), majd próbáld újra.",
        "en": "The cell contains a formula but there is no cached computed value. Open the file in Excel, recalculate and save (or paste values), then retry."
    },
    "invalid_status": {
        "hu": "A státusznak 'completed' vagy 'in_progress' (vagy azok fordításai) kell lennie.",
        "en": "Status must be 'completed' or 'in_progress' (or their translations)."
    },
    "duplicate_course": {
        "hu": "Duplikált tárgy: {code}.",
        "en": "Duplicate course: {code}."
    },
    "equivalent_course": {
        "hu": "Ekvivalens tárgy ('{eq}') már importálva van a(z) '{code}' miatt.",
        "en": "Equivalent course ('{eq}') already imported for '{code}'."
    }
}
