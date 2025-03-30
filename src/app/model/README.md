run:

cd ~/Github/DataQuest25/yolov5

python3 train.py \
    --img 640 \
    --batch 16 \
    --epochs 100 \
    --data ../data.yaml \
    --weights yolov5s.pt \
    --name food_detection \
    --project ../runs/train