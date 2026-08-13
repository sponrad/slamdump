import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const LABEL_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 28,
  fill: 0x1a1a1a,
  fontWeight: 'bold',
});

const SECONDARY_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 22,
  fill: 0x222222,
  fontWeight: 'bold',
});

export function makeButton(
  label: string,
  width: number,
  height: number,
  secondary = false
): Container {
  const btn = new Container();
  btn.eventMode = 'static';
  btn.cursor = 'pointer';

  const bg = new Graphics();
  bg.roundRect(-width / 2, -height / 2, width, height, 8).fill({ color: 0xffffff });
  bg.stroke({ color: 0xdddddd, width: 1, alpha: 0.9 });
  btn.addChild(bg);

  const text = new Text({ text: label, style: secondary ? SECONDARY_STYLE : LABEL_STYLE });
  text.anchor.set(0.5);
  btn.addChild(text);

  btn.on('pointerdown', () => {
    btn.scale.set(0.96);
  });
  btn.on('pointerup', () => {
    btn.scale.set(1);
  });
  btn.on('pointerupoutside', () => {
    btn.scale.set(1);
  });

  return btn;
}

export function fitDesignToScreen(
  designW: number,
  designH: number,
  screenW: number,
  screenH: number
): { scale: number; offsetX: number; offsetY: number } {
  const scale = Math.min(screenW / designW, screenH / designH);
  const offsetX = (screenW - designW * scale) / 2;
  const offsetY = (screenH - designH * scale) / 2;
  return { scale, offsetX, offsetY };
}
