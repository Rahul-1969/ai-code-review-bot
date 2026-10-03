import json
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.database import get_db
from models.user_model import User
from auth.dependencies import get_current_user
from models.repository_scan_model import RepositoryScan

from exporters.csv_exporter import export_repositories_csv
from exporters.json_exporter import export_repositories_json
from exporters.excel_exporter import export_repositories_excel

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scans = db.query(RepositoryScan).filter(RepositoryScan.user_id == current_user.id).all()
    csv_data = export_repositories_csv(scans)

    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=repositories.csv"}
    )

@router.get("/json")
def export_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scans = db.query(RepositoryScan).filter(RepositoryScan.user_id == current_user.id).all()
    json_data = export_repositories_json(scans)
    json_str = json.dumps(json_data, indent=2)

    return StreamingResponse(
        io.StringIO(json_str),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=repositories.json"}
    )

@router.get("/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scans = db.query(RepositoryScan).filter(RepositoryScan.user_id == current_user.id).all()
    excel_data = export_repositories_excel(scans)

    return StreamingResponse(
        io.BytesIO(excel_data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=repositories.xlsx"}
    )
