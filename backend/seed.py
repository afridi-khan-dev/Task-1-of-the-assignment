from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from backend.app.database import SessionLocal, engine, Base
from backend.app.models import User, HCP, Product, Interaction, Followup
from backend.app.utilities.auth import get_password_hash

def seed_database():
    print("Seeding database...")
    Base.metadata.drop_all(bind=engine) # clean start
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Create Default Users (Auth Scaffolding)
        sales_rep = User(
            username="salesrep",
            email="rep@pharmascience.com",
            hashed_password=get_password_hash("password123"),
            role="Sales Representative"
        )
        manager = User(
            username="manager",
            email="manager@pharmascience.com",
            hashed_password=get_password_hash("password123"),
            role="Manager"
        )
        admin = User(
            username="admin",
            email="admin@pharmascience.com",
            hashed_password=get_password_hash("password123"),
            role="Admin"
        )
        db.add_all([sales_rep, manager, admin])
        db.commit()
        db.refresh(sales_rep)
        print("[SUCCESS] Registered Sales Representative: salesrep / password123")

        # 2. Create Specialty Pharmaceutical Products
        cardiox = Product(
            name="Cardiox",
            category="Cardiology",
            description="Premium anti-hypertensive medication targeting Angiotensin II receptors.",
            indication="Indicated for the treatment of essential hypertension and systolic blood pressure reduction."
        )
        glycacare = Product(
            name="GlycaCare",
            category="Endocrinology",
            description="Once-daily oral GLP-1 receptor agonist targeting glucose-dependent insulin secretion.",
            indication="Indicated to improve glycemic control in adults with type 2 diabetes mellitus."
        )
        lipidex = Product(
            name="Lipidex",
            category="Cardiology",
            description="High-potency statin for reducing LDL cholesterol levels.",
            indication="Indicated as an adjunct to diet to reduce elevated total-C, LDL-C, and triglycerides."
        )
        nephrogard = Product(
            name="NephroGard",
            category="Nephrology",
            description="Protective renal therapeutic preserving glomerular filtration rate.",
            indication="Indicated to retard progression of kidney disease in patients with chronic renal insufficiency."
        )
        oncostop = Product(
            name="OncoStop",
            category="Oncology",
            description="Targeted small molecule kinase inhibitor blockading tumor angiogenetic growth.",
            indication="Indicated for advanced metastatic carcinomas expressing kinase receptors."
        )
        db.add_all([cardiox, glycacare, lipidex, nephrogard, oncostop])
        db.commit()
        print("[SUCCESS] Seeded therapeutic specialty product catalog.")

        # 3. Create Doctors (HCPs Directory)
        dr_sharma = HCP(
            name="Dr. Amit Sharma",
            specialty="Endocrinology",
            hospital="Apollo Hospital",
            city="Mumbai",
            email="dr.amitsharma@apollo.com",
            phone="982-019-3829",
            priority="High",
            status="Active"
        )
        dr_jenkins = HCP(
            name="Dr. Sarah Jenkins",
            specialty="Cardiology",
            hospital="Mayo Clinic",
            city="Rochester",
            email="jenkins.sarah@mayo.edu",
            phone="507-284-2511",
            priority="High",
            status="Active"
        )
        dr_patel = HCP(
            name="Dr. Priya Patel",
            specialty="Oncology",
            hospital="Memorial Sloan Kettering",
            city="New York",
            email="patelp@mskcc.org",
            phone="212-639-2000",
            priority="High",
            status="Active"
        )
        dr_smith = HCP(
            name="Dr. John Smith",
            specialty="Cardiology",
            hospital="Massachusetts General",
            city="Boston",
            email="jsmith@mgh.harvard.edu",
            phone="617-726-2000",
            priority="Medium",
            status="Active"
        )
        dr_davis = HCP(
            name="Dr. Lisa Davis",
            specialty="General Practice",
            hospital="Vanderbilt Medical Center",
            city="Nashville",
            email="lisa.davis@vumc.org",
            phone="615-322-5000",
            priority="Low",
            status="Active"
        )
        db.add_all([dr_sharma, dr_jenkins, dr_patel, dr_smith, dr_davis])
        db.commit()
        db.refresh(dr_sharma)
        db.refresh(dr_jenkins)
        db.refresh(dr_patel)
        print("[SUCCESS] Registered Healthcare Professionals directory.")

        # 4. Create Historical Interaction Records with AI-generated Summaries
        today = date.today()
        
        # Interaction with Dr. Jenkins
        i1 = Interaction(
            hcp_id=dr_jenkins.id,
            user_id=sales_rep.id,
            raw_input="Met Dr Jenkins today at Mayo Clinic. Discussed clinical trial outcomes of Cardiox. She was highly impressed by the 12% drop in systolic pressure shown in Phase III trials. She asked for some physical brochures for her department.",
            summary="Field representative briefed Dr. Sarah Jenkins on the Cardiox Phase III trial data, demonstrating a 12% reduction in systolic blood pressure. The HCP showed positive interest and requested cardiac patient brochures.",
            interaction_type="In-Person",
            products_discussed=["Cardiox"],
            sentiment="Positive",
            interaction_date=today - timedelta(days=5),
            follow_up_date=today + timedelta(days=9)
        )
        
        # Interaction with Dr. Sharma
        i2 = Interaction(
            hcp_id=dr_sharma.id,
            user_id=sales_rep.id,
            raw_input="Spoke with Dr Amit Sharma over a Zoom call. We walked through GlycaCare dosing titration. He had questions about gastrointestinal tolerability in elderly patients. Provided him the safety summary sheet. Scheduled to reconnect next week.",
            summary="Rep conducted a remote video detailing session with Dr. Amit Sharma on GlycaCare's titration schedule. Addressed concerns regarding geriatric gastrointestinal tolerability using the official clinical safety report.",
            interaction_type="Video Call",
            products_discussed=["GlycaCare"],
            sentiment="Neutral",
            interaction_date=today - timedelta(days=3),
            follow_up_date=today + timedelta(days=4)
        )
        
        # Interaction with Dr. Patel
        i3 = Interaction(
            hcp_id=dr_patel.id,
            user_id=sales_rep.id,
            raw_input="Quick sync with Dr Priya Patel via phone. She is currently running a busy shift at MSK oncology unit. She mentioned she has three metastatic carcinoma patients who might benefit from OncoStop trials. Requested a formal presentation with the medical director.",
            summary="Phone consultation completed with Dr. Priya Patel. The doctor identified three potential candidates for the OncoStop targeted carcinoma therapy trial. Requested a formal technical clinical presentation.",
            interaction_type="Phone",
            products_discussed=["OncoStop"],
            sentiment="Positive",
            interaction_date=today - timedelta(days=1),
            follow_up_date=today + timedelta(days=13)
        )
        db.add_all([i1, i2, i3])
        db.commit()
        db.refresh(i1)
        db.refresh(i2)
        db.refresh(i3)
        print("[SUCCESS] Created interaction timelines.")

        # 5. Create Follow-up Schedule Items
        f1 = Followup(
            interaction_id=i1.id,
            hcp_id=dr_jenkins.id,
            user_id=sales_rep.id,
            description="Deliver high-resolution printed Cardiox educational brochures and safety data booklets.",
            status="Pending",
            due_date=today + timedelta(days=9),
            priority="Medium"
        )
        f2 = Followup(
            interaction_id=i2.id,
            hcp_id=dr_sharma.id,
            user_id=sales_rep.id,
            description="Follow up via Zoom regarding GlycaCare titration safety trials and elderly patient outcomes.",
            status="Pending",
            due_date=today + timedelta(days=4),
            priority="High"
        )
        f3 = Followup(
            interaction_id=i3.id,
            hcp_id=dr_patel.id,
            user_id=sales_rep.id,
            description="Coordinate with the Medical Science Liaison to arrange a formal OncoStop carcinoma trial presentation for Memorial Sloan Kettering.",
            status="Pending",
            due_date=today + timedelta(days=13),
            priority="High"
        )
        db.add_all([f1, f2, f3])
        db.commit()
        print("[SUCCESS] Provisioned next-step follow-up schedules.")
        print("Database seeded successfully with rich CRM demo records!")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
