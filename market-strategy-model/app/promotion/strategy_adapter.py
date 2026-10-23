import json

from fastapi import HTTPException

from app.db.models import StrategyRecord
from app.schemas.reports import StrategyReport


def load_strategy(session, strategy_id: str, merchant_id: str) -> StrategyReport:
    record = session.query(StrategyRecord).filter_by(strategy_id=strategy_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    report = StrategyReport.model_validate(json.loads(record.report_json))
    stored_merchant = json.loads(record.request_json).get("merchant_id")
    if not stored_merchant and merchant_id != "development-merchant":
        raise HTTPException(status_code=403, detail="strategy has no merchant ownership metadata")
    if stored_merchant and stored_merchant != merchant_id:
        raise HTTPException(status_code=403, detail="Strategy does not belong to this merchant")
    return report
