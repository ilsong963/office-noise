# 캐릭터 스프라이트 v2

내장 ImageGen 도구로 생성. 모든 시트는 4열 × 2행입니다. 책상 위의 마우스를 유지하면서 타이핑 손 아래의 마우스처럼 보이던 형태를 정리했습니다.

## 기본 시트

파일: `public/assets/office-male-sparse-v2.png`

```
Use case: precise-object-edit. Production 4 x 2 sprite atlas correction.
INPUT is an approved clean black-line office character animation sheet. Keep EXACT 4 columns x 2 rows, eight equal square cells, 2:1 overall aspect ratio. Keep the art style, composition, white fills and pure white background. Preserve all furniture, torso, chair, feet, monitor and individual pose positions precisely.
IMPORTANT CORRECTION TO MOUSE LOGIC:
ONE physical computer mouse must be visible in EVERY frame. It is a separate small computer mouse sitting on the desktop well to the RIGHT of the keyboard.
- Top row cells 0,1,2,3 and bottom row cells 6,7: add exactly ONE small unattended mouse on the open tabletop to the RIGHT of the keyboard. Leave a visibly clear white gap between the keyboard's right edge and this mouse, about one mouse width. The mouse stays in the same parked position across these six frames. Neither hand touches this parked mouse.
- Bottom row cells 4 and 5: preserve the existing right hand gripping the ONLY mouse in that cell. Do NOT add a second parked mouse in these two frames.
TYPING HAND ANATOMY: in cells 2 and 3 BOTH hands are visibly ON THE KEYBOARD. Their fingers point over visible individual rectangular keyboard keys. Eliminate any oval blob, mouse-like shape, curved extra object or closed capsule shape UNDER either palm. The palms rest directly over the rectangular keyboard, with clear key outlines near the fingertips. Exactly two hands attached to their forearms; no phantom hand, residual prior pose, doubled outlines or mouse beneath typing hands.
Frame 2 and frame 3 must have a subtle but readable difference in finger/wrist positions (alternating typing) while the desk, chair and rest of the scene remain perfectly registered. The hand in frame 1 is slightly raised over keyboard during transition. Mouse-use frames 4/5 have the right forearm extended laterally away from keyboard. Sigh frames 6/7 retain the small head/shoulder inhale/exhale difference.
No extra objects, no captions, no grid lines, no textures, no shadow, no change to character identity or drawing style. Three strands of hair. Return the complete aligned 8-frame 4x2 sprite sheet, preferably 2048x1024.
```

## female-bob

파일: `public/assets/office-female-bob-v2.png`

```
Use case: precise-object-edit. Edit the supplied finished animation sprite atlas. Change ONLY the head/hair of the character in every cell to a woman with a neat black chin-length bob haircut ending above the shoulders, with a clear rounded silhouette and visible neck. Maintain the exact eight poses and clean minimal black line-art style with plain white shirt. Keep the same 4-column by 2-row grid, eight equal SQUARE cells, exact 2:1 overall aspect ratio and original image dimensions. Do not move, resize or redraw the body, arms, desk, modern monitor, keyboard, chair, feet or other furniture. Match the exact registration and camera view in all frames. Keep individual raised/lowered head positions in sigh frames 6/7. Preserve the mouse logic exactly: ONE physical mouse in EVERY frame; parked separately on the tabletop well to the RIGHT of keyboard in cells 0,1,2,3,6,7, untouched with clear white gap; held under the extended right hand in cells 4/5. Never add a second mouse. In typing cells 2/3 BOTH hands are ON THE RECTANGULAR KEYBOARD over clearly visible keys. NO oval object, mouse-like blob or duplicated hand beneath the palms. No extra fingers, floating hands or ghost pose outlines. Preserve the visible pose difference between typing A/B and mouse right/left. Only hairstyle changes from reference. Opaque pure white background, white fills and black ink contours; no shadows, no color, no hatching, no texture, no labels, no text or cell borders. Return ONE complete sprite atlas.
```

## female-long

파일: `public/assets/office-female-long-v2.png`

