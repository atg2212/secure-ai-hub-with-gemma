# Secure AI Hub - Chat Interface for Gemma

Welcome to the **Secure AI Hub** project! As a developer starting with this codebase, you are stepping into a production-like environment where security and efficiency are prioritized. 

This repository contains the frontend files for a premium chat interface designed to interact with a **Gemma 31B** model deployed on a remote Google Cloud VM.

---

## Architecture Overview

Before diving into the code, it's important to understand how this application is structured:

1.  **The Model (Backend)**: A Gemma 31B parameter model is running on a secure Google Cloud Compute Engine VM in the `me-west1` region. It listens for API calls on port `11434`. For security, this VM **does not have a public IP address** and is only accessible internally within the VPC.
2.  **The UI (Frontend)**: The files in this folder (`index.html`, `style.css`, `script.js`) form the user interface. They are served locally on your machine (or workspace) and need to securely reach the remote model.

Because the VM is private, we use **IAP (Identity-Aware Proxy) Tunneling** to bridge the connection.

---

## Getting Started: Step-by-Step Guide

Follow these steps to get the application running and connected:

### Step 1: Establish Secure Connection to the Model
You need to create a secure tunnel from your local machine to the remote VM's port `11434`. 

Run this command in your terminal (ensure you are authenticated with `gcloud`):
```bash
gcloud compute start-iap-tunnel gemma-vm 11434 \
    --project=secure-ai-hub-dem \
    --zone=me-west1-a \
    --local-host-port=localhost:11435
```
*Note: We use local port `11435` to avoid conflicts if you have a local service running on port 11434.*

### Step 2: Serve the Frontend Files
To view the UI in a browser, you need to serve these files. You can use a simple Python server:

```bash
cd /path/to/this/directory
python3 -m http.server 8082
```

### Step 3: Open the Browser
Now, open your web browser and navigate to:
`http://localhost:8082`

You should see the chat interface!

---

## Testing & Evaluation with Colab

We have also prepared instructions and scripts for testing the model's performance and evaluating responses using **DeepEval** and **Gemini** as the judge.

Check the `deployment_guide.md` file in this repository for the detailed guide on how we handled:
- Quantization to fit the 31B model on a 40GB GPU.
- Specific region deployment constraints in `me-west1`.
- Step-by-step commands for testing.

---

## Best Practices Taught in This Project
- **Least Privilege**: VM has no external IP.
- **Quantization**: Making large models practical on limited hardware.
- **Secure Access**: Using IAP instead of opening firewall ports to the internet.

Happy Coding!
