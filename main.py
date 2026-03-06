import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from PIL import Image
import io
import json
import os
from dotenv import load_dotenv
from typing import Optional

# AI imports
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
app = FastAPI(title="GeoScribe API")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "groq_key_present": os.getenv("GROQ_API_KEY") is not None,
        "frontend_url_present": os.getenv("FRONTEND_URL") is not None
    }

MODEL_PATH = 'terrain_model.keras'
CLASS_NAMES_PATH = 'class_names.json'
IMG_HEIGHT = 120
IMG_WIDTH = 120
NUM_CLASSES = 9

def create_full_model():
    data_augmentation_layers = keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical", input_shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.2),
        layers.RandomContrast(0.2),
    ], name="sequential_6")

    model = keras.Sequential([
        data_augmentation_layers,
        layers.Conv2D(16, 3, activation='relu', padding='same', input_shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
        layers.MaxPooling2D(),
        layers.Conv2D(32, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(),
        layers.Conv2D(64, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(),
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dense(NUM_CLASSES, activation='softmax')
    ], name="sequential_7")

    return model

model = None
class_names = []
model_loaded = False
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(CLASS_NAMES_PATH):
        model = create_full_model()
        model.load_weights(MODEL_PATH)
        model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
        with open(CLASS_NAMES_PATH, 'r') as f:
            class_names = json.load(f)
        model_loaded = True
        print(f"✅ Model architecture reconstructed and weights loaded successfully from {MODEL_PATH}")
        print(f"✅ Class names loaded: {class_names}")
    else:
        print(f" ⚠️ Model file ({MODEL_PATH}) or class names file ({CLASS_NAMES_PATH}) not found. Prediction endpoint will return an error.")
except Exception as e:
    print(f"❌ Critical Error during model loading: {e}")

# Permissive CORS for deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins to unblock the user
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_origin(request, call_next):
    origin = request.headers.get("origin")
    if origin:
        print(f"🌐 Request from Origin: {origin}")
    return await call_next(request)

# AI Setup
class TerrainAnalysis(BaseModel):
    soil_permeability: int = Field(description="Estimated soil permeability score from 1 to 100 based on the terrain type.")
    soil_permeability_reason: str = Field(description="A 1-2 sentence explanation of why this permeability score was given.")
    erosion_risk: str = Field(description="Risk of erosion: must be 'Low', 'Medium', or 'High'")
    erosion_risk_reason: str = Field(description="A 1-2 sentence explanation of the erosion risk rating.")
    recommended_crops: list[str] = Field(description="Array of strings containing exactly 3 top suitable crops, plants, or land uses for this terrain.")
    construction_difficulty: int = Field(description="Estimated construction difficulty score from 1 to 100 based on the terrain.")
    construction_difficulty_reason: str = Field(description="A 1-2 sentence explanation of the construction difficulty score.")
    expert_summary: str = Field(description="A 2-3 sentence expert agronomist summary of the land's potential.")

llm = None
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    try:
        # Initialize Langchain Groq Chat Model and wrap it with the structured output schema
        base_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=GROQ_API_KEY,
            temperature=0.2
        )
        llm = base_llm.with_structured_output(TerrainAnalysis)
        print("✅ LangChain Groq integration initialized successfully with Pydantic schema.")
    except Exception as e:
        print(f"❌ Error initializing Langchain Groq: {e}")
else:
    print("⚠️ GROQ_API_KEY not found in environment variables. AI analysis will not work.")

async def get_llm_explanation(terrain_class, latitude=None, longitude=None):
    if not llm:
        return {
            "soil_permeability": 0, "soil_permeability_reason": "N/A",
            "erosion_risk": "Unknown", "erosion_risk_reason": "N/A",
            "recommended_crops": ["API Key Missing"],
            "construction_difficulty": 0, "construction_difficulty_reason": "N/A",
            "expert_summary": "Error: API Key not configured."
        }
    if terrain_class == "MODEL_NOT_LOADED":
        return {
            "soil_permeability": 0, "soil_permeability_reason": "N/A",
            "erosion_risk": "Unknown", "erosion_risk_reason": "N/A",
            "recommended_crops": [],
            "construction_difficulty": 0, "construction_difficulty_reason": "N/A",
            "expert_summary": "Explanation unavailable because the classification model is not loaded."
        }

    # Build location context
    location_context = ""
    if latitude is not None and longitude is not None:
        location_context = f" The image was captured at GPS coordinates ({latitude}, {longitude}). Factor in the regional climate, soil composition, and geological characteristics of this area into your analysis."

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are GeoScribe, an expert agronomist, geologist, and land-use advisor. Analyze the given terrain classification and provide strict metric estimations based on standard geological properties of that terrain. For every metric score you provide, also give a short scientific reasoning."),
        ("human", "A user has uploaded a photo and our ML model identified the terrain as '{terrain_class}'.{location_context} Provide a realistic scientific analysis of this land type.")
    ])

    try:
        chain = prompt | llm
        result: TerrainAnalysis = chain.invoke({"terrain_class": terrain_class, "location_context": location_context})
        
        # Convert the Pydantic model to a dict to send as JSON
        return result.model_dump()
        
    except Exception as e:
        print(f"❌ Unexpected error during LangChain Groq call: {e}")
        return {
            "soil_permeability": 0, "soil_permeability_reason": "N/A",
            "erosion_risk": "Error", "erosion_risk_reason": "N/A",
            "recommended_crops": [],
            "construction_difficulty": 0, "construction_difficulty_reason": "N/A",
            "expert_summary": f"An error occurred while fetching analysis: {str(e)}"
        }

def predict_image(image_bytes):
    if not model_loaded or model is None or not class_names:
        print("Attempted prediction, but model is not loaded.")
        return "MODEL_NOT_LOADED", 0.0

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((IMG_HEIGHT, IMG_WIDTH))
        img_array = tf.keras.utils.img_to_array(img)
        img_array = tf.expand_dims(img_array, 0)

        predictions = model.predict(img_array, verbose=0)
        score = tf.nn.softmax(predictions[0])

        predicted_class_index = np.argmax(score)
        predicted_class = class_names[predicted_class_index]
        confidence_score = float(np.max(score))

        print(f"Prediction: {predicted_class}, Confidence: {confidence_score:.2f}")
        return predicted_class, confidence_score

    except Exception as e:
        print(f"Error during image prediction: {e}")
        return "PREDICTION_ERROR", 0.0

@app.post("/predict/")
async def create_upload_file(
    file: UploadFile = File(...),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    print(f"📸 Received file: {file.filename}, Content-Type: {file.content_type}")
    if latitude and longitude:
        print(f"📍 GPS Location: ({latitude}, {longitude})")
    image_bytes = await file.read()

    predicted_class, confidence = predict_image(image_bytes)

    if predicted_class == "MODEL_NOT_LOADED" or predicted_class == "PREDICTION_ERROR":
        ai_data = {
            "soil_permeability": 0, "soil_permeability_reason": "N/A",
            "erosion_risk": "Unknown", "erosion_risk_reason": "N/A",
            "recommended_crops": [],
            "construction_difficulty": 0, "construction_difficulty_reason": "N/A",
            "expert_summary": "Image classification failed. No AI analysis available."
        }
        confidence = 0.0
    else:
        ai_data = await get_llm_explanation(predicted_class, latitude, longitude)

    return {
        "filename": file.filename,
        "predicted_class": predicted_class,
        "confidence": confidence,
        "analysis_data": ai_data
    }

