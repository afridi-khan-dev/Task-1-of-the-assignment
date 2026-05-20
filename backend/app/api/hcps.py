from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models import HCP, User
from backend.app.schemas import HcpCreate, HcpResponse, HcpUpdate
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/hcps", tags=["HCP Management"])

@router.get("/", response_model=List[HcpResponse])
def list_hcps(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(HCP)
    if specialty:
        query = query.filter(HCP.specialty.ilike(f"%{specialty}%"))
    if city:
        query = query.filter(HCP.city.ilike(f"%{city}%"))
    if priority:
        query = query.filter(HCP.priority == priority)
        
    return query.order_by(HCP.name).all()


@router.post("/", response_model=HcpResponse, status_code=status.HTTP_201_CREATED)
def create_hcp(
    hcp_in: HcpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(HCP).filter(HCP.name == hcp_in.name, HCP.hospital == hcp_in.hospital).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="HCP already exists at this hospital location"
        )
        
    hcp = HCP(**hcp_in.dict())
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp


@router.get("/{id}", response_model=HcpResponse)
def get_hcp(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hcp = db.query(HCP).filter(HCP.id == id).first()
    if not hcp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="HCP not found")
    return hcp


@router.put("/{id}", response_model=HcpResponse)
def update_hcp(
    id: int,
    hcp_in: HcpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hcp = db.query(HCP).filter(HCP.id == id).first()
    if not hcp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="HCP not found")
        
    for field, value in hcp_in.dict(exclude_unset=True).items():
        setattr(hcp, field, value)
        
    db.commit()
    db.refresh(hcp)
    return hcp
