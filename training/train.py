import torch
import torch.nn.functional as F
import torch.optim as optim
from PIL import Image
import numpy as np
import os
from nca_model import NCA

def load_target(path):
    # Load image, convert to numpy, scale to 0-1, reshape to (1, 4, 64, 64)
    img = Image.open(path)
    img_np = np.array(img).astype(np.float32) / 255.0
    img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0)
    return img_tensor

def get_seed(batch_size, channel_n, size=64):
    # Initialize an empty grid
    seed = torch.zeros(batch_size, channel_n, size, size)
    # Activate the absolute center pixel's alpha channel
    seed[:, 3, size//2, size//2] = 1.0
    return seed

def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")

    # Initialize model and target
    model = NCA().to(device)
    target = load_target("target/octocat_64x64.png").to(device)
    
    optimizer = optim.Adam(model.parameters(), lr=2e-3)
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=[2000, 4000], gamma=0.3)
    
    batch_size = 8
    seed = get_seed(batch_size, 16, 64).to(device)
    
    # Store previous states to train regeneration
    pool = seed.clone()

    epochs = 8000
    for i in range(epochs):
        # Sample a batch from the pool, but keep one fresh seed to ensure it still knows how to start
        batch_idx = torch.randint(0, pool.shape[0], (batch_size,))
        x = pool[batch_idx].clone()
        x[:1] = get_seed(1, 16, 64).to(device)

        # Damage Simulation: Randomly zero out a 16x16 chunk in half the batch
        if i > 1000:
            for b in range(batch_size // 2):
                cx = torch.randint(0, 64 - 16, (1,)).item()
                cy = torch.randint(0, 64 - 16, (1,)).item()
                x[b, :, cx:cx+16, cy:cy+16] = 0.0

        optimizer.zero_grad()

        # Execute the forward pass over a random number of time steps (64 to 96)
        steps = torch.randint(64, 96, (1,)).item()
        for _ in range(steps):
            x = model(x)

        # Calculate loss only on the visible RGBA channels (0-3)
        loss = F.mse_loss(x[:, :4, :, :], target.expand(batch_size, -1, -1, -1))
        
        loss.backward()
        
        # Gradient clipping to prevent exploding gradients in the recurrent loop
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()

        # Update the pool with the new states (detach from computation graph)
        pool[batch_idx] = x.detach()

        if i % 100 == 0:
            print(f"Epoch {i} | Loss: {loss.item():.6f}")

    # Save the native PyTorch weights
    torch.save(model.state_dict(), "nca_weights.pth")
    print("Training complete. Weights saved to nca_weights.pth")

if __name__ == "__main__":
    train()
