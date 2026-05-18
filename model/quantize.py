from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig
from optimum.onnxruntime import ORTQuantizer

model_name = "cl-nagoya/ruri-v3-310m"
revision = "18b60fb8c2b9df296fb4212bb7d23ef94e579cd3"
save_dir = "quantized/ruri-v3-310m"

model = ORTModelForFeatureExtraction.from_pretrained(model_name, revision=revision, export=True)
tokenizer = AutoTokenizer.from_pretrained(model_name, revision=revision)

model.save_pretrained(save_dir)
tokenizer.save_pretrained(save_dir)

quantizer = ORTQuantizer.from_pretrained(save_dir)
# NOTE: CPU needs to support AVX512 VNNI
qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)

quantizer.quantize(
    save_dir=save_dir,
    quantization_config=qconfig,
)
