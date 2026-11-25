import torch
import torch.nn as nn
import torch.nn.functional as F

class NCA(nn.Module):
    def __init__(self, channel_n=16, hidden_size=128):
        super(NCA, self).__init__()
        self.channel_n = channel_n

        # 1. Perception Filters (Sobel spatial gradients)
        # These calculate the difference between neighboring pixels to detect edges.
        sobel_x = torch.tensor([[-1.0, 0.0, 1.0],
                                [-2.0, 0.0, 2.0],
                                [-1.0, 0.0, 1.0]]) / 8.0
                                
        sobel_y = torch.tensor([[ 1.0,  2.0,  1.0],
                                [ 0.0,  0.0,  0.0],
                                [-1.0, -2.0, -1.0]]) / 8.0
                                
        ident = torch.tensor([[0.0, 0.0, 0.0],
                              [0.0, 1.0, 0.0],
                              [0.0, 0.0, 0.0]])

        
        filters = torch.stack([ident, sobel_x, sobel_y]).unsqueeze(1)
        filters = filters.repeat(channel_n, 1, 1, 1)   

        # Register as a buffer so it resides on the GPU but is excluded from autograd
        self.register_buffer('perception_filters', filters)

        # 2. The Micro-Brain (1x1 Convolutions)
        # Processes the 48 perceived channels (16 ident + 16 x-grad + 16 y-grad)
        self.dmodel = nn.Sequential(
            nn.Conv2d(channel_n * 3, hidden_size, kernel_size=1),
            nn.ReLU(),
            nn.Conv2d(hidden_size, channel_n, kernel_size=1, bias=False)
        )

        # Initialize final weights to zero to ensure stability at step 0
        with torch.no_grad():
            self.dmodel[2].weight.zero_()

    def perceive(self, x):
        # Applies the 3x3 filters independently to each channel (groups=self.channel_n)
        return F.conv2d(x, self.perception_filters, padding=1, groups=self.channel_n)

    def forward(self, x, fire_rate=0.5):
        # A. Perception
        y = self.perceive(x)

        # B. Cell State Update Rule
        dx = self.dmodel(y)

        # C. Stochastic Update (Asynchronous growth)
        # Only ~50% of pixels update per frame to force resilient behavior
        rand_mask = torch.rand(x.shape[0], 1, x.shape[2], x.shape[3], device=x.device)
        update_mask = (rand_mask <= fire_rate).float()
        x = x + dx * update_mask

        # D. Alive Masking
        # A cell dies (values zeroed) if there is no living cell in its 3x3 radius
        alive_mask = (F.max_pool2d(x[:, 3:4, :, :], kernel_size=3, stride=1, padding=1) > 0.1).float()
        x = x * alive_mask

        return x
