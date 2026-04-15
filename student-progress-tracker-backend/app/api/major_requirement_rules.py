"""Szak követelmény szabályok (dinamikus ``major_requirement_rules``) admin/lista API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import schemas
from app.db.database import get_db
from app.services.major_requirement_rules_service import MajorRequirementRulesService
from app.utils.utils import get_current_user, admin_required

router = APIRouter()


@router.get("", response_model=list[schemas.MajorRequirementRule], dependencies=[Depends(get_current_user)])
def list_rules(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return MajorRequirementRulesService(db).get_all(skip, limit)


@router.get("/by-major/{major_id}", response_model=list[schemas.MajorRequirementRule], dependencies=[Depends(get_current_user)])
def list_rules_by_major(major_id: int, db: Session = Depends(get_db)):
    return MajorRequirementRulesService(db).get_by_major_id(major_id)


@router.post("", response_model=schemas.MajorRequirementRule, dependencies=[Depends(admin_required)])
def create_rule(payload: schemas.MajorRequirementRuleCreate, db: Session = Depends(get_db)):
    return MajorRequirementRulesService(db).create(payload)


@router.put("/{rule_id}", response_model=schemas.MajorRequirementRule, dependencies=[Depends(admin_required)])
def update_rule(rule_id: int, payload: schemas.MajorRequirementRuleUpdate, db: Session = Depends(get_db)):
    updated = MajorRequirementRulesService(db).update(rule_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Major requirement rule not found")
    return updated


@router.delete("/{rule_id}", response_model=schemas.MajorRequirementRule, dependencies=[Depends(admin_required)])
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    deleted = MajorRequirementRulesService(db).delete(rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Major requirement rule not found")
    return deleted


@router.delete("/bulk/by-major/{major_id}", response_model=dict, dependencies=[Depends(admin_required)])
def delete_rules_by_major(major_id: int, db: Session = Depends(get_db)):
    deleted_rules, deleted_course_major = MajorRequirementRulesService(db).delete_by_major_id_with_course_major(major_id)
    return {
        "ok": True,
        "major_id": major_id,
        "deleted_rules_count": deleted_rules,
        "deleted_course_major_count": deleted_course_major,
    }
