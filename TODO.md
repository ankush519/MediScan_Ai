# MediScan AI - Multi-Disease Model Training TODO

## Task: Expand model to detect multiple chest diseases

### Step 1: Update model_training/train_model.py
- [x] Understand current binary classification structure
- [x] Expand to generate synthetic data for 6 diseases (Normal, Pneumonia, Tuberculosis, COVID-19, Bronchitis, Lung Cancer)
- [x] Change model from binary sigmoid to multi-class softmax output
- [x] Update training with categorical_crossentropy loss
- [ ] Save new model file (run the training script)

### Step 2: Update backend/model_engine.py
- [x] Update TensorFlow prediction to handle multi-class softmax output
- [x] Map output indices to disease labels
- [x] Update recommendations per disease
- [x] Update CV fallback engine to detect multiple conditions
- [x] Update heatmap/Grad-CAM for multi-class

### Step 3: Test the changes
- [ ] Run training script to generate multi-class model
- [ ] Test predictions with sample images
