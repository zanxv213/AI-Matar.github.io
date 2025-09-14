export enum Tool {
  Select = 'SELECT',
  Brush = 'BRUSH',
  MagicEraser = 'MAGIC_ERASER',
  Transform = 'TRANSFORM',
  Expand = 'EXPAND',
  RemoveBg = 'REMOVE_BG',
  Enhance = 'ENHANCE',
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
