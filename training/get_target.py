import urllib.request
from PIL import Image
import io
import os

def setup_target_image():
    # Ensure the target directory exists
    os.makedirs("target", exist_ok=True)
    
    # Official GitHub Mark URL
    url = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
    print("Fetching Octocat from GitHub assets...")
    
    # Download the image
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        img_data = response.read()

    # Open image, enforce RGBA (channels 0-3 for the tensor), and resize to 64x64
    img = Image.open(io.BytesIO(img_data)).convert("RGBA")
    img_resized = img.resize((64, 64), Image.Resampling.LANCZOS)
    
    # Save the prepared image
    save_path = "target/octocat_64x64.png"
    img_resized.save(save_path)
    print(f"Success! Saved to {save_path}")

if __name__ == "__main__":
    setup_target_image()
