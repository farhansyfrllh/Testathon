"""Inspect rec.onnx output shape to find correct vocabulary size."""
import onnxruntime as ort
import os

model_dir = os.path.abspath(os.path.join("input_model", "model", "weights"))

# Inspect rec.onnx
rec_path = os.path.join(model_dir, "rec.onnx")
sess = ort.InferenceSession(rec_path)

print("=== rec.onnx ===")
print("Inputs:")
for inp in sess.get_inputs():
    print(f"  name={inp.name}  shape={inp.shape}  dtype={inp.type}")
print("Outputs:")
for out in sess.get_outputs():
    print(f"  name={out.name}  shape={out.shape}  dtype={out.type}")
    if len(out.shape) == 3:
        print(f"\n  ⚠️  Vocabulary size needed = output shape[-1] - 1 = {out.shape[-1]} - 1 = {out.shape[-1]-1}")

# Inspect det_default.onnx
det_path = os.path.join(model_dir, "det_default.onnx")
sess2 = ort.InferenceSession(det_path)
print("\n=== det_default.onnx ===")
for inp in sess2.get_inputs():
    print(f"  name={inp.name}  shape={inp.shape}")
for out in sess2.get_outputs():
    print(f"  output: {out.name}  shape={out.shape}")

# Inspect cls.onnx
cls_path = os.path.join(model_dir, "cls.onnx")
sess3 = ort.InferenceSession(cls_path)
print("\n=== cls.onnx ===")
for inp in sess3.get_inputs():
    print(f"  name={inp.name}  shape={inp.shape}")
for out in sess3.get_outputs():
    print(f"  output: {out.name}  shape={out.shape}")
