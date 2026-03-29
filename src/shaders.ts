import { uv, vec2 } from "three/tsl";

export const iuv = () => vec2(uv().x, uv().y.oneMinus());