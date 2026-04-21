# Guide: Deploying Gemma 31B on Limited Memory with Secure Access

This guide provides a step-by-step walkthrough on how to deploy a large language model like **Gemma 31B** in a restricted environment (like the `me-west1` region) on a GPU with limited memory (40 GB), utilizing quantization for efficiency and securing access via IAP.

---

## Table of Contents
1. [Finding the Right Model & VM](#finding-the-right-model--vm)
2. [Model Selection & Quantization](#model-selection--quantization)
3. [Infrastructure Setup in Specific Region](#infrastructure-setup-in-specific-region)
4. [Deploying and Serving the Model](#deploying-and-serving-the-model)
5. [Securing Model Access](#securing-model-access)
6. [Deploying User Interfaces](#deploying-user-interfaces)
7. [Testing and Verification](#testing-and-verification)

---

## 1. Finding the Right Model & VM

When starting an LLM project, choosing the right model and hardware is the first critical step.

### How to Find the Right Model
- **Task Complexity**: For simple tasks (text classification, short summaries), smaller models (2B - 7B) are often sufficient. For complex tasks (reasoning, coding, multi-turn chat), larger models (30B+) are recommended.
- **Resource Constraints**: The size of the model determines the memory needed. A general rule of thumb is that each parameter requires about 2 bytes in 16-bit precision. So a 7B model needs ~14GB, and a 31B model needs ~62GB.
- **Quantization**: You can use quantization (reducing precision to 8-bit or 4-bit) to fit larger models on smaller GPUs.

### How to Find the Right VM (GPU Sizing)
- **VRAM is Key**: Ensure the GPU has enough Video RAM (VRAM) to hold the model *plus* working memory for context.
- **Common GPUs in GCP**:
    - **NVIDIA L4**: 24GB VRAM (Good for models up to 13B or quantized 30B).
    - **NVIDIA A100 (40GB)**: 40GB VRAM (Good for quantized 30B-70B models).
    - **NVIDIA A100 (80GB)**: 80GB VRAM (Best for large models or high throughput).

---

## 2. Model Selection & Quantization

To fit a **31 Billion parameter** model like Gemma on a **40 GB GPU** (e.g., NVIDIA A100 40GB), you must use **quantization**. 

### The Math:
- A 31B model in full 16-bit precision requires about **62 GB** of VRAM just to load.
- By quantizing the model to **8-bit** (`q8_0`), the memory footprint is reduced by half to roughly **31 GB**.
- This fits comfortably within a 40 GB GPU, leaving room for context and batch processing.

**Recommendation**: Use the model `gemma4:31b-it-q8_0` with Ollama for this setup.

---

## 2. Infrastructure Setup in Specific Region

When deploying in a region with specific constraints (like `me-west1`), follow these steps:

### Step 2.1: VM Creation
- Create a Compute Engine VM in the desired zone (e.g., `me-west1-a`).
- Select a machine type with the required GPU (e.g., `a2-highgpu-1g` for A100).
- **Crucial**: Ensure **Secure Boot** is enabled if required by project policy.
- Do **not** assign an external IP address to keep the VM private.

### Step 2.2: Network Configuration
- Place the VM in a dedicated VPC network (e.g., `secure-ai-hub-net`).
- Enable **Private Google Access** on the subnetwork. This is mandatory for VMs without external IPs to download packages and reach Google services like Colab Enterprise.

---

## 4. Deploying and Serving the Model

Once the infrastructure is ready, you need to install the model server and load the model. We use **Ollama** for this project.

### Step 4.1: Install Ollama
Connect to the VM via SSH and run the installation script:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 4.2: Pull and Run the Model
Pull the specific quantized model we selected:
```bash
ollama run gemma4:31b-it-q8_0
```
*Note: The first run will download the model, which might take time depending on connection speed.*

---

## 5. Securing Model Access

To restrict calls to the model to resources running strictly in the `me-west1` region:

### Step 3.1: Firewall Rules
1. Create a firewall rule to allow access to the model port (`11434`) only from the internal subnet range (e.g., `10.0.0.0/24` for `me-west1`).
2. Block or remove any rules allowing broader access (like open IAP rules if not needed for testing).

**Example Command:**
```bash
gcloud compute firewall-rules create allow-ollama-me-west1 \
    --network=secure-ai-hub-net \
    --direction=INGRESS \
    --priority=1000 \
    --action=ALLOW \
    --rules=tcp:11434 \
    --source-ranges=10.0.0.0/24
```

---

## 6. Deploying User Interfaces

You can deploy both ready-made and custom UIs on the same VM.

### Option A: Open WebUI (Docker)
1. Install Docker on the VM.
2. Run the Open WebUI container mapped to port `8080`, pointing it to the local Ollama service.

**Example Command:**
```bash
sudo docker run -d -p 8080:8080 \
  -e OLLAMA_BASE_URL=http://10.0.0.2:11434 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main
```

### Option B: Custom Chat UI (Python Server)
1. Copy your custom HTML/JS files to the VM.
2. Update the API URL in your JavaScript to point to `localhost:11434`.
3. Serve the files using a simple Python HTTP server on a non-conflicting port (e.g., `8083`).

**Example Command:**
```bash
cd ~/secure_ai_hub && python3 -m http.server 8083
```

---

## 7. Testing and Verification

Since the VM has no external IP, you must use **IAP (Identity-Aware Proxy) Tunneling** to access the UIs and API from your local computer.

### Step 5.1: Start the Tunnel
Run this command on your local computer to bridge to the UI port on the VM:
```bash
gcloud compute start-iap-tunnel gemma-vm 8083 \
    --project=secure-ai-hub-dem \
    --zone=me-west1-a \
    --local-host-port=localhost:8083
```

### Step 5.2: Access the UI
Open your browser and go to `http://localhost:8083`.

### Step 5.3: API Verification (curl)
To test the model directly from a terminal (either on the VM or locally via tunnel):
```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "gemma4:31b-it-q8_0",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

---
*Guide created on April 21, 2026.*
