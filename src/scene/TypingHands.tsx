type Pose = 0 | 1 | 2 | 3

// Closed hand silhouettes bend at the fingers; no keyboard pixels move with them.
const rightHands: Record<Pose, string> = {
  0: 'M254 199 Q253 195 257 191 L263 184 Q265 182 267 184 L263 191 L271 182 Q273 180 275 182 L270 192 L278 185 Q280 183 282 185 L276 195 L283 190 Q286 189 286 192 L279 200 Q276 204 270 207 Z',
  1: 'M254 199 Q252 194 257 188 L261 179 Q263 177 265 179 L263 188 L269 176 Q271 174 273 177 L270 188 L277 179 Q280 177 281 180 L276 191 L283 186 Q286 185 287 188 L279 198 Q276 204 270 207 Z',
  2: 'M254 199 Q253 195 257 190 L262 182 Q264 180 266 182 L263 190 L271 183 Q274 181 275 184 L270 192 L278 187 Q281 185 282 188 L276 195 L283 191 Q286 190 286 193 L279 200 Q276 204 270 207 Z',
  3: 'M254 199 Q253 195 258 192 L264 187 Q267 185 268 188 L264 193 L270 179 Q272 177 274 179 L271 190 L277 183 Q280 181 281 184 L276 195 L282 193 Q286 192 286 195 L279 201 Q275 205 270 207 Z',
}
const leftHands: Record<Pose, string> = {
  0: 'M243 197 L241 192 L244 184 Q246 182 248 184 L247 190 L251 182 Q253 181 254 184 L252 190 L257 185 Q260 184 260 187 L257 192 L261 191 Q263 192 261 195 L254 201 Z',
  1: 'M243 197 L241 191 L243 181 Q245 179 247 181 L247 188 L250 178 Q252 176 254 179 L253 188 L257 181 Q260 180 260 183 L257 190 L261 187 Q264 188 262 191 L254 201 Z',
  2: 'M243 197 L241 192 L244 187 Q246 185 248 187 L247 192 L251 180 Q253 178 255 181 L253 190 L258 184 Q260 183 261 186 L257 193 L261 191 Q264 192 261 195 L254 201 Z',
  3: 'M243 197 L241 192 L244 182 Q246 180 248 182 L247 190 L251 185 Q254 184 255 186 L252 192 L257 188 Q260 186 261 189 L257 194 L261 192 Q264 193 261 196 L254 201 Z',
}

export default function TypingHands({ pose }: { pose: Pose }) {
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
      <path className="office-hand-left" d={leftHands[pose]}/>
      <path className="office-hand-right" d={rightHands[pose]}/>
      {/* Sleeve and wrist connections remain registered in every pose. */}
      <path fill="white" stroke="none" d="M227 170 C237 183 241 195 249 202 L254 197 Q264 198 272 205 C269 221 256 234 241 230 L235 225 L230 202 Z"/>
      <path fill="none" d="M227 170 C237 183 241 195 249 202 L254 197 Q264 198 272 205 C269 221 256 234 241 230 L237 228 L236 235"/>
      <path fill="none" strokeWidth="1.2" d="M253 198 Q263 201 270 206"/>
    </g>
  </svg>
}
