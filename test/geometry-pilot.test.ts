import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { GEOMETRY_PILOT_KEY } from '../src/lib/games/geometryPilot';

const source = readFileSync('public/games/geometry-pilot.js', 'utf8');
const html = readFileSync('public/monkey-invaders.html', 'utf8');
const global = new Function('window', source + '; return window.MetaPetGeometryPilot;')({});

describe('Monkey Invaders geometry pilot', () => {
  it('shares one cache key and rejects unsupported/corrupt sessions', () => {
    expect(global.key).toBe(GEOMETRY_PILOT_KEY);
    for (const packet of ['bad json', '{}', JSON.stringify({version:1,image:'data:image/svg+xml,evil'}), JSON.stringify({version:2,image:'data:image/png;base64,AAAA'})]) {
      expect(global.read({ getItem: () => packet })).toBeNull();
    }
    expect(global.read({getItem: () => {throw new Error('Denied');}})).toBeNull();
  });
  it('draws decoded local pixels and allows returning to the original monkey', () => {
    let candidate: {naturalWidth:number;naturalHeight:number;onload:()=>void} | null = null;
    class ImageMock { naturalWidth=256;naturalHeight=256;onload=()=>{};constructor(){candidate=this;} }
    const button = document.createElement('button');
    const pilot = global.create({ button, ImageClass:ImageMock, storage:{getItem:()=>JSON.stringify({version:1,image:'data:image/png;base64,AAAA'})} });
    const context={drawImage:vi.fn()};
    expect(pilot.draw(context,1,2,80,80)).toBe(false);
    candidate!.onload();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('Pilot: Geometry');
    expect(pilot.draw(context,1,2,80,80)).toBe(true);
    expect(context.drawImage).toHaveBeenCalledWith(candidate,1,2,80,80);
    button.click();
    expect(pilot.draw(context,1,2,80,80)).toBe(false);
    expect(button.textContent).toBe('Pilot: Monkey');
  });
  it('runs the real player draw path with the geometry pilot and shared weapon effects', () => {
    const start=html.indexOf('        function drawMonkey(');
    const end=html.indexOf('        function drawAlien(', start);
    const monkey={width:60,height:60,powerups:{bazooka:true}};
    const context=Object.fromEntries(['save','translate','scale','fillRect','beginPath','arc','fill','restore'].map(name=>[name,vi.fn()]));
    const pilot={draw:vi.fn(()=>true)};
    const draw=new Function('ctx','monkey','geometryPilot', 'return ('+html.slice(start,end).trim()+');')(context,monkey,pilot);
    draw(100,200,true);
    expect(pilot.draw).toHaveBeenCalledWith(context,-40,-40,80,80);
    expect(context.scale).toHaveBeenCalledWith(-1,1);
    expect(context.fillRect).toHaveBeenCalledTimes(2); // Shared bazooka barrel/shading remain visible.
    expect(context.arc).toHaveBeenCalledWith(43,-2,6,0,Math.PI*2);
    expect(monkey.width).toBe(60);expect(monkey.height).toBe(60);
  });
});
