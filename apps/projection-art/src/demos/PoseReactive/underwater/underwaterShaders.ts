export const BG_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const BG_FRAG = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // 색상 팔레트
    vec3 black = vec3(0.0, 0.0, 0.0);
    vec3 deep  = vec3(0.002, 0.006, 0.020); // projection black with slight blue depth
    vec3 mid   = vec3(0.000, 0.467, 0.714); // #0077b6
    vec3 light = vec3(0.000, 0.706, 0.847); // #00b4d8
    vec3 surf  = vec3(0.565, 0.878, 0.937); // #90e0ef
    vec3 glow  = vec3(0.792, 0.941, 0.973); // #caf0f8

    // 블롭 1 — 왼쪽 상단, 청록
    vec2 b1 = vec2(0.25 + sin(uTime * 0.07) * 0.12, 0.72 + cos(uTime * 0.05) * 0.10);
    float d1 = length(uv - b1);
    float w1 = smoothstep(0.55, 0.0, d1);

    // 블롭 2 — 오른쪽 중단, 딥 블루
    vec2 b2 = vec2(0.75 + cos(uTime * 0.06) * 0.10, 0.45 + sin(uTime * 0.08) * 0.12);
    float d2 = length(uv - b2);
    float w2 = smoothstep(0.50, 0.0, d2);

    // 블롭 3 — 하단 중앙, 딥 네이비
    vec2 b3 = vec2(0.50 + sin(uTime * 0.04) * 0.15, 0.20 + cos(uTime * 0.06) * 0.08);
    float d3 = length(uv - b3);
    float w3 = smoothstep(0.60, 0.0, d3);

    // 블롭 4 — 상단 오른쪽, 서피스 글로우
    vec2 b4 = vec2(0.80 + cos(uTime * 0.09) * 0.08, 0.85 + sin(uTime * 0.07) * 0.06);
    float d4 = length(uv - b4);
    float w4 = smoothstep(0.40, 0.0, d4);

    // 블롭 5 — 왼쪽 하단, mid
    vec2 b5 = vec2(0.15 + sin(uTime * 0.05) * 0.08, 0.30 + cos(uTime * 0.09) * 0.10);
    float d5 = length(uv - b5);
    float w5 = smoothstep(0.45, 0.0, d5);

    // 중앙 radial glow: 흰 벽 프로젝션 기준, 바깥은 검정으로 빠르게 감쇠
    vec2 center = vec2(0.50 + sin(uTime * 0.08) * 0.025, 0.52 + cos(uTime * 0.07) * 0.020);
    float radial = 1.0 - smoothstep(0.08, 0.64, length(uv - center));
    float softCore = 1.0 - smoothstep(0.00, 0.24, length(uv - center));
    vec3 col = mix(black, deep, radial * 0.65);
    col += mid * radial * 0.16;
    col += light * softCore * 0.32;
    col += glow * softCore * 0.18;

    // 블롭 합성 (소프트 블렌딩)
    col = mix(col, light, w1 * 0.08 * radial);
    col = mix(col, deep,  w2 * 0.28);
    col = mix(col, deep,  w3 * 0.35);
    col = mix(col, glow,  w4 * 0.06 * radial);
    col = mix(col, mid,   w5 * 0.06 * radial);

    // 수온약층: 수평 노이즈 밴드 (얇게)
    float n = sin(uv.x * 5.2 + uTime * 0.05) * 0.010
            + sin(uv.x * 2.7 - uTime * 0.03) * 0.006;
    float band = smoothstep(0.33 + n, 0.36 + n, uv.y)
               * (1.0 - smoothstep(0.36 + n, 0.40 + n, uv.y));
    col *= mix(1.0, 0.78, band * 0.45);

    // Caustic light rays — 검정 프로젝션 위에서 더 화사하게 떠오르는 빛
    float rays = 0.0;
    for (int i = 0; i < 7; i++) {
      float fi   = float(i);
      float rx   = 0.06 + fi * 0.145 + sin(uTime * 0.20 + fi * 1.4) * 0.055;
      float dist = abs(uv.x - rx);
      float fade = max(0.0, 1.0 - (1.0 - uv.y) / (0.72 + fi * 0.030));
      float ray = max(0.0, (0.026 - dist) / 0.026);
      rays += ray * ray * fade;
    }
    col += vec3(rays * 0.30, rays * 0.58, rays * 0.68) * radial;

    // 부드러운 caustic shimmer patches
    float caustic = 0.0;
    caustic += pow(max(0.0, sin((uv.x * 18.0 + sin(uv.y * 6.0 + uTime * 0.35)) + uTime * 0.55)), 7.0);
    caustic += pow(max(0.0, sin((uv.x * 11.0 - uv.y * 4.0) - uTime * 0.42)), 9.0);
    caustic *= smoothstep(0.18, 0.92, uv.y) * 0.12 * radial;
    col += vec3(caustic * 0.52, caustic * 1.05, caustic * 1.15);

    // 수면 쪽 밝은 빛 번짐 + 아래쪽 fog darkening
    float surfaceGlow = smoothstep(0.42, 1.0, uv.y) * radial;
    col += glow * surfaceGlow * 0.075;
    col *= mix(0.012, 1.0, radial);

    // 물 흐름 같은 아주 느린 유기적 vignette
    float current = sin((uv.x + uv.y) * 9.0 + uTime * 0.18) * 0.5 + 0.5;
    col += vec3(0.0, 0.080, 0.105) * current * 0.040 * radial;
    col *= 1.0 - smoothstep(0.42, 0.70, length(uv - center)) * 0.94;
    col = min(col, vec3(0.20, 0.46, 0.52));

    gl_FragColor = vec4(col, 1.0);
  }
`
