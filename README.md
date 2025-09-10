# 📝 PDF Translator – Serverless on AWS
Translate PDF files from one language to another using a fully serverless architecture on AWS. Simply upload a PDF, choose the language (which lanuage to which) and let the system handle the rest—from text extraction to translation and output delivery.


## 🚀 Live Demo
Frontend: [PDF Translator Web](https://d1d3fusiyjat60.cloudfront.net/)


# ⚙️ How It Works (Architecture Overview)
This project follows a modular, event-driven architecture using AWS services to ensure scalability and fault tolerance:


### 📤 PDF Upload (Front End)
- The frontend requests a **pre-signed S3 URL** via **API Gateway + Lambda**
- The user uploads the PDF directly to **Amazon S3**

### ⚡ Trigger on Upload
- An **S3 event** triggers a **Lambda function** when a new PDF is uploaded

### 📝 Text Extraction
- The Lambda function extracts text from the PDF
- Extracted text is stored in **DynamoDB**

### 📬 Queue for Translation
- A message is sent to an **Amazon SQS** queue to begin translation

### 🌍 Translation Process
- Another **Lambda function** processes the SQS message
- Translates the text to **Italian**
- Stores the translated result in **S3**

### 🔄 Job Status
- A separate **API Gateway + Lambda** endpoint allows users to:
  - Check the translation status
  - Retrieve the final result when ready

🔒 Note: The static frontend is served over HTTPS using Amazon CloudFront to provide a secure and globally-distributed interface.


## 🧱 AWS Services Used

### 🔹 CloudFront
- Delivers the static frontend over **HTTPS**
- Provides a secure, globally distributed access layer

### 🔹 API Gateway
- Provides RESTful endpoints to:
  - Generate secure upload URLs
  - Check job/translation status
 
### 🔹 Amazon S3
- Stores uploaded PDFs  
- Stores translated outputs  
- Hosts static frontend (via **CloudFront**)

### 🔹 AWS Lambda
- Generates pre-signed S3 upload URLs  
- Extracts text from uploaded PDFs  
- Translates extracted text into **Italian**  
- Tracks job status and responds to status checks

### 🔹 Amazon SQS
- Manages asynchronous translation workflow via message queue

### 🔹 DynamoDB
- Stores job metadata and translation status



## 👥 Team Members
- Sevval Yildiz  
- Oguzhan Turan  
- Saurav Anand  
- Shubham Subhankar Sharma

