"""Create the optional stage 01 vs 02 visual sheet, using Pillow, no image edits."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ASSET = ROOT / "models/xe215c"
VIEWS = ("left", "right", "front", "rear", "top", "three_quarter_front", "three_quarter_rear")
sheet = Image.new("RGB", (1400, len(VIEWS)*480+40), "#eeeeee")
draw = ImageDraw.Draw(sheet)
draw.text((14,12), "STAGE 01 - immutable checkpoint", fill="black")
draw.text((714,12), "STAGE 02 - proportion correction / same cameras", fill="black")
for row,view in enumerate(VIEWS):
    for column,stage in enumerate(("stage_01","stage_02")):
        with Image.open(ASSET/stage/"checkpoints"/(view+".png")) as source:
            assert source.size == (1400,900)
            sheet.paste(source.resize((700,450),Image.Resampling.LANCZOS), (column*700,row*480+40))
        draw.text((column*700+14,row*480+494),view,fill="black")
sheet.save(ASSET/"stage_02"/"comparison_stage_01_vs_02.png")
