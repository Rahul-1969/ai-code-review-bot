import csv
import io
from typing import List
from models.repository_scan_model import RepositoryScan

def export_repositories_csv(scans: List[RepositoryScan]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "user_id"])
    for scan in scans:
        writer.writerow([scan.id, scan.user_id])
    return output.getvalue()
