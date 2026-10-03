import io

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.database import get_db
from database.models import Review
from models.user_model import User
from reports.pdf_generator import generate_review_pdf

router = APIRouter(prefix="/report", tags=["Reports"])


@router.get("/{review_id}")
def download_review_report(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates and returns a PDF report for the specified review ID.
    Strictly verifies that the requested review belongs to the authenticated user.
    """
    # Fetch review from DB
    review = db.query(Review).filter(Review.id == review_id).first()

    # Handle missing records
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Enforce strict ownership / authorization
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this report"
        )

    # Generate the PDF file entirely in memory
    try:
        pdf_bytes = generate_review_pdf(review)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )

    # Stream the binary payload back to the client natively
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=review_{review.id}.pdf"
        }
    )
