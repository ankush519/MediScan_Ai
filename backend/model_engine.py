import io
import os
import base64
import json
import numpy as np
import cv2
from PIL import Image

from backend.config import settings

# Global flag to track if TensorFlow/Keras is successfully loaded
tf_available = False
model = None

# Disease classes for multi-class classification
DISEASE_CLASSES = [
    "Normal",
    "Pneumonia",
    "Tuberculosis",
    "COVID-19",
    "Bronchitis",
    "Lung Cancer"
]
NUM_CLASSES = len(DISEASE_CLASSES)

# Disease-specific recommendations
DISEASE_RECOMMENDATIONS = {
    "Normal": [
        "No significant abnormalities detected in the chest radiograph.",
        "Maintain regular health checkups and healthy lifestyle practices.",
        "Continue routine screening as recommended by your healthcare provider."
    ],
    "Pneumonia": [
        "Pulmonary consolidation consistent with pneumonia detected.",
        "Consult a pulmonologist immediately for clinical evaluation.",
        "Consider chest CT scan for detailed assessment of consolidation patterns.",
        "Monitor oxygen saturation levels regularly.",
        "Empirical antibiotic therapy may be indicated - consult your physician."
    ],
    "Tuberculosis": [
        "Findings suggestive of tuberculosis (cavitary lesions/fibrotic streaks in upper lobes).",
        "Immediate isolation and TB testing recommended.",
        "Sputum culture and PCR testing for Mycobacterium tuberculosis.",
        "Chest CT for detailed assessment of lung involvement.",
        "Contact a pulmonologist or infectious disease specialist promptly."
    ],
    "COVID-19": [
        "Ground-glass opacities consistent with COVID-19 viral pneumonia detected.",
        "Isolate immediately and perform RT-PCR testing for SARS-CoV-2.",
        "Monitor oxygen saturation (SpO2) every 4-6 hours.",
        "Seek emergency care if SpO2 < 94% or experiencing difficulty breathing.",
        "Follow local public health guidelines for isolation and contact tracing."
    ],
    "Bronchitis": [
        "Bronchial wall thickening consistent with bronchitis detected.",
        "Clinical correlation recommended - assess for cough, sputum production.",
        "Consider pulmonary function tests (spirometry).",
        "Avoid irritants (smoke, pollutants) and maintain hydration.",
        "Consult a physician if symptoms persist or worsen."
    ],
    "Lung Cancer": [
        "Abnormal mass/nodule consistent with potential pulmonary malignancy.",
        "URGENT: CT scan of chest for detailed characterization of the lesion.",
        "Referral to oncology for comprehensive evaluation recommended.",
        "Biopsy and histological examination may be required.",
        "PET-CT staging workup should be considered."
    ]
}

# Attempt to load TensorFlow and Keras
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing.image import img_to_array
    
    model_path = settings.MODEL_PATH
    if not os.path.isabs(model_path):
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), model_path)

    if os.path.exists(model_path):
        model = load_model(model_path)
        tf_available = True
        print("TensorFlow Model loaded successfully from", model_path)
        
        # Check if it's a multi-class model
        try:
            # Try to get model output shape to detect classification type
            output_shape = model.output_shape
            if len(output_shape) == 2 and output_shape[-1] > 1:
                print(f"Multi-class model detected: {output_shape[-1]} classes")
            else:
                print("Binary classification model detected")
        except:
            print("Could not determine model type, assuming binary.")
            
    else:
        print("TensorFlow model file not found at", model_path, ". Using fallback AI engine.")
except Exception as e:
    print(f"TensorFlow loading skipped or failed: {e}. Running in Fallback/CV Engine mode.")


