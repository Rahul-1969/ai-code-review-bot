from typing import List, Dict, Any
from models.repository_scan_model import RepositoryScan

def export_repositories_json(scans: List[RepositoryScan]) -> List[Dict[str, Any]]:
    return [{"id": scan.id, "user_id": scan.user_id} for scan in scans]
