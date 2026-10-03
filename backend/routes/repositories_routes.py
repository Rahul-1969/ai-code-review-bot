from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from models.repository_scan_model import RepositoryScan
from auth.dependencies import get_current_user
from models.user_model import User

router = APIRouter(prefix="/repositories", tags=["Repositories"])

@router.get("/")
def get_repositories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    '''STATUS: RECONSTRUCTED_FROM_CONTRACT'''
    scans = db.query(RepositoryScan).filter(RepositoryScan.user_id == current_user.id).all()
    return scans

@router.get("/{repository_id}")
def get_repository_detail(repository_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    '''STATUS: RECONSTRUCTED_FROM_CONTRACT'''
    scan = db.query(RepositoryScan).filter(
        RepositoryScan.id == repository_id,
        RepositoryScan.user_id == current_user.id
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Repository scan not found")
    return scan

@router.delete("/{repository_id}")
def delete_repository(repository_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    '''STATUS: RECONSTRUCTED_FROM_CONTRACT'''
    scan = db.query(RepositoryScan).filter(
        RepositoryScan.id == repository_id,
        RepositoryScan.user_id == current_user.id
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Repository scan not found")

    db.delete(scan)
    db.commit()
    return {"status": "success", "message": "Repository scan deleted"}
