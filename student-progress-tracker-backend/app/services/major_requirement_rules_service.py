"""Dinamikus szabály sorok CRUD — ``MajorRequirementRulesService``."""

from sqlalchemy.orm import Session
from app.db import models, schemas
from app.services.major_requirement_rule_order import major_requirement_rule_sort_key


class MajorRequirementRulesService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100):
        return self.db.query(models.MajorRequirementRule).offset(skip).limit(limit).all()

    def get_by_id(self, rule_id: int):
        return self.db.query(models.MajorRequirementRule).filter(models.MajorRequirementRule.id == rule_id).first()

    def get_by_major_id(self, major_id: int):
        items = (
            self.db.query(models.MajorRequirementRule)
            .filter(models.MajorRequirementRule.major_id == major_id)
            .all()
        )
        return sorted(items, key=major_requirement_rule_sort_key)

    def create(self, payload: schemas.MajorRequirementRuleCreate):
        d = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
        obj = models.MajorRequirementRule(**d)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, rule_id: int, payload: schemas.MajorRequirementRuleUpdate):
        obj = self.get_by_id(rule_id)
        if not obj:
            return None
        raw = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
        for key, value in raw.items():
            setattr(obj, key, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, rule_id: int):
        obj = self.get_by_id(rule_id)
        if not obj:
            return None
        self.db.delete(obj)
        self.db.commit()
        return obj

    def delete_by_major_id(self, major_id: int) -> int:
        q = self.db.query(models.MajorRequirementRule).filter(models.MajorRequirementRule.major_id == major_id)
        deleted = q.delete(synchronize_session=False)
        self.db.commit()
        return int(deleted or 0)

    def delete_by_major_id_with_course_major(self, major_id: int) -> tuple[int, int]:
        rules_q = self.db.query(models.MajorRequirementRule).filter(models.MajorRequirementRule.major_id == major_id)
        cm_q = self.db.query(models.CourseMajor).filter(models.CourseMajor.major_id == major_id)
        deleted_rules = int(rules_q.delete(synchronize_session=False) or 0)
        deleted_course_major = int(cm_q.delete(synchronize_session=False) or 0)
        self.db.commit()
        return deleted_rules, deleted_course_major


