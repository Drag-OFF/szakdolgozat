from sqlalchemy.orm import Session
from app.db import models, schemas


class MajorRequirementRulesService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100):
        return self.db.query(models.MajorRequirementRule).offset(skip).limit(limit).all()

    def get_by_id(self, rule_id: int):
        return self.db.query(models.MajorRequirementRule).filter(models.MajorRequirementRule.id == rule_id).first()

    def get_by_major_id(self, major_id: int):
        return (
            self.db.query(models.MajorRequirementRule)
            .filter(models.MajorRequirementRule.major_id == major_id)
            .order_by(models.MajorRequirementRule.sort_order.asc(), models.MajorRequirementRule.id.asc())
            .all()
        )

    def create(self, payload: schemas.MajorRequirementRuleCreate):
        obj = models.MajorRequirementRule(**payload.dict())
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, rule_id: int, payload: schemas.MajorRequirementRuleUpdate):
        obj = self.get_by_id(rule_id)
        if not obj:
            return None
        for key, value in payload.dict(exclude_unset=True).items():
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


