# NeuroSense Assessment Guide

## Overview

**NeuroSense** is an AI-powered Alzheimer's disease risk assessment platform that combines cognitive testing with medical imaging analysis to provide comprehensive cognitive and neurological evaluation. The assessment integrates both tabular demographic data and MRI brain imaging to generate a risk probability score and personalized recommendations.

---

## Assessment Components

The NeuroSense assessment consists of two primary analytical pathways:

### 1. **Cognitive Assessment**
- **Input**: Demographic and cognitive test data
  - Age
  - Gender (encoded as integer)
  - Education level
  - Socioeconomic status (SES)
  - Cognitive test score (0-30 MMSE scale)

- **Processing**: Data is preprocessed and fed into a trained machine learning model
- **Output**: Cognitive probability score (0.0 - 1.0) indicating risk of cognitive impairment

### 2. **MRI Brain Imaging Analysis**
- **Input**: MRI brain scan image
- **Processing**: 
  - Image resizing to 128x128 pixels
  - Grayscale conversion
  - Histogram of Oriented Gradients (HOG) feature extraction
  - Feature scaling using pre-trained scaler
  - Classification using trained neural network model

- **Output**: 
  - Predicted diagnostic class (one of four categories)
  - Confidence probability score (0.0 - 1.0)

---

## Diagnostic Classes

The MRI analysis classifies brain imaging into four severity categories:

| Class | Description | Characteristics |
|-------|-------------|-----------------|
| **NonDemented** | No cognitive decline | Typical, healthy brain structures for age; no anomalies indicative of dementia |
| **VeryMildDemented** | Early signs of impairment | Very mild structural changes; could be normal aging or earliest signs of decline |
| **MildDemented** | Moderate cognitive decline | Noticeable structural alterations; correlates with memory difficulties and functional changes |
| **ModerateDemented** | Advanced impairment | Significant structural abnormalities; heavily impacts cognitive and functional abilities |

---

## Scoring Methodology

### Combined Risk Score Calculation

The final **Alzheimer's risk probability** is calculated using a weighted combination of cognitive and MRI assessments:

```
Final Risk Score = (0.4 × Cognitive Probability) + (0.6 × Normalized MRI Risk)
```

**Weight Distribution:**
- **40%** - Cognitive assessment
- **60%** - MRI brain imaging analysis

**MRI Risk Normalization:**
- `NonDemented` class: Risk = 1.0 - Confidence probability (high confidence → low risk)
- Other classes: Risk = Confidence probability (high model confidence → high risk)

### Risk Probability Bounding

The final score is clipped to the range [0.05, 0.95] to maintain reasonable clinical thresholds and avoid extreme values.

---

## Risk Categories

Based on the final risk score, patients are classified into three clinical categories:

| Risk Category | Score Range | Clinical Implication |
|---------------|-------------|----------------------|
| **Low Risk** | < 0.30 | Minimal indicators of cognitive decline |
| **Medium Risk** | 0.30 - 0.70 | Moderate indicators requiring further evaluation |
| **High Risk** | > 0.70 | Significant indicators; recommendation for professional evaluation |

---

## MMSE Score Mapping

**MMSE (Mini-Cog Screening Examination)** is a standardized cognitive screening tool with a maximum score of 30 points.

### Score Interpretation:
- **27-30**: Normal cognition
- **24-26**: Mild cognitive impairment
- **18-23**: Moderate cognitive impairment
- **0-17**: Severe cognitive impairment

The assessment displays the estimated MMSE score alongside the AI probability to provide clinicians with a standardized reference point for cognitive status.

---

## Assessment Output Report

The full assessment generates a comprehensive PDF report including:

### Report Contents:
1. **Report Metadata**
   - Unique Report ID
   - Date and Time of Analysis
   - Diagnostic Class from MRI analysis

2. **Risk Assessment Summary**
   - AI Assessment Probability (final risk score)
   - Risk Category (Low/Medium/High)
   - Confidence level (High/Medium/Low)

3. **Diagnostic Interpretation**
   - Class-specific interpretation based on MRI findings
   - Explanation of detected brain changes

4. **Clinical Recommendations**
   - Risk-stratified recommendations
   - Suggested next steps for care
   - Lifestyle and preventive measures
   - Professional consultation guidelines

