"""
Egységes megjelenítési sorrend szak követelmény szabályokhoz (sort_order oszlop nélkül):
kötelező → kötelezően választható → szabadon választható → testnevelés → szakmai gyakorlat.
A szakmai gyakorlatot a requirement_type == 'practice' ÉS/VAGY subgroup == 'practice_hours' azonosítja
(a régi adatokban előfordulhat required + practice_hours).
"""


def major_requirement_rule_sort_key(rule) -> tuple:
    rt = (getattr(rule, "requirement_type", None) or "").strip()
    sg_raw = getattr(rule, "subgroup", None)
    sg = (str(sg_raw).strip() if sg_raw is not None else "")
    rid = getattr(rule, "id", None)
    if rid is None:
        rid = 0
    if rt == "practice" or sg == "practice_hours":
        return (4, rid)
    primary = {"required": 0, "elective": 1, "optional": 2, "pe": 3}.get(rt, 9)
    return (primary, rid)
