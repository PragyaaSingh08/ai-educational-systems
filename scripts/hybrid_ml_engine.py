import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns
import json
import sys
import warnings
warnings.filterwarnings('ignore')

class HybridMLEngine:
    def __init__(self):
        self.models = {}
        self.ensemble_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.target_name = ""
        
    def load_dataset(self, file_path):
        """Load dataset from CSV file"""
        try:
            self.data = pd.read_csv(file_path)
            print(f"Dataset loaded successfully: {self.data.shape}")
            print(f"Columns: {list(self.data.columns)}")
            return True
        except Exception as e:
            print(f"Error loading dataset: {e}")
            return False
    
    def prepare_data(self, target_column):
        """Prepare data for machine learning"""
        try:
            # Separate features and target
            self.target_name = target_column
            self.feature_names = [col for col in self.data.columns if col != target_column]
            
            X = self.data[self.feature_names]
            y = self.data[target_column]
            
            # Handle categorical features
            X_processed = pd.get_dummies(X, drop_first=True)
            self.feature_names = list(X_processed.columns)
            
            # Encode target if categorical
            if y.dtype == 'object':
                y = self.label_encoder.fit_transform(y)
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X_processed)
            
            # Split data with 70% training, 30% testing
            self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
                X_scaled, y, test_size=0.3, random_state=42, stratify=y
            )
            
            print(f"Data prepared: {len(self.feature_names)} features, {len(np.unique(y))} classes")
            print(f"Training set: {len(self.X_train)} samples, Test set: {len(self.X_test)} samples")
            return True
            
        except Exception as e:
            print(f"Error preparing data: {e}")
            return False
    
    def train_individual_models(self):
        """Train individual ML models"""
        # Define individual models
        models_config = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'SVM': SVC(probability=True, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42),
            'Neural Network': MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42)
        }
        
        results = {}
        
        for name, model in models_config.items():
            print(f"Training {name}...")
            
            # Train model
            model.fit(self.X_train, self.y_train)
            
            # Make predictions
            train_pred = model.predict(self.X_train)
            test_pred = model.predict(self.X_test)
            
            # Calculate metrics
            train_accuracy = accuracy_score(self.y_train, train_pred)
            test_accuracy = accuracy_score(self.y_test, test_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(model, self.X_train, self.y_train, cv=5)
            
            results[name] = {
                'model': model,
                'train_accuracy': float(train_accuracy),
                'test_accuracy': float(test_accuracy),
                'cv_mean': float(cv_scores.mean()),
                'cv_std': float(cv_scores.std())
            }
            
            self.models[name] = model
            
            print(f"{name} - Test Accuracy: {test_accuracy:.4f}, CV: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        return results
    
    def create_hybrid_ensemble(self):
        """Create hybrid ensemble model combining multiple algorithms"""
        # Create voting classifier with different algorithms
        estimators = [
            ('rf', self.models['Random Forest']),
            ('svm', self.models['SVM']),
            ('gb', self.models['Gradient Boosting']),
            ('nn', self.models['Neural Network'])
        ]
        
        # Hard voting ensemble
        self.ensemble_model = VotingClassifier(
            estimators=estimators,
            voting='soft'  # Use probability-based voting
        )
        
        print("Training hybrid ensemble model...")
        self.ensemble_model.fit(self.X_train, self.y_train)
        
        # Evaluate ensemble
        ensemble_pred = self.ensemble_model.predict(self.X_test)
        ensemble_accuracy = accuracy_score(self.y_test, ensemble_pred)
        
        print(f"Hybrid Ensemble Accuracy: {ensemble_accuracy:.4f}")
        
        return ensemble_accuracy
    
    def generate_visualizations(self):
        """Generate visualizations for the analysis"""
        plt.style.use('default')
        
        # 1. Model Comparison
        plt.figure(figsize=(12, 6))
        
        model_names = list(self.models.keys())
        test_accuracies = [accuracy_score(self.y_test, model.predict(self.X_test)) 
                          for model in self.models.values()]
        
        # Add ensemble accuracy
        if self.ensemble_model:
            model_names.append('Hybrid Ensemble')
            ensemble_pred = self.ensemble_model.predict(self.X_test)
            test_accuracies.append(accuracy_score(self.y_test, ensemble_pred))
        
        plt.subplot(1, 2, 1)
        bars = plt.bar(model_names, test_accuracies, color=['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'])
        plt.title('Model Performance Comparison')
        plt.ylabel('Test Accuracy')
        plt.xticks(rotation=45)
        plt.ylim(0, 1)
        
        # Add value labels on bars
        for bar, acc in zip(bars, test_accuracies):
            plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01, 
                    f'{acc:.3f}', ha='center', va='bottom')
        
        # 2. Confusion Matrix for best model
        plt.subplot(1, 2, 2)
        best_model_name = model_names[np.argmax(test_accuracies)]
        if best_model_name == 'Hybrid Ensemble':
            best_pred = self.ensemble_model.predict(self.X_test)
        else:
            best_pred = self.models[best_model_name].predict(self.X_test)
        
        cm = confusion_matrix(self.y_test, best_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title(f'Confusion Matrix - {best_model_name}')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        
        plt.tight_layout()
        plt.savefig('ml_analysis_results.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        return 'ml_analysis_results.png'
    
    def get_feature_importance(self):
        """Get feature importance from tree-based models"""
        importance_data = {}
        
        # Random Forest feature importance
        if 'Random Forest' in self.models:
            rf_importance = self.models['Random Forest'].feature_importances_
            importance_data['Random Forest'] = dict(zip(self.feature_names, rf_importance))
        
        # Gradient Boosting feature importance
        if 'Gradient Boosting' in self.models:
            gb_importance = self.models['Gradient Boosting'].feature_importances_
            importance_data['Gradient Boosting'] = dict(zip(self.feature_names, gb_importance))
        
        return importance_data
    
    def generate_report(self):
        """Generate comprehensive analysis report"""
        report = {
            'dataset_info': {
                'shape': self.data.shape,
                'features': self.feature_names,
                'target': self.target_name,
                'classes': len(np.unique(self.y_test))
            },
            'model_performance': {},
            'feature_importance': self.get_feature_importance(),
            'ensemble_performance': None
        }
        
        # Individual model performance
        for name, model in self.models.items():
            pred = model.predict(self.X_test)
            accuracy = accuracy_score(self.y_test, pred)
            report['model_performance'][name] = {
                'accuracy': float(accuracy),
                'classification_report': classification_report(self.y_test, pred, output_dict=True)
            }
        
        # Ensemble performance
        if self.ensemble_model:
            ensemble_pred = self.ensemble_model.predict(self.X_test)
            ensemble_accuracy = accuracy_score(self.y_test, ensemble_pred)
            report['ensemble_performance'] = {
                'accuracy': float(ensemble_accuracy),
                'classification_report': classification_report(self.y_test, ensemble_pred, output_dict=True)
            }
        
        return report

def main():
    if len(sys.argv) < 3:
        print("Usage: python hybrid_ml_engine.py <csv_file_path> <target_column>")
        return
    
    file_path = sys.argv[1]
    target_column = sys.argv[2]
    
    # Initialize ML engine
    ml_engine = HybridMLEngine()
    
    # Load and prepare data
    if not ml_engine.load_dataset(file_path):
        return
    
    if not ml_engine.prepare_data(target_column):
        return
    
    # Train individual models
    print("\n=== Training Individual Models ===")
    individual_results = ml_engine.train_individual_models()
    
    # Create hybrid ensemble
    print("\n=== Creating Hybrid Ensemble ===")
    ensemble_accuracy = ml_engine.create_hybrid_ensemble()
    
    # Generate visualizations
    print("\n=== Generating Visualizations ===")
    viz_file = ml_engine.generate_visualizations()
    
    # Generate comprehensive report
    print("\n=== Generating Report ===")
    report = ml_engine.generate_report()
    
    # Save report to JSON
    with open('ml_analysis_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nAnalysis complete!")
    print(f"Report saved to: ml_analysis_report.json")
    print(f"Visualizations saved to: {viz_file}")
    
    # Print summary
    print(f"\n=== SUMMARY ===")
    print(f"Best Individual Model: {max(individual_results.keys(), key=lambda k: individual_results[k]['test_accuracy'])}")
    print(f"Hybrid Ensemble Accuracy: {ensemble_accuracy:.4f}")

if __name__ == "__main__":
    main()