```
Use case: precise-object-edit. Edit the supplied finished animation sprite atlas. Change ONLY the head/hair of the character in every cell to a woman with long straight black hair reaching halfway down her back, with a few sparse white strand lines; keep hair away from hands and keyboard. Maintain the exact eight poses and clean minimal black line-art style with plain white shirt. Keep the same 4-column by 2-row grid, eight equal SQUARE cells, exact 2:1 overall aspect ratio and original image dimensions. Do not move, resize or redraw the body, arms, desk, modern monitor, keyboard, chair, feet or other furniture. Match the exact registration and camera view in all frames. Keep individual raised/lowered head positions in sigh frames 6/7. Preserve the mouse logic exactly: ONE physical mouse in EVERY frame; parked separately on the tabletop well to the RIGHT of keyboard in cells 0,1,2,3,6,7, untouched with clear white gap; held under the extended right hand in cells 4/5. Never add a second mouse. In typing cells 2/3 BOTH hands are ON THE RECTANGULAR KEYBOARD over clearly visible keys. NO oval object, mouse-like blob or duplicated hand beneath the palms. No extra fingers, floating hands or ghost pose outlines. Preserve the visible pose difference between typing A/B and mouse right/left. Only hairstyle changes from reference. Opaque pure white background, white fills and black ink contours; no shadows, no color, no hatching, no texture, no labels, no text or cell borders. Return ONE complete sprite atlas.
```

## male-short

파일: `public/assets/office-male-short-v2.png`

```
Use case: precise-object-edit. Edit the supplied finished animation sprite atlas. Change ONLY the head/hair of the character in every cell to a man with a full head of short neat black cropped hair, uniformly short with a simple clean hairline and visible nape. Maintain the exact eight poses and clean minimal black line-art style with plain white shirt. Keep the same 4-column by 2-row grid, eight equal SQUARE cells, exact 2:1 overall aspect ratio and original image dimensions. Do not move, resize or redraw the body, arms, desk, modern monitor, keyboard, chair, feet or other furniture. Match the exact registration and camera view in all frames. Keep individual raised/lowered head positions in sigh frames 6/7. Preserve the mouse logic exactly: ONE physical mouse in EVERY frame; parked separately on the tabletop well to the RIGHT of keyboard in cells 0,1,2,3,6,7, untouched with clear white gap; held under the extended right hand in cells 4/5. Never add a second mouse. In typing cells 2/3 BOTH hands are ON THE RECTANGULAR KEYBOARD over clearly visible keys. NO oval object, mouse-like blob or duplicated hand beneath the palms. No extra fingers, floating hands or ghost pose outlines. Preserve the visible pose difference between typing A/B and mouse right/left. Only hairstyle changes from reference. Opaque pure white background, white fills and black ink contours; no shadows, no color, no hatching, no texture, no labels, no text or cell borders. Return ONE complete sprite atlas.
```

## male-taper

파일: `public/assets/office-male-taper-v2.png`

```
Use case: precise-object-edit. Edit the supplied finished animation sprite atlas. Change ONLY the head/hair of the character in every cell to a man with a Korean sanggo taper haircut: thick rounded black top, closely tapered sides and back, a clearly visible pale shaved lower nape; distinctly different from a uniform short crop. Maintain the exact eight poses and clean minimal black line-art style with plain white shirt. Keep the same 4-column by 2-row grid, eight equal SQUARE cells, exact 2:1 overall aspect ratio and original image dimensions. Do not move, resize or redraw the body, arms, desk, modern monitor, keyboard, chair, feet or other furniture. Match the exact registration and camera view in all frames. Keep individual raised/lowered head positions in sigh frames 6/7. Preserve the mouse logic exactly: ONE physical mouse in EVERY frame; parked separately on the tabletop well to the RIGHT of keyboard in cells 0,1,2,3,6,7, untouched with clear white gap; held under the extended right hand in cells 4/5. Never add a second mouse. In typing cells 2/3 BOTH hands are ON THE RECTANGULAR KEYBOARD over clearly visible keys. NO oval object, mouse-like blob or duplicated hand beneath the palms. No extra fingers, floating hands or ghost pose outlines. Preserve the visible pose difference between typing A/B and mouse right/left. Only hairstyle changes from reference. Opaque pure white background, white fills and black ink contours; no shadows, no color, no hatching, no texture, no labels, no text or cell borders. Return ONE complete sprite atlas.
```

