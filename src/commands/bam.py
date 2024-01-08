import sys
from PIL import Image

pfp_filename = sys.argv[1]

smack = Image.open("smack.gif")

pfp = Image.open(pfp_filename)

num_frames = smack.n_frames

positions = [
    {"x": 212, "y": 239},  # Frame 1
    {"x": 213, "y": 242},
    {"x": 200, "y": 228},
    {"x": 200, "y": 228},
    {"x": 289, "y": 239},
    {"x": 319, "y": 261},
    {"x": 320, "y": 257},
    {"x": 321, "y": 243},
    {"x": 321, "y": 234},
    {"x": 355, "y": 224},
    {"x": 369, "y": 226},
    {"x": 279, "y": 261},
    {"x": 244, "y": 275},
    {"x": 226, "y": 245},  # Frame 14
]

modified_frames = []

for i in range(num_frames):
    smack.seek(i)

    modified_frame = smack.copy()

    position = positions[i]

    x = position["x"] - 48 
    y = position["y"] - 48 

    resized_pfp = pfp.resize((96, 96))

    modified_frame.paste(resized_pfp, (x, y))

    modified_frames.append(modified_frame)

modified_frames[0].save("bammed.gif", save_all=True, append_images=modified_frames[1:], optimize=False, duration=smack.info["duration"], loop=0)

print("bammed.gif")