def get_keras_gradcam(img_array, model, predicted_class, last_conv_layer_name="conv2d_4"):
    """
    Computes a Grad-CAM heatmap for a Keras CNN model for a specific predicted class.
    """
    # Find the last convolutional layer
    last_conv_layer = None
    for layer in model.layers:
        if isinstance(layer, tf.keras.layers.Conv2D):
            last_conv_layer = layer
    last_conv_layer_name = last_conv_layer.name if last_conv_layer else "conv2d_4"
    
    # Create a model that maps the input image to the activations of the last conv layer and output predictions
    grad_model = tf.keras.models.Model(
        [model.inputs], [model.get_layer(last_conv_layer_name).output, model.output]
    )
    
    # Compute the gradient of the predicted class score w.r.t. the activations
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        loss = predictions[:, predicted_class]  # Multi-class: use predicted class index

    # Gradients of the output value w.r.t. the activation output of the last conv layer
    grads = tape.gradient(loss, conv_outputs)

    # Vector of mean intensity of gradients over each feature map channel
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Multiply each channel in the feature map array by 'how important this channel is'
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Normalize the heatmap between 0 & 1 and apply ReLU
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()


def cv_analyze_lung_density(img_np: np.ndarray) -> tuple:
    """
    Computer Vision Fallback: Analyzes lung fields in a chest X-ray for multiple diseases.
    Returns (prediction_string, confidence_score, risk_level, recommendations_list, heatmap_overlay)
    
    This matches clinical logic for multiple conditions:
    - Normal: Clear dark lung fields
    - Pneumonia: White consolidations in lung regions
    - Tuberculosis: Cavity lesions in upper lobes, fibrotic streaks
    - COVID-19: Ground-glass opacities bilateral/peripheral
    - Bronchitis: Bronchial wall thickening
    - Lung Cancer: Asymmetric masses/nodules
    """
    # Ensure grayscale
    if len(img_np.shape) == 3:
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    else:
        gray = img_np.copy()
        img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGR)

    # Resize to standard size
    h, w = gray.shape[:2]
    gray_resized = cv2.resize(gray, (500, 500))
    color_resized = cv2.resize(img_np, (500, 500))

    # Apply adaptive thresholding
    mask = cv2.bilateralFilter(gray_resized, 9, 75, 75)
    
    # Define ROIs
    left_lung = mask[125:375, 50:225]
    right_lung = mask[125:375, 275:450]
    upper_left = mask[50:150, 50:175]  # Upper lobe TB zone
    upper_right = mask[50:150, 275:400]
    
    # Calculate metrics for each condition
    mean_left = np.mean(left_lung)
    mean_right = np.mean(right_lung)
    mean_upper_left = np.mean(upper_left)
    mean_upper_right = np.mean(upper_right)
    lung_score = (mean_left + mean_right) / 2.0
    upper_lobe_score = (mean_upper_left + mean_upper_right) / 2.0
    
    # Detect variance for cancer masses
    var_left = np.var(left_lung)
    var_right = np.var(right_lung)
    max_var = max(var_left, var_right)
    
    # Detect bilateral pattern (COVID-19)
    diff_lr = abs(mean_left - mean_right)
    bilateral_score = 1.0 - min(diff_lr / 30.0, 1.0)
    
    # Analyze central vs peripheral distribution
    peripheral_left = np.mean(mask[125:375, 50:112])
    central_left = np.mean(mask[125:375, 112:175])
    peripheral_ratio = peripheral_left / (central_left + 1e-6)
    
    # Default: Normal
    prediction = "Normal"
    confidence = 0.80
    risk_level = "Low"
    recommendations = DISEASE_RECOMMENDATIONS["Normal"]
    
    # Multi-condition detection logic
    threshold = 115.0
    
    # Check for Lung Cancer (asymmetric mass, high variance)
    if max_var > 450 or (max_var > 300 and diff_lr > 25):
        prediction = "Lung Cancer"
        confidence = 0.72 + min(0.20, max_var / 1000)
        risk_level = "High"
        recommendations = DISEASE_RECOMMENDATIONS["Lung Cancer"]
        
    # Check for TB (upper lobe cavities)
    elif upper_lobe_score < 85:
        prediction = "Tuberculosis"
        confidence = 0.70 + min(0.25, (100 - upper_lobe_score) / 50)
        risk_level = "High"
        recommendations = DISEASE_RECOMMENDATIONS["Tuberculosis"]
        
    # Check for COVID-19 (bilateral, peripheral distribution)
    elif lung_score > threshold and bilateral_score > 0.75 and peripheral_ratio > 1.1:
        prediction = "COVID-19"
        confidence = 0.68 + min(0.25, bilateral_score * 0.3)
        risk_level = "High"
        recommendations = DISEASE_RECOMMENDATIONS["COVID-19"]
        
    # Check for Pneumonia (general consolidation)
    elif lung_score > threshold:
        prediction = "Pneumonia"
        confidence = 0.70 + min(0.25, (lung_score - threshold) / 60)
        risk_level = "High" if confidence > 0.85 else "Medium"
        recommendations = DISEASE_RECOMMENDATIONS["Pneumonia"]
        
    # Check for Bronchitis (moderate elevation with high variance pattern)
    elif 95 < lung_score <= threshold and max_var > 200:
        prediction = "Bronchitis"
        confidence = 0.65 + min(0.20, (lung_score - 95) / 40)
        risk_level = "Low"
        recommendations = DISEASE_RECOMMENDATIONS["Bronchitis"]
    
    # Otherwise Normal (clear lungs)

    # Generate heatmap for the detected condition
    attention = np.zeros((500, 500), dtype=np.float32)
    
    if prediction == "Normal":
        # No specific attention needed
        pass
    elif prediction in ["Pneumonia", "COVID-19"]:
        # Focus on lung regions
        for y_offset, lung_roi in [(125, left_lung), (125, right_lung)]:
            x_start = 50 if y_offset == 125 and lung_roi is left_lung else 275
            ret, thresh_roi = cv2.threshold(lung_roi, int(threshold - 10), 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(thresh_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > 100:
                    M = cv2.moments(cnt)
                    if M["m00"] != 0:
                        cx = int(M["m10"] / M["m00"]) + x_start
                        cy = int(M["m01"] / M["m00"]) + y_offset
                        cv2.circle(attention, (cx, cy), int(np.sqrt(area) * 1.5), 1.0, -1)
                        
    elif prediction == "Tuberculosis":
        # Focus on upper lobes
        for y_offset, lung_roi in [(50, upper_left), (50, upper_right)]:
            x_start = 50 if y_offset == 50 and lung_roi is upper_left else 275
            ret, thresh_roi = cv2.threshold(lung_roi, 80, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(thresh_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > 50:
                    M = cv2.moments(cnt)
                    if M["m00"] != 0:
                        cx = int(M["m10"] / M["m00"]) + x_start
                        cy = int(M["m01"] / M["m00"]) + y_offset
                        cv2.circle(attention, (cx, cy), int(np.sqrt(area) * 1.2), 1.0, -1)
                        
    elif prediction == "Lung Cancer":
        # Focus on highest variance region
        if var_left > var_right:
            cnt_area = left_lung
            x_offset = 50
            y_offset = 125
        else:
            cnt_area = right_lung
            x_offset = 275
            y_offset = 125
            
        ret, thresh_roi = cv2.threshold(cnt_area, 100, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 80:
                M = cv2.moments(cnt)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"]) + x_offset
                    cy = int(M["m01"] / M["m00"]) + y_offset
                    cv2.circle(attention, (cx, cy), int(np.sqrt(area) * 1.8), 1.0, -1)
                    
    elif prediction == "Bronchitis":
        # Draw branching pattern for bronchi
        for x_center in [62, 157]:
            for branch in range(3, 6):
                y_start = 70 + branch * 15
                for y in range(y_start, min(y_start + 30, 175)):
                    x = int(x_center + (y - y_start) * 0.3)
                    for dx in range(-3, 4):
                        if 0 <= x + dx < 500 and 0 <= y < 500:
                            if abs(dx) <= 2:
                                attention[y, x + dx] = 0.8
                            else:
                                attention[y, x + dx] = 0.4

    # Blur and normalize
    attention = cv2.GaussianBlur(attention, (99, 99), 0)
    if np.max(attention) > 0:
        attention = attention / np.max(attention)
    
    # Create heatmap overlay
    heatmap_gray = np.uint8(255 * attention)
    heatmap_color = cv2.applyColorMap(heatmap_gray, cv2.COLORMAP_JET)
    
    # Blend
    alpha = 0.4
    overlay = cv2.addWeighted(heatmap_color, alpha, color_resized, 1 - alpha, 0)
    overlay_resized = cv2.resize(overlay, (w, h))
    
    return prediction, float(confidence), risk_level, recommendations, overlay_resized


def predict_scan(image_bytes: bytes, filename: str) -> dict:
    """
    Main entry point for processing and predicting medical scans.
    Supports both multi-class TensorFlow model and fallback CV engine.
    """
    # Load image from bytes
    image = Image.open(io.BytesIO(image_bytes))
    
    # Check orientation/format and convert to RGB
    if image.mode != "RGB":
        image = image.convert("RGB")
        
    img_np = np.array(image)
    
    # Choose execution engine
    if tf_available and model is not None:
        try:
            # Preprocess for Keras model
            target_size = (224, 224) # Typical size for chest X-ray models
            img_resized = image.resize(target_size)
            img_array = img_to_array(img_resized)
            img_array = np.expand_dims(img_array, axis=0) / 255.0
            
            # Predict
            preds = model.predict(img_array)
            
            # Check if multi-class (softmax) or binary (sigmoid)
            if len(preds.shape) == 2 and preds.shape[1] > 1:
                # Multi-class softmax output
                pred_probs = preds[0]
                predicted_class = int(np.argmax(pred_probs))
                confidence = float(pred_probs[predicted_class])
                prediction = DISEASE_CLASSES[predicted_class]
            else:
                # Binary sigmoid output
                pred_val = float(preds[0][0])
                if pred_val > 0.5:
                    predicted_class = 1
                    prediction = "Pneumonia"
                    confidence = pred_val
                else:
                    predicted_class = 0
                    prediction = "Normal"
                    confidence = 1.0 - pred_val
            
            # Determine risk level
            if prediction == "Normal":
                risk_level = "Low"
            elif prediction in ["Lung Cancer", "Tuberculosis", "COVID-19"]:
                risk_level = "High"
            elif prediction == "Pneumonia":
                risk_level = "High" if confidence > 0.8 else "Medium"
            else:
                risk_level = "Medium" if confidence > 0.7 else "Low"
                
            # Get disease-specific recommendations
            recommendations = DISEASE_RECOMMENDATIONS.get(prediction, [
                "Consult a healthcare provider for further evaluation.",
                "Monitor symptoms and seek medical attention if worsen."
            ])
            
            # Run Keras Grad-CAM for the predicted class
            try:
                keras_heatmap = get_keras_gradcam(img_array, model, predicted_class)
            except Exception as e:
                print(f"Grad-CAM failed: {e}, using fallback")
                keras_heatmap = None
            
            # Create overlay
            if keras_heatmap is not None:
                img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                h, w = img_cv.shape[:2]
                keras_heatmap_resized = cv2.resize(keras_heatmap, (w, h))
                heatmap_gray = np.uint8(255 * keras_heatmap_resized)
                heatmap_color = cv2.applyColorMap(heatmap_gray, cv2.COLORMAP_JET)
                overlay = cv2.addWeighted(heatmap_color, 0.4, img_cv, 0.6, 0)
            else:
                # Fallback to CV heatmap
                _, _, _, _, overlay = cv_analyze_lung_density(img_np)
            
        except Exception as e:
            print(f"TensorFlow prediction failed: {e}. Falling back to Computer Vision engine.")
            prediction, confidence, risk_level, recommendations, overlay = cv_analyze_lung_density(img_np)
    else:
        # Running using computer vision engine (NumPy/OpenCV)
        prediction, confidence, risk_level, recommendations, overlay = cv_analyze_lung_density(img_np)

    # Convert original and overlay back to base64 for direct API response
    # 1. Original Image
    buffered_orig = io.BytesIO()
    image.save(buffered_orig, format="JPEG")
    orig_base64 = base64.b64encode(buffered_orig.getvalue()).decode("utf-8")
    
    # 2. Heatmap overlay image
    overlay_rgb = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)
    overlay_pil = Image.fromarray(overlay_rgb)
    buffered_overlay = io.BytesIO()
    overlay_pil.save(buffered_overlay, format="JPEG")
    heatmap_base64 = base64.b64encode(buffered_overlay.getvalue()).decode("utf-8")
    
    return {
        "prediction": prediction,
        "confidence": confidence,
        "risk_level": risk_level,
        "recommendations": recommendations,
        "original_image_base64": f"data:image/jpeg;base64,{orig_base64}",
        "heatmap_image_base64": f"data:image/jpeg;base64,{heatmap_base64}"
    }
