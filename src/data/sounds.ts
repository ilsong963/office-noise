import type { SoundCategory } from '../audio/types'

// Intervals are seconds AFTER playback. File gains use measured active RMS and peak ceilings.
// See AUDIO_NOTES.md for tuning and provenance. No beat grid, oscillator or synthetic recording.
export const categories: SoundCategory[] = [
  {
    "id": "keyboard",
    "name": "키보드",
    "description": "가까이서, 부드러운 타이핑",
    "icon": "keyboard",
    "group": "work",
    "soundFiles": [
      {
        "file": "keyboard/keyboard-01-typing.wav",
        "gain": 0.2092,
        "duration": 26.313,
        "trimStart": 0,
        "trimEnd": 26.313,
        "excerpt": [
          6,
          15
        ],
        "label": "키보드 타이핑",
        "originalFile": "mixkit-keyboard-typing-1386.wav"
      },
      {
        "file": "keyboard/keyboard-02-slow-typing.wav",
        "gain": 0.3094,
        "duration": 23.806,
        "trimStart": 0,
        "trimEnd": 23.8,
        "excerpt": [
          6,
          15
        ],
        "label": "느린 타이핑",
        "originalFile": "mixkit-slow-typing-on-a-keyboard-2532.wav"
      },
      {
        "file": "keyboard/keyboard-03-spacebar.mp3",
        "gain": 0.164,
        "duration": 9.927,
        "trimStart": 0.75,
        "trimEnd": 9.1,
        "excerpt": [
          0.6,
          1.7
        ],
        "weight": 0.25,
        "label": "스페이스바",
        "originalFile": "freesound_community-tapping-spacebar-102841.mp3"
      }
    ],
    "minInterval": 1.5,
    "maxInterval": 5.5,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.35,
      0.3
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.78,
    "densityCost": 1,
    "burst": {
      "chance": 0.32,
      "max": 3,
      "gap": [
        0.8,
        3.2
      ]
    },
    "initialDelay": [
      0.2,
      0.7
    ]
  },
  {
    "id": "mouse",
    "name": "마우스",
    "description": "가볍게 이어지는 클릭",
    "icon": "mouse",
    "group": "work",
    "soundFiles": [
      {
        "file": "mouse/mouse-01-double-click.wav",
        "gain": 0.2153,
        "duration": 0.465,
        "trimStart": 0.05,
        "trimEnd": 0.4,
        "label": "마우스 더블 클릭",
        "originalFile": "mixkit-fast-double-click-on-mouse-275.wav"
      }
    ],
    "minInterval": 2,
    "maxInterval": 9,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.35,
      0.3
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.66,
    "densityCost": 0.35,
    "burst": {
      "chance": 0.23,
      "max": 3,
      "gap": [
        0.45,
        2.1
      ]
    },
    "initialDelay": [
      1.5,
      4
    ]
  },
  {
    "id": "paper",
    "name": "종이",
    "description": "사각사각, 페이지를 넘기며",
    "icon": "paper",
    "group": "work",
    "soundFiles": [
      {
        "file": "paper/paper-01-page-turn.wav",
        "gain": 0.1372,
        "duration": 2.608,
        "trimStart": 0,
        "trimEnd": 2.4,
        "label": "페이지 넘기기",
        "originalFile": "mixkit-single-book-paging-1101.wav"
      }
    ],
    "minInterval": 10,
    "maxInterval": 32,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.35,
      0.3
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.48,
    "densityCost": 0.7,
    "initialDelay": [
      4,
      11
    ]
  },
  {
    "id": "pen",
    "name": "펜",
    "description": "메모하고, 잠시 생각하고",
    "icon": "pen",
    "group": "work",
    "soundFiles": [
      {
        "file": "pen/pen-01-writing.wav",
        "gain": 0.2283,
        "duration": 2.772,
        "trimStart": 0,
        "trimEnd": 2.2,
        "label": "펜으로 서명하기",
        "originalFile": "mixkit-fast-signing-with-a-pen-2370.wav"
      },
      {
        "file": "pen/pen-02-click.wav",
        "gain": 0.193,
        "duration": 1.58,
        "trimStart": 0,
        "trimEnd": 0.7,
        "label": "펜 두 번 클릭",
        "originalFile": "mixkit-pen-clicking-twice-2371.wav"
      }
    ],
    "minInterval": 8,
    "maxInterval": 26,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.35,
      0.3
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.55,
    "densityCost": 0.6,
    "initialDelay": [
      7,
      16
    ]
  },
  {
    "id": "chair",
    "name": "의자",
    "description": "가끔 자세를 고쳐 앉는 소리",
    "icon": "chair",
    "group": "room",
    "soundFiles": [
      {
        "file": "chair/chair-01-squeak.mp3",
        "gain": 0.3904,
        "duration": 25.056,
        "trimStart": 0.15,
        "trimEnd": 25.056,
        "excerpt": [
          1.2,
          3.5
        ],
        "label": "의자 삐걱임",
        "originalFile": "freesound_community-squeaking-office-chair-67137.mp3"
      }
    ],
    "minInterval": 48,
    "maxInterval": 120,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.4,
    "densityCost": 1
  },
  {
    "id": "footsteps",
    "name": "발걸음",
    "description": "조금 먼 곳을 지나가는 발걸음",
    "icon": "footsteps",
    "group": "room",
    "soundFiles": [
      {
        "file": "footsteps/footsteps-01-heels.wav",
        "gain": 0.0909,
        "duration": 5.248,
        "trimStart": 0,
        "trimEnd": 5.248,
        "label": "구두 발걸음",
        "originalFile": "mixkit-footsteps-on-heels-on-the-pavement-542.wav"
      }
    ],
    "minInterval": 80,
    "maxInterval": 180,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.34,
    "densityCost": 1.2
  },
  {
    "id": "printer",
    "name": "프린터",
    "description": "아주 가끔, 저편의 프린터",
    "icon": "printer",
    "group": "room",
    "soundFiles": [
      {
        "file": "printer/printer-01-printing.mp3",
        "gain": 0.0564,
        "duration": 13.464,
        "trimStart": 0.55,
        "trimEnd": 13.2,
        "label": "프린터 작동 01",
        "originalFile": "castlegardener-printer-sound-efx-363007.mp3"
      },
      {
        "file": "printer/printer-02-printing.mp3",
        "gain": 0.0732,
        "duration": 13.752,
        "trimStart": 0,
        "trimEnd": 13.752,
        "label": "프린터 작동 02",
        "originalFile": "freesound_community-es-printer-68850.mp3"
      }
    ],
    "minInterval": 210,
    "maxInterval": 420,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.3,
    "densityCost": 1.8,
    "prominent": true
  },
  {
    "id": "phone-vibration",
    "name": "휴대폰 진동",
    "description": "책상 위의 짧은 알림",
    "icon": "phone",
    "group": "room",
    "soundFiles": [
      {
        "file": "phone-vibration/phone-vibration-01-buzz.mp3",
        "gain": 0.1455,
        "duration": 1.128,
        "trimStart": 0,
        "trimEnd": 1.128,
        "label": "휴대폰 진동",
        "originalFile": "freesound_community-phone-vibration-96623.mp3"
      }
    ],
    "minInterval": 150,
    "maxInterval": 330,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.32,
    "densityCost": 1.4,
    "prominent": true
  },
  {
    "id": "water",
    "name": "물 마시기",
    "description": "잠깐 목을 축이는 소리",
    "icon": "drink",
    "group": "life",
    "soundFiles": [
      {
        "file": "water/water-01-bottle.wav",
        "gain": 0.073,
        "duration": 7.807,
        "trimStart": 0.25,
        "trimEnd": 7.6,
        "label": "물병으로 마시기",
        "originalFile": "mixkit-drinking-water-from-water-bottle-144.wav"
      },
      {
        "file": "water/water-02-sip.wav",
        "gain": 0.0665,
        "duration": 3.606,
        "trimStart": 0.05,
        "trimEnd": 3.4,
        "label": "빠르게 물 마시기",
        "originalFile": "mixkit-drinking-water-quickly-143.wav"
      }
    ],
    "minInterval": 90,
    "maxInterval": 200,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.36,
    "densityCost": 0.8
  },
  {
    "id": "sigh",
    "name": "한숨",
    "description": "말없이 들려오는 작은 기척",
    "icon": "breath",
    "group": "life",
    "soundFiles": [
      {
        "file": "sigh/sigh-01-female-short.mp3",
        "gain": 0.6346,
        "duration": 2.04,
        "trimStart": 0,
        "trimEnd": 1.8,
        "label": "여성의 짧은 한숨",
        "originalFile": "dragon-studio-female-sigh-450446.mp3"
      },
      {
        "file": "sigh/sigh-02-female-distant.mp3",
        "gain": 0.0613,
        "duration": 3.912,
        "trimStart": 0,
        "trimEnd": 3.912,
        "label": "조금 먼 여성의 한숨",
        "originalFile": "freesound_community-female-sigh-medium-distance-6853.mp3"
      },
      {
        "file": "sigh/sigh-03-male.mp3",
        "gain": 0.1585,
        "duration": 1.855,
        "trimStart": 0,
        "trimEnd": 1.855,
        "label": "남성의 한숨",
        "originalFile": "freesound_community-male-sigh-6763.mp3"
      },
      {
        "file": "sigh/sigh-04-deep-breath.mp3",
        "gain": 0.1393,
        "duration": 5.094,
        "trimStart": 0.05,
        "trimEnd": 4.2,
        "label": "깊은 숨과 한숨",
        "originalFile": "locrpg-deep-breath-sigh-104109.mp3"
      }
    ],
    "minInterval": 110,
    "maxInterval": 260,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.32,
    "densityCost": 1.4,
    "prominent": true
  },
  {
    "id": "sniff",
    "name": "코 훌쩍임",
    "description": "가끔 들려오는 작은 기척",
    "icon": "breath",
    "group": "life",
    "soundFiles": [
      {
        "file": "sniff/sniff-01-sniff.mp3",
        "gain": 0.1045,
        "duration": 5.28,
        "trimStart": 0.15,
        "trimEnd": 4.7,
        "label": "코 훌쩍임",
        "originalFile": "freesound_community-sniff-93949.mp3"
      }
    ],
    "minInterval": 150,
    "maxInterval": 320,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.32,
    "densityCost": 1.4,
    "prominent": true
  },
  {
    "id": "stapler",
    "name": "스테이플러",
    "description": "서류를 한 번 정리하고",
    "icon": "stapler",
    "group": "life",
    "soundFiles": [
      {
        "file": "stapler/stapler-01-staple.mp3",
        "gain": 0.1886,
        "duration": 3.192,
        "trimStart": 0,
        "trimEnd": 3.192,
        "label": "스테이플러",
        "originalFile": "freesound_community-stapler-45637.mp3"
      }
    ],
    "minInterval": 140,
    "maxInterval": 300,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.35,
    "densityCost": 1.3,
    "prominent": true
  },
  {
    "id": "nail-clipper",
    "name": "손톱깎이",
    "description": "아주 드물게 들리는 작은 딸깍",
    "icon": "clipper",
    "group": "life",
    "soundFiles": [
      {
        "file": "nail-clipper/nail-clipper-01-clip.mp3",
        "gain": 0.1029,
        "duration": 5.669,
        "trimStart": 0.85,
        "trimEnd": 4.7,
        "label": "손톱깎이",
        "originalFile": "freesound_community-nail-clippers-36768.mp3"
      }
    ],
    "minInterval": 360,
    "maxInterval": 660,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.25,
    "densityCost": 1.4,
    "prominent": true
  },
  {
    "id": "finger-tapping",
    "name": "손가락 두드림",
    "description": "생각하는 동안, 짧게",
    "icon": "fingers",
    "group": "life",
    "soundFiles": [
      {
        "file": "finger-tapping/finger-tapping-01-tap.mp3",
        "gain": 0.054,
        "duration": 10.553,
        "trimStart": 0,
        "trimEnd": 10.5,
        "excerpt": [
          0.7,
          1.7
        ],
        "label": "손가락 두드림",
        "originalFile": "freesound_community-finger-tapping-97823.mp3"
      },
      {
        "file": "finger-tapping/finger-tapping-02-nervous.mp3",
        "gain": 0.0793,
        "duration": 4.415,
        "trimStart": 0.35,
        "trimEnd": 4.415,
        "excerpt": [
          0.7,
          1.7
        ],
        "label": "초조한 손가락 두드림",
        "originalFile": "freesound_community-tapping-fingers-nervously-86163.mp3"
      }
    ],
    "minInterval": 130,
    "maxInterval": 310,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.3,
    "densityCost": 0.7
  },
  {
    "id": "zipper",
    "name": "지퍼",
    "description": "가방을 열었다 닫는 소리",
    "icon": "zipper",
    "group": "room",
    "soundFiles": [
      {
        "file": "zipper/zipper-01-zip.mp3",
        "gain": 0.1975,
        "duration": 0.914,
        "trimStart": 0,
        "trimEnd": 0.914,
        "label": "지퍼 여닫기",
        "originalFile": "u_a4gfvwagf1-zipper-sound-effect-336780.mp3"
      }
    ],
    "minInterval": 170,
    "maxInterval": 360,
    "minVolume": 0.86,
    "maxVolume": 1.06,
    "panRange": [
      -0.65,
      0.65
    ],
    "enabledByDefault": true,
    "defaultVolume": 0.32,
    "densityCost": 0.8
  }
]
