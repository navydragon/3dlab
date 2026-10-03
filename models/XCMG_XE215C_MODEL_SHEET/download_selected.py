#!/usr/bin/env python3
from pathlib import Path
import time
try:
    import requests
except ImportError:
    raise SystemExit("Install requests first: pip install requests")

OUT=Path(__file__).with_name("downloaded")
OUT.mkdir(exist_ok=True)
items=[('00_MASTER_dimensions.pdf', 'https://uploads-ssl.webflow.com/62d62f9870c0a933e38ed35a/631ee2467d75e8e4a8e900f4_XE215C.pdf'), ('01_side_near_ortho.jpg', 'https://image.made-in-china.com/2f0j00YMwohfTKEOgs/XCMG-Official-Xe215c-Earth-Moving-20-Ton-Used-Hydraulic-Crawler-Excavator-for-Sale.jpg'), ('02_side_clean.jpg', 'https://www.machmall.com/images/store/357636/item/XE215C%20%28%20%283%29.jpg_l.jpg'), ('03_front_view.jpg', 'https://www.mining-dumptruck.com/photo/pc23731135-xcmg_xe215c_21_5_ton_rc_hydraulic_crawler_excavator_machine_maximum_digging_depth_6655mm.jpg'), ('04_rear_3q.jpg', 'https://www.maxizm.com/uploadfile/image/20240620/20240620022217_70926.jpg'), ('05_side_folded_boom.jpg', 'https://www.maxizm.com/uploadfile/image/20240620/20240620022159_11045.jpg'), ('06_boom_stick_bucket_close.jpg', 'https://www.maxizm.com/uploadfile/image/20240620/20240620022209_80311.jpg'), ('07_undercarriage_front.jpg', 'https://www.truck1.id/img/ful/19912/Suku-cadang-Consumable-Spare-Parts-List-of-XCMG-XE215C-Excavator-Cina_19912_6658025009828.jpg'), ('08_undercarriage_side.jpg', 'https://www.truck1.id/img/xxl/19912/Suku-cadang-Consumable-Spare-Parts-List-of-XCMG-XE215C-Excavator-Cina_19912_49464396006.jpg'), ('09_final_drive_track.jpg', 'https://www.truck1.id/img/xxl/19912/Suku-cadang-Consumable-Spare-Parts-List-of-XCMG-XE215C-Excavator-Cina_19912_9273991753152.jpg'), ('10_work_pose_3q.jpg', 'https://cdn.prod.website-files.com/62d62f9870c0a933e38ed35a/643e0bc2d792072f8d411202_DSC05014.jpg')]
headers={"User-Agent":"Mozilla/5.0 (reference-downloader; personal 3D study)"}
for name,url in items:
    dest=OUT/name
    if dest.exists() and dest.stat().st_size>1024:
        print("skip",name); continue
    try:
        r=requests.get(url,headers=headers,timeout=45,allow_redirects=True)
        r.raise_for_status()
        dest.write_bytes(r.content)
        print("ok",name,len(r.content))
    except Exception as e:
        print("FAIL",name,e)
    time.sleep(0.5)
