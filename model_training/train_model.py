import argparse
import os
import numpy as np

# Suppress TensorFlow logs for clean execution
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Define disease classes for multi-class classification
DISEASE_CLASSES = [
    "Normal",
    "Pneumonia",
    "Tuberculosis",
    "COVID-19",
    "Bronchitis",
    "Lung Cancer"
]

NUM_CLASSES = len(DISEASE_CLASSES)


def create_synthetic_xray_data(num_samples=100, img_shape=(224, 224, 3)):
    """
    Generates realistic synthetic chest X-ray images (PA views) for multiple disease categories.
    Each disease has distinct visual characteristics:
    
    0. Normal: Clear lung fields, dark bilateral lungs
    1. Pneumonia: Cloudy/white consolidations in lung regions
    2. Tuberculosis: Cavity lesions (dark holes) in upper lobes, fibrotic streaks
    3. COVID-19: Ground-glass opacities bilateral, peripheral distribution
    4. Bronchitis: Increased bronchial wall thickening, peribronchial cuffing
    5. Lung Cancer: Masses/nodules, asymmetric lesions
    
    Returns:
        images: numpy array of synthetic X-ray images
        labels: numpy array of one-hot encoded labels
    """
    images = []
    labels = []
    
    for i in range(num_samples):
        # Randomly select a disease class
        disease_class = np.random.randint(0, NUM_CLASSES)
        
        # Base chest canvas (dark chest cage silhouette)
        canvas = np.zeros((img_shape[0], img_shape[1]), dtype=np.float32)
        
        # Background rib-cage gradient (base anatomy)
        for y in range(img_shape[0]):
            canvas[y, :] = 0.15 + 0.15 * np.sin(np.pi * y / img_shape[0])
            
        # Draw lung fields (two dark oval regions left and right)
        # Left lung field
        for y in range(50, 180):
            for x in range(30, 95):
                dist = ((y - 115) / 65)**2 + ((x - 62) / 32)**2
                if dist < 1.0:
                    canvas[y, x] = 0.05 + 0.05 * dist
        
        # Right lung field
        for y in range(50, 180):
            for x in range(125, 190):
                dist = ((y - 115) / 65)**2 + ((x - 157) / 32)**2
                if dist < 1.0:
                    canvas[y, x] = 0.05 + 0.05 * dist
        
        # Apply disease-specific patterns
        if disease_class == 1:  # Pneumonia
            # White cloud-like consolidations in lung regions
            side = np.random.choice([62, 157])
            cy = np.random.randint(90, 140)
            cx = side + np.random.randint(-15, 15)
            r = np.random.randint(18, 32)
            
            for y in range(max(0, cy - r), min(img_shape[0], cy + r)):
                for x in range(max(0, cx - r), min(img_shape[1], cx + r)):
                    dist = ((y - cy)**2 + (x - cx)**2) / r**2
                    if dist < 1.0:
                        opacity = 0.45 * (1.0 - dist)
                        canvas[y, x] = min(0.85, canvas[y, x] + opacity)
                        
        elif disease_class == 2:  # Tuberculosis
            # Cavity lesions (dark holes) in upper lobes + fibrotic streaks
            # Upper lobe location (y < 100)
            for _ in range(np.random.randint(1, 3)):
                cx = np.random.randint(40, 90) if np.random.random() > 0.5 else np.random.randint(130, 180)
                cy = np.random.randint(60, 95)
                r = np.random.randint(8, 15)
                
                # Cavity = very dark region
                for y in range(max(0, cy - r), min(img_shape[0], cy + r)):
                    for x in range(max(0, cx - r), min(img_shape[1], cx + r)):
                        dist = ((y - cy)**2 + (x - cx)**2) / r**2
                        if dist < 1.0:
                            canvas[y, x] = max(0.02, canvas[y, x] - 0.25 * (1.0 - dist))
            
            # Fibrotic linear streaks
            for _ in range(np.random.randint(2, 5)):
                x1 = np.random.randint(40, 90) if np.random.random() > 0.5 else np.random.randint(130, 180)
                y1 = np.random.randint(70, 120)
                y2 = y1 + np.random.randint(20, 50)
                for y in range(y1, min(y2, img_shape[0])):
                    x = int(x1 + (y - y1) * 0.1)
                    for dx in range(-1, 2):
                        if 0 <= x + dx < img_shape[1] and 0 <= y < img_shape[0]:
                            canvas[y, x + dx] = min(0.03, canvas[y, x + dx])
                            
        elif disease_class == 3:  # COVID-19
            # Ground-glass opacities bilateral (both lungs) - peripheral distribution
            for side_offset, lung_side in [(62, 'left'), (157, 'right')]:
                num_lesions = np.random.randint(2, 5)
                for _ in range(num_lesions):
                    # Peripheral (outer edges of lung)
                    if lung_side == 'left':
                        cx = np.random.randint(35, 85)
                    else:
                        cx = np.random.randint(130, 180)
                    cy = np.random.randint(80, 160)
                    r = np.random.randint(12, 22)
                    
                    # Softer, more diffuse opacity
                    for y in range(max(0, cy - r), min(img_shape[0], cy + r)):
                        for x in range(max(0, cx - r), min(img_shape[1], cx + r)):
                            dist = ((y - cy)**2 + (x - cx)**2) / r**2
                            if dist < 1.0:
                                # More diffuse/transparent than pneumonia
                                opacity = 0.30 * (1.0 - dist**0.5)
                                canvas[y, x] = min(0.70, canvas[y, x] + opacity)
                                
        elif disease_class == 4:  # Bronchitis
            # Bronchial wall thickening - prominent airway walls
            for lung_side in ['left', 'right']:
                x_center = 62 if lung_side == 'left' else 157
                for branch in range(3, 6):
                    # Branching pattern representing bronchi
                    y_start = 70 + branch * 15
                    for y in range(y_start, min(y_start + 30, 175)):
                        x = x_center + int((y - y_start) * 0.3)
                        # Thickened wall = brighter ring
                        for thickness in range(-2, 3):
                            if 0 <= x + thickness < img_shape[1] and 0 <= y < img_shape[0]:
                                if abs(thickness) <= 1:
                                    canvas[y, x + thickness] = min(0.45, canvas[y, x + thickness] + 0.20)
                                else:
                                    canvas[y, x + thickness] = min(0.30, canvas[y, x + thickness] + 0.10)
                                    
        elif disease_class == 5:  # Lung Cancer
            # Masses/nodules - asymmetric, irregular masses
            side = np.random.choice([62, 157])
            # Can be anywhere but often upper lobes
            cy = np.random.randint(70, 140)
            cx = side + np.random.randint(-25, 25)
            r = np.random.randint(15, 28)
            
            # Irregular mass with spiky edges
            for y in range(max(0, cy - r), min(img_shape[0], cy + r)):
                for x in range(max(0, cx - r), min(img_shape[1], cx + r)):
                    dist = ((y - cy)**2 + (x - cx)**2) / r**2
                    if dist < 1.0:
                        # Irregular density
                        noise = np.random.uniform(-0.1, 0.1)
                        opacity = 0.55 + noise
                        canvas[y, x] = np.clip(canvas[y, x] + opacity, 0.02, 0.90)
            
            # Sometimes associated pleural effusion ( pooling at base)
            if np.random.random() > 0.6:
                for y in range(160, min(185, img_shape[0])):
                    for x in range(25, 195):
                        dist = ((y - 175)**2 / 15**2 + (x - 112)**2 / 85**2)
                        if dist < 1.5:
                            canvas[y, x] = min(0.65, canvas[y, x] + 0.15)
        
        # Add random noise to simulate real X-ray grain
        noise = np.random.normal(0, 0.02, canvas.shape)
        canvas = np.clip(canvas + noise, 0, 1)
        
        # Convert to 3-channel RGB
        rgb_img = np.stack([canvas, canvas, canvas], axis=-1)
        images.append(rgb_img)
        
        # One-hot encode labels
        label = np.zeros(NUM_CLASSES)
        label[disease_class] = 1
        labels.append(label)
        
    return np.array(images), np.array(labels)


