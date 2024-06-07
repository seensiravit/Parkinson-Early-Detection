import torch
import torchvision.transforms as T
import torch.nn.functional as F
from torchvision import models
import torch.nn as nn

import numpy as np
import matplotlib.pyplot as plt

import cv2

from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

device = torch.device('cpu')

model = models.vgg16()
model.classifier[6] = nn.Linear(4096, 2)
model.load_state_dict(torch.load('backend/model_vgg16.pth' , map_location=device))

model.eval()

transform = T.Compose([
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225),)
])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

def background2white(image) :
    arr = np.asarray(image)
    
    if arr.ndim == 3 and arr.shape[-1]==4 :
        white_background = Image.new("RGB", image.size, (255, 255, 255))
        white_background.paste(image, (0, 0), image)
        return white_background
    else : 
        return image

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    image = Image.open(file.file)

    image = background2white(image).convert("RGB")
    
    image.save('backend\input.jpg')
    
    print(image.size)
    print()
    image = transform(image)
    image = image.unsqueeze(0) 
    
    print(image.size)
    
    with torch.no_grad():
        output = model(image)
    
    print(output)
    
    _, predicted = torch.max(output, 1)
    
    predicted_class = predicted.item()
    
    probabilities = F.softmax(output[0] , dim=0)
    probabilities = probabilities.tolist()
    
    print(probabilities)
    
    return JSONResponse([predicted_class , probabilities[0] , probabilities[1] , output.tolist()])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
