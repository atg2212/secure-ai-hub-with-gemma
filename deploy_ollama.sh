#!/bin/bash
# Script to deploy Ollama and Gemma model on the VM

echo "Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

echo "Pulling Gemma 31B model (quantized to 8-bit)..."
ollama pull gemma4:31b-it-q8_0

echo "Deployment complete. Ollama is running and model is loaded."