def train_and_export_model(epochs=15, samples_per_class=150):
    print("=" * 70)
    print("MediScan AI Multi-Disease Chest X-Ray CNN Training")
    print("=" * 70)
    print(f"Disease Classes: {DISEASE_CLASSES}")
    print(f"Number of Classes: {NUM_CLASSES}")
    print(f"Training epochs: {epochs}")
    print(f"Samples per class: {samples_per_class}")
    
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import (
            Conv2D, MaxPooling2D, Flatten, Dense, Dropout, 
            BatchNormalization, Input
        )
        from tensorflow.keras.optimizers import Adam
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
        
        # 1. Generate Dataset
        print("\n--> Generating synthetic multi-disease chest X-ray database...")
        total_samples = samples_per_class * NUM_CLASSES
        
        X_train, y_train = create_synthetic_xray_data(num_samples=total_samples)
        X_val, y_val = create_synthetic_xray_data(num_samples=total_samples // 5)
        
        print(f"--> Training samples: {len(X_train)}, Validation samples: {len(X_val)}")
        print(f"--> Image shape: {X_train.shape[1:]}")
        
        # 2. Build CNN Architecture for Multi-Class Classification
        print("\n--> Constructing Multi-Class Deep CNN Classifier...")
        
        model = Sequential([
            # Input layer
            Input(shape=(224, 224, 3)),
            
            # Block 1
            Conv2D(32, (3, 3), activation='relu', padding='same', name="conv2d_1"),
            BatchNormalization(name="bn_1"),
            MaxPooling2D((2, 2)),
            
            # Block 2
            Conv2D(64, (3, 3), activation='relu', padding='same', name="conv2d_2"),
            BatchNormalization(name="bn_2"),
            MaxPooling2D((2, 2)),
            
            # Block 3
            Conv2D(128, (3, 3), activation='relu', padding='same', name="conv2d_3"),
            BatchNormalization(name="bn_3"),
            MaxPooling2D((2, 2)),
            
            # Block 4 - Feature extraction for Grad-CAM
            Conv2D(256, (3, 3), activation='relu', padding='same', name="conv2d_4"),
            BatchNormalization(name="bn_4"),
            MaxPooling2D((2, 2)),
            
            # Classification head
            Flatten(name="flatten"),
            Dense(256, activation='relu', name="dense_1"),
            Dropout(0.5, name="dropout_1"),
            Dense(128, activation='relu', name="dense_2"),
            Dropout(0.3, name="dropout_2"),
            Dense(NUM_CLASSES, activation='softmax', name="output")  # Softmax for multi-class
        ])
        
        # Compile Model with categorical crossentropy loss
        model.compile(
            optimizer=Adam(learning_rate=1e-4),
            loss='categorical_crossentropy',
            metrics=['accuracy', tf.keras.metrics.TopKCategoricalAccuracy(k=3, name="top3_acc")]
        )
        
        print("\n--> Model Architecture:")
        model.summary()
        
        # Callbacks
        callbacks = [
            EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
            ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)
        ]
        
        # 3. Train Model
        print("\n--> Training CNN on multi-disease chest scans...")
        print(f"--> Classes: {DISEASE_CLASSES}")
        
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=15,
            batch_size=16,
            callbacks=callbacks,
            verbose=1
        )
        
        # Print metrics
        final_acc = history.history['accuracy'][-1]
        val_acc = history.history['val_accuracy'][-1]
        final_loss = history.history['loss'][-1]
        val_loss = history.history['val_loss'][-1]
        
        print("\n" + "=" * 50)
        print("--> TRAINING COMPLETE")
        print("=" * 50)
        print(f"Training Accuracy:   {final_acc * 100:.2f}%")
        print(f"Validation Accuracy: {val_acc * 100:.2f}%")
        print(f"Training Loss:      {final_loss:.4f}")
        print(f"Validation Loss:  {val_loss:.4f}")
        
        # 4. Save Model File
        models_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            "backend", 
            "models"
        )
        os.makedirs(models_dir, exist_ok=True)
        
        # Save as .h5 format
        model_save_path = os.path.join(models_dir, "multi_disease_model.h5")
        print(f"\n--> Saving model to: {model_save_path}")
        model.save(model_save_path)
        
        # Also save class labels for reference
        import json
        classes_info = {
            "classes": DISEASE_CLASSES,
            "num_classes": NUM_CLASSES,
            "model_type": "multi_class_cnn"
        }
        classes_path = os.path.join(models_dir, "disease_classes.json")
        with open(classes_path, 'w') as f:
            json.dump(classes_info, f, indent=2)
        print(f"--> Saved class info to: {classes_path}")
        
        print("\n--> Multi-disease model training complete!")
        print("=" * 70)
        
    except ImportError as e:
        print(f"\n[!] ERROR: TensorFlow/Keras not installed: {e}")
        print("[!] To use this training script, run: pip install tensorflow")
        print("=" * 70)
    except Exception as e:
        print(f"\n[!] ERROR during training: {e}")
        print("=" * 70)


def parse_command_line_arguments():
    parser = argparse.ArgumentParser(
        description="Train a synthetic multi-disease chest X-ray model and export it for backend inference."
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=15,
        help="Number of training epochs (default: 15)."
    )
    parser.add_argument(
        "--samples-per-class",
        type=int,
        default=150,
        help="Number of synthetic samples generated per disease class (default: 150)."
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_command_line_arguments()
    train_and_export_model(epochs=args.epochs, samples_per_class=args.samples_per_class)
