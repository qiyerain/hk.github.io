---
title: StableDeffution
date: 2024/08/01 20:46:25
article_id: cf26a918-91fb-5883-82c7-f280abf9dc61
categories:
- Java
tags:
- Java
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-21.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-21.webp

---

# StableDeiffusion

**Model**:Chilloutmix-Ni.safetensors（7.7G）

**Lora**:ulzzang、Taiwan Doll Likeness、Korean Doll Likeness

**VAE**:

![image-20230326215850970](images/StableDeiffusion.assets/image-20230326215850970.png)

**contollnet**:动漫人物转真实模型

tool:

- c站：https://civitai.com/
- colab: https://colab.research.google.com/
- prompt：https://aitag.top/

效果1：使用loral

Prompt ：(8k, best quality, masterpiece:1.2), (realistic, photo-realistic:1.37), ultra-detailed, 1 girl,cute, solo,beautiful detailed sky,detailed cafe,night,sitting,dating,(nose blush),(smile:1.15),(closed mouth) small breasts,beautiful detailed eyes,(collared shirt:1.1), night, wet,business attire, rain,white lace, (short hair:1.2),floating hair NovaFrogStyle

Negative Prompt ：paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, (outdoor:1.6), manboobs, backlight,(ugly:1.331), (duplicate:1.331), (morbid:1.21), (mutilated:1.21), (tranny:1.331), mutated hands, (poorly drawn hands:1.331), blurry, (bad anatomy:1.21), (bad proportions:1.331), extra limbs, (disfigured:1.331), (more than 2 nipples:1.331), (missing arms:1.331), (extra legs:1.331), (fused fingers:1.61051), (too many fingers:1.61051), (unclear eyes:1.331), bad hands, missing fingers, extra digit, (futa:1.1), bad body, NG_DeepNegative_V1_75T,pubic hair, glans

![image-20230326220228340](images/StableDeiffusion.assets/image-20230326220228340.png)

![image-20230326220203015](images/StableDeiffusion.assets/image-20230326220203015.png)

![image-20230326220247821](images/StableDeiffusion.assets/image-20230326220247821.png)

参考：https://www.youtube.com/watch?v=HaXb3R2VHP8&list=PLA8oR-9gke1--n2RNoWzhwDSgggvxjjOL&index=3

效果2：使用chillouMix-ni

prompt： RAW photo, delicate, best quality, (intricate details:1.3), hyper detail, finely detailed, colorful, 1girl, solo, 8k uhd, film grain, (studio lighting:1.2), (Fujifilm XT3), (photorealistic:1.3), (detailed skin:1.2),1 girl,cute, solo,beautiful detailed sky,detailed cafe,dating,(nose blush),(smile:1.15),(closed mouth), middle breasts,beautiful detailed eyes, daylight, wet, rain, (short hair:1.2),floating hair NovaFrogStyle, full body,turtleneck,ribbed sweater,see-through,wet clothes

ulzzang-6500-v1.1.bin 我有改名成 ulzzang.bin ，如果想啟動那個韓國女孩臉型 ulzzang-6500-v1.1.bin 訓練檔的效果，prompt 要加上(ulzzang:1.2)

negative Prompt  ：paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, (outdoor:1.6), manboobs, backlight,(ugly:1.331), (duplicate:1.331), (morbid:1.21), (mutilated:1.21), (tranny:1.331), mutated hands, (poorly drawn hands:1.331), blurry, (bad anatomy:1.21), (bad proportions:1.331), extra limbs, (disfigured:1.331), (more than 2 nipples:1.331), (missing arms:1.331), (extra legs:1.331), (fused fingers:1.61051), (too many fingers:1.61051), (unclear eyes:1.331), bad hands, missing fingers, extra digit, (futa:1.1), bad body, NG_DeepNegative_V1_75T,pubic hair, glans

![image-20230326221635810](images/StableDeiffusion.assets/image-20230326221635810.png)

参考：https://www.youtube.com/watch?v=bOsFgX5XMwU&list=PLA8oR-9gke1--n2RNoWzhwDSgggvxjjOL&index=2

效果3：幫超擬真cosplay正妹換衣服及換背景

![image-20230326223306312](images/StableDeiffusion.assets/image-20230326223306312.png)

参考：https://www.youtube.com/watch?v=qodoWBn58-s
