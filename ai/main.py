
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import shutil

app = FastAPI(
    title="RoadEye AI Service",
    description="AI-powered pothole detection service",
    version="1.0.0"
)

# Project directories
BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_PATH = BASE_DIR / "weights" / "best.pt"
UPLOAD_DIR = BASE_DIR / "uploads"
RESULT_DIR = BASE_DIR / "results"

UPLOAD_DIR.mkdir(exist_ok=True)
RESULT_DIR.mkdir(exist_ok=True)

# Load pothole detection model
model = YOLO(str(WEIGHTS_PATH))

# Serve annotated detection images
app.mount("/results", StaticFiles(directory=str(RESULT_DIR)), name="results")


@app.get("/")
def home():
    return {
        "success": True,
        "message": "RoadEye AI Service is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RoadEye AI",
        "model": "Pothole Detection YOLO11"
    }


@app.post("/detect/image")
async def detect_potholes(file: UploadFile = File(...)):

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image."
        )

    file_id = str(uuid4())
    input_path = UPLOAD_DIR / f"{file_id}_{Path(file.filename or 'image').name}"
    output_path = RESULT_DIR / f"{file_id}.jpg"

    try:
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model.predict(
            source=str(input_path),
            conf=0.25,
            save=False,
            verbose=False
        )

        result = results[0]
        result.save(filename=str(output_path))

        detections = []

        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            coordinates = box.xyxy[0].tolist()

            detections.append({
                "class": model.names[class_id],
                "confidence": round(confidence, 4),
                "coordinates": [round(value, 2) for value in coordinates]
            })

        return {
            "success": True,
            "filename": file.filename,
            "total_potholes": len(detections),
            "detections": detections,
            "annotated_image": f"/results/{file_id}.jpg"
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(error)}"
        )

    finally:
        if input_path.exists():
            input_path.unlink()

        await file.close()
