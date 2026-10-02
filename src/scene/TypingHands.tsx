type Pose = 0 | 1 | 2 | 3

// Only the four finger arcs change. Thumb, palm and wrist anchors are shared
// by every pose so the hand stays attached and the keyboard never moves.
const fingerTravel: Record<Pose, readonly number[]> = {
  0: [0, 0, 0, 0],
  1: [-1, 1, -1, 1],
  2: [2, -1, 2, -1],
  3: [-1, 2, -1, 2],
}

export function typingHandParts(pose: Pose) {
  const [index, middle, ring, little] = fingerTravel[pose]
  return {
    thumb: 'M254 199 Q250 197 250 192 L250 190 Q250 187 252 187 Q255 187 256 191 L257 192',
    fingers: [
      `L257 ${188 + index} Q257 ${184 + index} 260 ${184 + index} Q264 ${184 + index} 264 ${188 + index} L264 191`,
      `L265 ${187 + middle} Q266 ${183 + middle} 269 ${183 + middle} Q273 ${183 + middle} 272 ${187 + middle} L271 191`,
      `L273 ${188 + ring} Q275 ${184 + ring} 278 ${185 + ring} Q281 ${186 + ring} 279 ${189 + ring} L278 193`,
      `L281 ${190 + little} Q283 ${186 + little} 286 ${187 + little} Q289 ${190 + little} 286 ${193 + little} L283 195`,
    ],
    palm: 'Q281 202 270 207 L254 199 Z',
  }
}

export default function TypingHands({ pose }: { pose: Pose }) {
  const hand = typingHandParts(pose)
  return <svg className="office-sprite-pose office-typing-drawing" viewBox="0 0 443.5 443.5" aria-hidden="true" data-hand-pose={pose}>
    {/* Static reconstruction hides the baked-in hands; only the hand paths vary. */}
    <g className="office-typing-desk">
      <path d="M228 168 L243 174 L243 178 H299 V210 H278 V235 H235 L230 204 Z" fill="white"/>
      <g fill="none" stroke="#292929" strokeWidth="2.1" strokeLinejoin="round">
        <path d="M289 180 H299 M271 217 H278 M271 228 H278"/>
        <path fill="white" d="M241 180 H288 L295 205 H248 Z"/>
      </g>
      <g fill="none" stroke="#555" strokeWidth=".8" strokeLinejoin="round">
        {[0, 1, 2].map(row => <g key={row}>{Array.from({ length: 9 }, (_, col) => {
          const x = 245 + col * 4.7 + row * 1.6, y = 184 + row * 5.3
          return <path key={col} d={`M${x} ${y} h3.3 l.8 3.4 h-3.3 Z`}/>
        })}</g>)}
        <path d="M254 200 H277 L278 203 H255 Z M281 200 H289 L290 203 H282 Z"/>
      </g>
    </g>
    <g fill="white" stroke="#292929" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path className="office-hand-right" d={[hand.thumb, ...hand.fingers, hand.palm].join(' ')}/>
      {/* Sleeve and wrist connections remain registered in every pose. */}
      <path fill="white" stroke="none" d="M227 170 C237 183 241 195 249 202 L254 197 Q264 198 272 205 C269 221 256 234 241 230 L235 225 L230 202 Z"/>
      <path fill="none" d="M227 170 C237 183 241 195 249 202 L254 197 Q264 198 272 205 C269 221 256 234 241 230 L237 228 L236 235"/>
      <path fill="none" strokeWidth="1.2" d="M253 198 Q263 201 270 206"/>
    </g>
  </svg>
}