5. **Disclaimer**
   - Clear statement: NeuroSense is a preliminary screening tool
   - Medical professional consultation required for definitive diagnosis

---

## Clinical Recommendations by Risk Category

### NonDemented Classification
**Recommendations:**
- Continue healthy lifestyle (exercise, balanced diet, cognitive activities)
- Annual health check-ups
- Monitor for any changes in memory or daily functioning
- Maintain social engagement
- Manage daily stress effectively

### VeryMildDemented Classification
**Recommendations:**
- Comprehensive cognitive assessment with healthcare professional
- Mediterranean diet and aerobic exercise regimen
- Mentally stimulating activities and cognitive training
- Establish clinical baseline for future comparisons

### MildDemented Classification
**Recommendations:**
- Consultation with neurologist or geriatric specialist
- Formal diagnosis and early intervention consideration
- Long-term care planning discussions
- Home safety evaluation and modifications
- Involve family in care routines and medication management

### ModerateDemented Classification
**Recommendations:**
- **Immediate** specialized medical team consultation
- Comprehensive care plan formulation
- Explore memory care services or professional caregiving
- Structured daily routine establishment
- Maximize home safety
- Access caregiver support groups
- Professional assistance with daily living activities

---

## Data Flow

```
User Input
├── Demographics (age, gender, education, SES)
├── Cognitive Test Score
└── MRI Brain Image
        ↓
    [Backend Processing]
    ├── Cognitive Model Analysis
    │   └── Output: Cognitive Probability
    └── MRI Image Analysis (HOG features)
        └── Output: Diagnostic Class + Confidence
            ↓
        [Risk Score Calculation]
        └── Output: Final Risk Probability
            ↓
        [Risk Classification]
        └── Output: Risk Category (Low/Medium/High)
            ↓
        [Report Generation]
        └── Output: PDF Report + JSON Response
```

---

## Key Metrics Displayed

The assessment dashboard prominently displays:

1. **AI Assessment Probability**: Final risk score as a percentage (0.05% - 95.0%)
2. **Estimated MMSE**: Cognitive score on the standardized 0-30 scale
3. **Analyzed Metrics**: Components used (Demo + Cognitive or Demo + Cognitive + MRI)
4. **Accuracy**: Confidence level of the assessment (Low/Medium/High)
5. **Visual Risk Indicator**: Color-coded risk category (Red=High, Yellow=Medium, Green=Low)

---

## Technical Specifications

- **Cognitive Model**: Trained on demographic and cognitive assessment data
- **MRI Model**: Neural network trained on brain MRI image classification
- **Feature Extraction**: HOG (Histogram of Oriented Gradients)
- **Image Processing**: OpenCV for image handling and preprocessing
- **Model Format**: Joblib serialized (.pkl) files for model persistence
- **Confidence Score Handling**: Probability from `predict_proba()` or normalized decision function scores

---

## Important Disclaimers

⚠️ **NeuroSense is a preliminary screening tool and NOT a definitive diagnostic instrument.**

- Results do not replace clinical evaluation by medical professionals
- Early screening and further professional assessment are recommended
- All results should be reviewed with a qualified healthcare provider
- Consult a neurologist or geriatrician for formal diagnosis and treatment planning
- This tool is designed to complement, not replace, professional medical judgment

---

## Report Example

A typical assessment output includes:

```
High Risk Assessment
├── AI Assessment Probability: 95.0%
├── Risk Category: High Risk
├── Estimated MMSE: 23/30
├── Analyzed Metrics: Demo + Cognitive
├── Accuracy: High
└── Recommendation: Consulting a healthcare professional for comprehensive evaluation
```

---

## Quick Reference: Adding Your Results

When using NeuroSense, you will provide:

1. **Basic Information**
   - Age, Gender, Education level, Socioeconomic status

2. **Cognitive Test Results**
   - Score from cognitive assessment (mapped to 0-30 MMSE scale)

3. **Medical Imaging**
   - High-quality MRI brain scan image (JPEG/PNG format)

The system processes this data through both the cognitive and imaging pipelines and generates a comprehensive assessment within seconds, ready for discussion with your healthcare provider.

---

## Support & Further Information

For more details about NeuroSense functionality and usage:
- Backend API Documentation: `/docs` endpoint when running the FastAPI server
- Frontend Interface: Interactive web application for data entry and result visualization
- Project Repository: See main README.md for setup and architecture details

