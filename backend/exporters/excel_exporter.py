import io
from typing import List
import openpyxl
from models.repository_scan_model import RepositoryScan

def export_repositories_excel(scans: List[RepositoryScan]) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Repositories"
    ws.append(["id", "user_id"])
    for scan in scans:
        ws.append([scan.id, scan.user_id])

    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()
