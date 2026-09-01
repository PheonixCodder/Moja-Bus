# Subphase 3B: Speedometer EMA Smoothing & Overspeed Haptics

## 1. Problem Statement & Findings Addressed

* **Findings Addressed**: `DRV-P2-08 (Speedometer Gauge Needle Jitter)` & `DRV-P2-16 (Missing Overspeed Haptics)`.
* **Current Defect**: Raw GPS speed fixes cause the visual speedometer needle to bounce rapidly. No heavy tactile alert fires when exceeding the 110 km/h highway speed limit.

---

## 2. Architecture & Scope of Changes

1. Implement Exponential Moving Average (EMA) smoothing in `apps/driver-app/features/live/components/speedometer-gauge.tsx`:
   $$v_{\text{smooth}} = 0.35 \cdot v_{\text{raw}} + 0.65 \cdot v_{\text{smooth\_prev}}$$
2. Trigger `DriverFeedback.overspeedAlert()` when `v_smooth` transitions from $\le 110\text{ km/h}$ to $> 110\text{ km/h}$.

---

## 3. Implementation Steps & File Checklist

- [ ] Add smoothing state hook inside `SpeedometerGauge.tsx`.
- [ ] Integrate threshold crossing haptic feedback using `DriverFeedback.overspeedAlert()`.
- [ ] Ensure instantaneous speed drops to 0 immediately when vehicle is stationary for $>10$s.

---

## 4. Verification & Testing Criteria

* [ ] Feed fluctuating GPS speed fixes ($85 \rightarrow 95 \rightarrow 88$ km/h). Verify smooth needle transition.
* [ ] Accelerate past 110 km/h. Verify heavy tactile haptic pulse fires once on threshold crossing.
