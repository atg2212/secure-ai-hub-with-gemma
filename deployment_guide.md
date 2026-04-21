# Guide: Deploying Gemma 31B on Limited Memory with Secure Access

This guide provides a step-by-step walkthrough on how to deploy a large language model like **Gemma 31B** in a restricted environment (like the `me-west1` region) on a GPU with limited memory (40 GB), utilizing quantization for efficiency and securing access via IAP.

---

## Table of Contents
1. [Model Selection & Quantization](#model-selection--quantization)
2. [Infrastructure Setup in Specific Region](#infrastructure-setup-in-specific-region)
3. [Securing Model Access](#securing-model-access)
4. [Deploying User Interfaces](#deploying-user-interfaces)
5. [Testing and Verification](#testing-and-verification)

---

## 1. Model Selection & Quantization

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

## 3. Securing Model Access

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

## 4. Deploying User Interfaces

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

## 5. Testing and Verification

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
